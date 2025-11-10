# JMeter Load Testing Toolkit

Ce dossier contient l’infrastructure nécessaire pour rejouer les scénarios de charge décrits dans les spécifications (READ-heavy, JOIN filter, MIXED, HEAVY-body) contre chacune des variantes backend.

## Structure

```
jmeter/
├── README.md                ← ce guide
├── Dockerfile               ← image JMeter customisée (plugins + InfluxDB v2)
├── run.sh                   ← script d’exécution (CLI) utilisé par le service Docker
├── plans/
│   ├── read-heavy.jmx
│   ├── join-filter.jmx
│   ├── mixed-entities.jmx
│   └── heavy-body.jmx
├── data/
│   ├── categories.csv       ← identifiants de catégories (1 colonne `categoryId`)
│   └── items.csv            ← identifiants d’articles (1 colonne `itemId`)
└── results/                 ← rapports & `jtl` générés (gitignored)
```

## Pré-requis

1. **Données seedées**  
   Lancer l’interface `/seed` pour créer les 2 000 catégories et 100 000 articles (ou importer un dump).  
   Exporter ensuite les identifiants vers les fichiers CSV :

   ```sql
   \COPY (SELECT id AS categoryId FROM category ORDER BY id) TO 'jmeter/data/categories.csv' WITH (FORMAT csv, HEADER true);
   \COPY (SELECT id AS itemId FROM item ORDER BY id)       TO 'jmeter/data/items.csv'      WITH (FORMAT csv, HEADER true);
   ```

   > Les tests écrivent dans la base (POST/PUT/DELETE). Utiliser une base dédiée ou la réinitialiser entre deux campagnes.

2. **InfluxDB 2.x**  
   Le `docker-compose.yml` expose un service `influxdb` initialisé avec :

   - URL : `http://influxdb:8086`
   - Organisation : `perf`
   - Bucket : `jmeter`
   - Token : `jmeter-dev-token`

   Les métriques JMeter sont publiées via le Backend Listener InfluxDB v2.

## Démarrage rapide

1. Construire les images et démarrer DB/Influx (si nécessaire) :

   ```bash
   docker compose up -d --build influxdb
   ```

2. Lancer un scénario (ex. READ-heavy sur la variante RestController) :

   ```bash
   docker compose run --rm \
     -e SCENARIO=read-heavy \
     -e VARIANT=restcontroller \
     jmeter
   ```

   Variables disponibles :

   | Variable            | Valeur par défaut                                      |
   |---------------------|--------------------------------------------------------|
   | `SCENARIO`          | `read-heavy` (`join-filter`, `mixed`, `heavy-body`)     |
   | `VARIANT`           | `restcontroller` (`jersey`, `spring-data-rest`)        |
   | `BASE_URL`          | Déduit de `VARIANT` (peut être forcé)                  |
   | `INFLUX_URL`        | `http://influxdb:8086`                                 |
   | `INFLUX_TOKEN`      | `jmeter-dev-token`                                     |
   | `INFLUX_ORG`        | `perf`                                                 |
   | `INFLUX_BUCKET`     | `jmeter`                                               |
   | `CSV_CATEGORIES`    | `/test/data/categories.csv`                            |
   | `CSV_ITEMS`         | `/test/data/items.csv`                                 |

3. Les résultats (`.jtl` + rapport HTML) sont déposés dans `jmeter/results/SCENARIO-YYYYMMDDHHMM`.

## Scénarios couverts

Les plans JMX implémentent exactement les ratios et paliers fournis :

1. **READ-heavy (relation incluse)** — 3 paliers (50 → 100 → 200 threads, ramp-up 60 s, hold 10 min).
2. **JOIN-filter ciblé** — 2 paliers (60 → 120 threads, ramp-up 60 s, hold 8 min).
3. **MIXED (écritures)** — 2 paliers (50 → 100 threads, hold 10 min) avec POST/PUT/DELETE.
4. **HEAVY-body (5 KB)** — 2 paliers (30 → 60 threads, hold 8 min) avec payloads 5 KB.

Chaque plan contient :

- `HTTP Request Defaults` + `HTTP Header Manager` (JSON, Accept/Content-Type).
- `CSV Data Set Config` pour injecter `categoryId` et `itemId`.
- `JSR223 PreProcessor` (Groovy) pour générer des payloads aléatoires, uniques et de taille contrôlée.
- `Backend Listener` InfluxDB v2 (`rocks.nt.apm.jmeter.influxdb2.visualizer.InfluxDBBackendListenerClient`).

## Bonnes pratiques / options

- **Listeners lourds** (View Results Tree, Summary Report…) ne sont pas ajoutés pour éviter l’overhead. Ajouter seulement pour du debug ponctuel.
- **JOIN FETCH toggle** : exposez votre feature flag côté backend (env var) puis lancez deux runs comparatifs (avec/sans flag).
- **Visualisation** : connecter Grafana / Chronograf au bucket `jmeter`.
- **Sécurité** : pour une campagne CI, externaliser les secrets Influx (`INFLUX_TOKEN`) dans un fichier `.env` non versionné.

## Execution hors Docker

Il est possible de lancer localement :

```bash
JMETER_HOME=/path/apache-jmeter-5.6.3
$JMETER_HOME/bin/jmeter -n \
  -t jmeter/plans/read-heavy.jmx \
  -JbaseUrl=http://localhost:8081 \
  -JcsvCategories=jmeter/data/categories.csv \
  -JcsvItems=jmeter/data/items.csv \
  -JinfluxUrl=http://localhost:8086 \
  -JinfluxToken=... \
  -JinfluxOrg=perf \
  -JinfluxBucket=jmeter \
  -l jmeter/results/read-heavy.jtl
```

Pensez simplement à copier le jar `jmeter-influxdb2-listener` dans `${JMETER_HOME}/lib/ext/`.


