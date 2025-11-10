import { KpiCard } from "@/components/KpiCard";
import { TableCard } from "@/components/TableCard";
import { VariantSwitcher } from "@/components/VariantSwitcher";
import {
  API_VARIANTS,
  ApiVariantKey,
  fetchCategories,
  fetchItems,
  fetchItemsByCategory
} from "@/lib/api";
import Link from "next/link";

const attentionPoints = [
  {
    title: "N+1",
    details:
      "Exposer deux modes internes (flag env) : mode JOIN FETCH et projection DTO pour /items?."
  },
  {
    title: "Pagination",
    details: "Requêtes identiques (page/size constants)."
  },
  {
    title: "Validation",
    details: "Bean Validation activée de façon homogène."
  },
  {
    title: "Sérialisation",
    details: "Via Jackson, payloads alignés."
  },
  {
    title: "Service unique",
    details: "Un seul service lançé pendant les mesures."
  }
];

const t0ConfigRows = [
  {
    element: "Machine (CPU, coeurs, RAM)",
    valeur: "MacBook Pro – Intel Core i7-7700HQ (4 cœurs / 8 threads), 16 Go RAM"
  },
  {
    element: "OS / Kernel",
    valeur: "macOS 13.7.2 (22H313) – Darwin 22.6.0"
  },
  {
    element: "Java version",
    valeur: "Eclipse Temurin 17 (images Docker) · OpenJDK 23.0.1 sur l’hôte"
  },
  {
    element: "Docker/Compose versions",
    valeur: "Docker 27.5.1 · Docker Compose v2.32.4-desktop.1"
  },
  {
    element: "PostgreSQL version",
    valeur: "postgres:16-alpine (service `db` docker-compose)"
  },
  {
    element: "JMeter version",
    valeur: "Apache JMeter 5.6.3 (image custom + plugins jpgc-standard, jpgc-casutg, InfluxDB v2)"
  },
  {
    element: "Prometheus / Grafana / InfluxDB",
    valeur: "Prometheus 2.52.0 · Grafana 10.4.1 · InfluxDB 2.7"
  },
  {
    element: "JVM flags (Xms/Xmx, GC)",
    valeur: "JAVA_OPTS vide → G1GC par défaut, heap dynamique (Xms/Xmx auto)"
  },
  {
    element: "HikariCP (min/max/timeout)",
    valeur: "minimumIdle=10 · maximumPoolSize=20 · connectionTimeout=30 s"
  }
];

const t1ScenarioRows = [
  {
    scenario: "READ-heavy (relation)",
    mix: "50 % GET /api/items?page=0-20&size=50 · 20 % GET /api/items?categoryId=CSV&page=0-10&size=50 · 20 % GET /api/categories/{id}/items?page=0-10&size=50 · 10 % GET /api/categories?page=0-20&size=50",
    threads: "50 ➜ 100 ➜ 200 utilisateurs",
    rampup: "Ramp-up 60 s par palier",
    duree: "Hold 10 min (600 s) par palier",
    payload: "Lecture JSON (aucun corps)"
  },
  {
    scenario: "JOIN-filter ciblé",
    mix: "70 % GET /api/items?categoryId=CSV&page=0-10&size=50 · 30 % GET /api/items/{id}",
    threads: "60 ➜ 120 utilisateurs",
    rampup: "Ramp-up 60 s par palier",
    duree: "Hold 8 min (480 s) par palier",
    payload: "Lecture JSON (aucun corps)"
  },
  {
    scenario: "MIXED (2 entités)",
    mix: "40 % GET /api/items?page=0-20&size=50 · 20 % POST /api/items (1024 B) · 10 % PUT /api/items/{id} (1024 B) · 10 % DELETE /api/items/{id} · 10 % GET /api/categories?page=0-20&size=50 · 10 % POST /api/categories (512-1024 B)",
    threads: "50 ➜ 100 utilisateurs",
    rampup: "Ramp-up 60 s par palier",
    duree: "Hold 10 min (600 s) par palier",
    payload: "Items 1 KB · Catégories 0,5-1 KB"
  },
  {
    scenario: "HEAVY-body (payloads 5 KB)",
    mix: "50 % POST /api/items (5 KB) · 50 % PUT /api/items/{id} (5 KB)",
    threads: "30 ➜ 60 utilisateurs",
    rampup: "Ramp-up 60 s par palier",
    duree: "Hold 8 min (480 s) par palier",
    payload: "JSON 5 KB (champ `details` surdimensionné)"
  }
];

const notMeasured = "En attente (import InfluxDB → Grafana panel)";

const t2ResultRows = [
  { scenario: "READ-heavy", mesure: "RPS moyen", variantA: notMeasured, variantC: notMeasured, variantD: notMeasured },
  { scenario: "READ-heavy", mesure: "p50 (ms)", variantA: notMeasured, variantC: notMeasured, variantD: notMeasured },
  { scenario: "READ-heavy", mesure: "p95 (ms)", variantA: notMeasured, variantC: notMeasured, variantD: notMeasured },
  { scenario: "READ-heavy", mesure: "p99 (ms)", variantA: notMeasured, variantC: notMeasured, variantD: notMeasured },
  { scenario: "READ-heavy", mesure: "Err %", variantA: notMeasured, variantC: notMeasured, variantD: notMeasured },
  { scenario: "JOIN-filter", mesure: "RPS moyen", variantA: notMeasured, variantC: notMeasured, variantD: notMeasured },
  { scenario: "JOIN-filter", mesure: "p50 (ms)", variantA: notMeasured, variantC: notMeasured, variantD: notMeasured },
  { scenario: "JOIN-filter", mesure: "p95 (ms)", variantA: notMeasured, variantC: notMeasured, variantD: notMeasured },
  { scenario: "JOIN-filter", mesure: "p99 (ms)", variantA: notMeasured, variantC: notMeasured, variantD: notMeasured },
  { scenario: "JOIN-filter", mesure: "Err %", variantA: notMeasured, variantC: notMeasured, variantD: notMeasured },
  { scenario: "MIXED (2 entités)", mesure: "RPS moyen", variantA: notMeasured, variantC: notMeasured, variantD: notMeasured },
  { scenario: "MIXED (2 entités)", mesure: "p50 (ms)", variantA: notMeasured, variantC: notMeasured, variantD: notMeasured },
  { scenario: "MIXED (2 entités)", mesure: "p95 (ms)", variantA: notMeasured, variantC: notMeasured, variantD: notMeasured },
  { scenario: "MIXED (2 entités)", mesure: "p99 (ms)", variantA: notMeasured, variantC: notMeasured, variantD: notMeasured },
  { scenario: "MIXED (2 entités)", mesure: "Err %", variantA: notMeasured, variantC: notMeasured, variantD: notMeasured },
  { scenario: "HEAVY-body", mesure: "RPS moyen", variantA: notMeasured, variantC: notMeasured, variantD: notMeasured },
  { scenario: "HEAVY-body", mesure: "p50 (ms)", variantA: notMeasured, variantC: notMeasured, variantD: notMeasured },
  { scenario: "HEAVY-body", mesure: "p95 (ms)", variantA: notMeasured, variantC: notMeasured, variantD: notMeasured },
  { scenario: "HEAVY-body", mesure: "p99 (ms)", variantA: notMeasured, variantC: notMeasured, variantD: notMeasured },
  { scenario: "HEAVY-body", mesure: "Err %", variantA: notMeasured, variantC: notMeasured, variantD: notMeasured }
];

const t3ResourceRows = [
  {
    variant: "A : Jersey",
    cpu: "Prometheus job backend-jersey-jmx → rate(process_cpu_seconds_total[1m])",
    heap: "jvm_memory_used_bytes{area=\"heap\", job=\"backend-jersey-jmx\"}",
    gc: "jvm_gc_pause_seconds_sum/job=\"backend-jersey-jmx\"",
    threads: "jvm_threads_live_threads (backend-jersey-jmx)",
    hikari: "hikaricp_active_connections / hikaricp_max_connections"
  },
  {
    variant: "C : @RestController",
    cpu: "job backend-restcontroller-jmx → rate(process_cpu_seconds_total[1m])",
    heap: "jvm_memory_used_bytes{area=\"heap\", job=\"backend-restcontroller-jmx\"}",
    gc: "jvm_gc_pause_seconds_sum/job=\"backend-restcontroller-jmx\"",
    threads: "jvm_threads_live_threads (backend-restcontroller-jmx)",
    hikari: "hikaricp_active_connections / hikaricp_max_connections"
  },
  {
    variant: "D : Spring Data REST",
    cpu: "job backend-spring-data-rest-jmx → rate(process_cpu_seconds_total[1m])",
    heap: "jvm_memory_used_bytes{area=\"heap\", job=\"backend-spring-data-rest-jmx\"}",
    gc: "jvm_gc_pause_seconds_sum/job=\"backend-spring-data-rest-jmx\"",
    threads: "jvm_threads_live_threads (backend-spring-data-rest-jmx)",
    hikari: "hikaricp_active_connections / hikaricp_max_connections"
  }
];

const t4JoinRows = [
  {
    endpoint: "GET /items?categoryId=",
    variantA: "Jersey `ItemResource.list` → `ItemService.list` (ItemRepository#findAllByCategory)",
    variantC: "@RestController `ItemController.list` → `ItemService.list` (+ DTO mapper)",
    variantD: "Spring Data REST `/api/items/search/findAllByCategory?category=/{id}`",
    rps: notMeasured,
    p95: notMeasured,
    err: notMeasured,
    observations: "Comparer la surcharge HAL vs DTO et l’impact JOIN FETCH éventuel."
  },
  {
    endpoint: "GET /categories/{id}/items",
    variantA: "Jersey `CategoryResource.listItems` → service + Page<ItemResponse>",
    variantC: "@RestController `CategoryController.listItems`",
    variantD: "Spring Data REST association `/api/categories/{id}/items` (collection HAL)",
    rps: notMeasured,
    p95: notMeasured,
    err: notMeasured,
    observations: "Mesurer la pagination relationnelle et l’impact HAL (links, embedded)."
  }
];

const t5MixedRows = [
  {
    endpoint: "GET /items",
    variantA: "Jersey `ItemResource.list` (Page<ItemResponse>)",
    variantC: "@RestController `ItemController.list` (DTO ItemResponse)",
    variantD: "Spring Data REST `/api/items` (HAL + projections)",
    rps: notMeasured,
    p95: notMeasured,
    err: notMeasured,
    observations: "Comparer la sérialisation DTO vs HAL et la pagination standard."
  },
  {
    endpoint: "POST /items",
    variantA: "Jersey `ItemResource.create` (validation Jakarta + Location header)",
    variantC: "@RestController `ItemController.create`",
    variantD: "Spring Data REST POST `/api/items` (évènements SDR)",
    rps: notMeasured,
    p95: notMeasured,
    err: notMeasured,
    observations: "Payload 1 KB généré (Groovy) → vérifier performances d’écriture."
  },
  {
    endpoint: "PUT /items/{id}",
    variantA: "Jersey `ItemResource.update`",
    variantC: "@RestController `ItemController.update`",
    variantD: "Spring Data REST PUT `/api/items/{id}`",
    rps: notMeasured,
    p95: notMeasured,
    err: notMeasured,
    observations: "Mêmes DTO que POST, impact sur versioning / validation."
  },
  {
    endpoint: "DELETE /items/{id}",
    variantA: "Jersey `ItemResource.delete` → Response.noContent()",
    variantC: "@RestController `ItemController.delete` → HTTP 204",
    variantD: "Spring Data REST DELETE `/api/items/{id}`",
    rps: notMeasured,
    p95: notMeasured,
    err: notMeasured,
    observations: "Tester verrouillage optimiste / cohérence contraintes FK."
  },
  {
    endpoint: "GET /categories",
    variantA: "Jersey `CategoryResource.list`",
    variantC: "@RestController `CategoryController.list`",
    variantD: "Spring Data REST `/api/categories` (collection HAL)",
    rps: notMeasured,
    p95: notMeasured,
    err: notMeasured,
    observations: "Comparer poids HAL vs DTO et temps de sérialisation."
  },
  {
    endpoint: "POST /categories",
    variantA: "Jersey `CategoryResource.create`",
    variantC: "@RestController `CategoryController.create`",
    variantD: "Spring Data REST POST `/api/categories`",
    rps: notMeasured,
    p95: notMeasured,
    err: notMeasured,
    observations: "Payload 512-1024 B (description aléatoire)."
  }
];

const t6IncidentRows = [
  {
    run: "À compléter après campagne",
    variant: "N/A",
    type: "Rien à signaler pour l’instant",
    cause: "Exécuter un scénario JMeter pour remplir ce tableau",
    action: "Importer les incidents depuis InfluxDB / journaux et documenter ici"
  }
];

const t7SummaryRows = [
  { criteres: "Débit global (RPS)", best: "", gap: "", comments: "" },
  { criteres: "Latence p95", best: "", gap: "", comments: "" },
  { criteres: "Stabilité (erreurs)", best: "", gap: "", comments: "" },
  { criteres: "Empreinte CPU/RAM", best: "", gap: "", comments: "" },
  {
    criteres: "Facilité d'expo relationnelle",
    best: "",
    gap: "",
    comments: ""
  }
];

const numberFormatter = new Intl.NumberFormat("fr-FR");
const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR"
});
const dateTimeFormatter = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "short",
  timeStyle: "short"
});

const VARIANT_KEYS = Object.keys(API_VARIANTS) as ApiVariantKey[];

function resolveVariantKey(
  value?: string | string[]
): ApiVariantKey {
  const normalized = Array.isArray(value) ? value[0] : value;
  if (normalized && VARIANT_KEYS.includes(normalized as ApiVariantKey)) {
    return normalized as ApiVariantKey;
  }
  return "restcontroller";
}

type DashboardPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function DashboardPage({
  searchParams
}: DashboardPageProps) {
  const variantKey = resolveVariantKey(searchParams?.variant);
  const variantConfig = API_VARIANTS[variantKey];
  const displayBaseUrl = variantConfig.baseUrl;
  const internalBaseUrl = variantConfig.internalBaseUrl;
  let categoriesPage = null;
  let itemsPage = null;
  let relationPage = null;
  let errorMessage: string | null = null;

  try {
    const [categoriesResponse, itemsResponse] = await Promise.all([
      fetchCategories({
        page: 0,
        size: 200,
        variant: variantKey,
        baseUrl: internalBaseUrl
      }),
      fetchItems({
        page: 0,
        size: 200,
        variant: variantKey,
        baseUrl: internalBaseUrl
      })
    ]);

    categoriesPage = categoriesResponse;
    itemsPage = itemsResponse;

    if (categoriesResponse.content.length > 0) {
      relationPage = await fetchItemsByCategory(
        categoriesResponse.content[0].id,
        {
          page: 0,
          size: 200,
          variant: variantKey,
          baseUrl: internalBaseUrl
        }
      );
    }
  } catch (error) {
    errorMessage =
      error instanceof Error ? error.message : "Erreur inattendue.";
  }

  const categories = categoriesPage?.content ?? [];
  const items = itemsPage?.content ?? [];
  const relationItems = relationPage?.content ?? [];

  const totalCategories =
    categoriesPage?.totalElements ?? categories.length ?? 0;
  const totalItems = itemsPage?.totalElements ?? items.length ?? 0;
  const totalStock = items.reduce((acc, item) => acc + (item.stock ?? 0), 0);

  const averagePrice =
    items.length > 0
      ? items.reduce((sum, item) => sum + Number(item.price ?? 0), 0) /
        items.length
      : 0;

  const itemsByCategory = items.reduce<Record<number, number>>((acc, item) => {
    if (item.categoryId != null) {
      acc[item.categoryId] = (acc[item.categoryId] ?? 0) + 1;
    }
    return acc;
  }, {});

  const stockByCategory = items.reduce<Record<number, number>>((acc, item) => {
    if (item.categoryId != null) {
      acc[item.categoryId] =
        (acc[item.categoryId] ?? 0) + Number(item.stock ?? 0);
    }
    return acc;
  }, {});

  const topStockItems = [...items]
    .sort((a, b) => b.stock - a.stock)
    .slice(0, 5);

  const apiSnapshotRows = [
    {
      element: "Variante sélectionnée",
      valeur: variantConfig.label
    },
    {
      element: "Base URL",
      valeur: displayBaseUrl
    },
    {
      element: "Catégories chargées",
      valeur: numberFormatter.format(totalCategories)
    },
    {
      element: "Articles chargés",
      valeur: numberFormatter.format(totalItems)
    },
    {
      element: "Stock cumulé",
      valeur: numberFormatter.format(totalStock)
    },
    {
      element: "Dernière mise à jour catégorie",
      valeur:
        categories.length > 0
          ? dateTimeFormatter.format(new Date(categories[0].updatedAt))
          : "—"
    }
  ];

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-10 flex flex-col gap-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex-1">
            <p className="text-sm uppercase tracking-wide text-primary-600">
              Benchmark de performances des Web Services REST
            </p>
            <h1 className="mt-2 text-4xl font-bold text-slate-900">
              Tableau de bord de pilotage
            </h1>
            <p className="mt-4 max-w-3xl text-base text-slate-600">
              Visualisez et complétez les indicateurs clefs pour comparer les
              variantes A (Jersey), C (@RestController) et D (Spring Data REST) à
              partir de vos campagnes JMeter, Prometheus et analyses.
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 md:items-end">
            <VariantSwitcher current={variantKey} />
            <Link
              href={`/seed?variant=${variantKey}`}
              className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-300"
            >
              Ajouter des données
            </Link>
          </div>
        </div>
      </header>

      {errorMessage ? (
        <section className="mb-8 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          <p className="font-semibold">Erreur lors du chargement des données</p>
          <p className="text-sm">{errorMessage}</p>
          <p className="mt-2 text-xs text-red-600">
            Vérifiez que les services backend sont accessibles et que les
            variables NEXT_PUBLIC_* pointent vers les bonnes URL.
          </p>
        </section>
      ) : null}

      <section className="mb-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Catégories disponibles"
          value={numberFormatter.format(totalCategories)}
          description="Données issues de GET /api/categories"
        />
        <KpiCard
          label="Articles en catalogue"
          value={numberFormatter.format(totalItems)}
          description="Résultat de GET /api/items"
        />
        <KpiCard
          label="Stock cumulé"
          value={numberFormatter.format(totalStock)}
          description="Somme du champ stock pour chaque item"
        />
        <KpiCard
          label="Prix moyen"
          value={currencyFormatter.format(averagePrice || 0)}
          description="Moyenne du prix des articles"
        />
      </section>

      <section className="mb-10 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-2xl font-semibold text-primary-700">
          Points d&apos;attention (comparabilité)
        </h2>
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {attentionPoints.map((point) => (
            <li
              key={point.title}
              className="rounded-xl border border-slate-200 bg-slate-50/60 p-4"
            >
              <p className="font-semibold text-slate-800">{point.title}</p>
              <p className="text-sm text-slate-600">{point.details}</p>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-8 space-y-8">
        <TableCard
          title="T0 — Configuration matérielle & logicielle"
          description="Tableau à compléter pour documenter l'environnement de test utilisé."
          columns={[
            { key: "element", label: "Élément" },
            { key: "valeur", label: "Valeur" }
          ]}
          data={t0ConfigRows}
        />
        <TableCard
          title="T1 — Scénarios JMeter"
          columns={[
            { key: "scenario", label: "Scénario" },
            { key: "mix", label: "Mix" },
            { key: "threads", label: "Threads (paliers)" },
            { key: "rampup", label: "Ramp-up" },
            { key: "duree", label: "Durée/palier" },
            { key: "payload", label: "Payload" }
          ]}
          data={t1ScenarioRows}
        />
        <TableCard
          title="T2 — Résultats JMeter (par scénario et variante)"
          columns={[
            { key: "scenario", label: "Scénario" },
            { key: "mesure", label: "Mesure" },
            { key: "variantA", label: "A : Jersey" },
            { key: "variantC", label: "C : @RestController" },
            { key: "variantD", label: "D : Spring Data REST" }
          ]}
          data={t2ResultRows}
        />
        <TableCard
          title="T3 — Ressources JVM (Prometheus)"
          columns={[
            { key: "variant", label: "Variante" },
            { key: "cpu", label: "CPU proc. (%) moy/pic" },
            { key: "heap", label: "Heap (Mo) moy/pic" },
            { key: "gc", label: "GC time (ms/s) moy/pic" },
            { key: "threads", label: "Threads actifs moy/pic" },
            { key: "hikari", label: "Hikari (actifs/max)" }
          ]}
          data={t3ResourceRows}
        />
        <TableCard
          title="T4 — Détails par endpoint (scénario JOIN-filter)"
          columns={[
            { key: "endpoint", label: "Endpoint" },
            { key: "variantA", label: "A" },
            { key: "variantC", label: "C" },
            { key: "variantD", label: "D" },
            { key: "rps", label: "RPS (ms)" },
            { key: "p95", label: "p95 (ms)" },
            { key: "err", label: "Err %" },
            { key: "observations", label: "Observations" }
          ]}
          data={t4JoinRows}
        />
        <TableCard
          title="T5 — Détails par endpoint (scénario MIXED)"
          columns={[
            { key: "endpoint", label: "Endpoint" },
            { key: "variantA", label: "A" },
            { key: "variantC", label: "C" },
            { key: "variantD", label: "D" },
            { key: "rps", label: "RPS" },
            { key: "p95", label: "p95 (ms)" },
            { key: "err", label: "Err %" },
            { key: "observations", label: "Observations" }
          ]}
          data={t5MixedRows}
        />
        <TableCard
          title="T6 — Incidents / erreurs"
          columns={[
            { key: "run", label: "Run" },
            { key: "variant", label: "Variante" },
            { key: "type", label: "Type d'erreur (HTTP/DB/timeout)" },
            { key: "cause", label: "Cause probable" },
            { key: "action", label: "Action corrective" }
          ]}
          data={t6IncidentRows}
        />
        <TableCard
          title="T7 — Synthèse & conclusion"
          columns={[
            { key: "criteres", label: "Critère" },
            { key: "best", label: "Meilleure variante" },
            { key: "gap", label: "Écart (justifier)" },
            { key: "comments", label: "Commentaires" }
          ]}
          data={t7SummaryRows}
        />
      </div>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-primary-700">
          Analyses en temps réel (API)
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Mesures calculées automatiquement à partir des web services REST pour
          suivre l&apos;état courant du catalogue.
        </p>

        <div className="mt-6 space-y-8">
          <TableCard
            title="Instantané des données backend"
            columns={[
              { key: "element", label: "Élément" },
              { key: "valeur", label: "Valeur" }
            ]}
            data={apiSnapshotRows}
          />

          <TableCard
            title="Répartition des catégories (GET /api/categories)"
            columns={[
              { key: "code", label: "Code" },
              { key: "name", label: "Nom" },
              { key: "itemsCount", label: "Nb d'articles", align: "right" },
              { key: "stock", label: "Stock cumulé", align: "right" },
              { key: "updatedAt", label: "Mise à jour" }
            ]}
            data={categories.map((category) => ({
              code: category.code,
              name: category.name,
              itemsCount: numberFormatter.format(
                itemsByCategory[category.id] ?? 0
              ),
              stock: numberFormatter.format(stockByCategory[category.id] ?? 0),
              updatedAt: dateTimeFormatter.format(new Date(category.updatedAt))
            }))}
          />
          <TableCard
            title="Inventaire des articles (GET /api/items)"
            description="Articles actuellement chargés avec leur catégorie et leur stock."
            columns={[
              { key: "sku", label: "SKU" },
              { key: "name", label: "Nom" },
              { key: "categoryCode", label: "Catégorie" },
              { key: "price", label: "Prix" },
              { key: "stock", label: "Stock", align: "right" }
            ]}
            data={items.map((item) => ({
              sku: item.sku,
              name: item.name,
            categoryCode: item.categoryCode ?? "—",
            price: currencyFormatter.format(Number(item.price ?? 0)),
            stock: numberFormatter.format(item.stock ?? 0)
            }))}
          />
          <TableCard
            title="Items par catégorie (GET /api/categories/{id}/items)"
            description={
              categories.length > 0
                ? `Catégorie analysée : ${categories[0].name} (${categories[0].code})`
                : "Aucune catégorie disponible."
            }
            columns={[
              { key: "index", label: "#" },
              { key: "sku", label: "SKU" },
              { key: "name", label: "Nom" },
              { key: "price", label: "Prix" },
              { key: "stock", label: "Stock", align: "right" }
            ]}
            data={relationItems.map((item, index) => ({
              index: index + 1,
              sku: item.sku,
              name: item.name,
              price: currencyFormatter.format(Number(item.price ?? 0)),
              stock: numberFormatter.format(item.stock ?? 0)
            }))}
          />
          <TableCard
            title="Top 5 des stocks (analyse GET /api/items)"
            columns={[
              { key: "rank", label: "#" },
              { key: "name", label: "Nom" },
              { key: "sku", label: "SKU" },
              { key: "categoryCode", label: "Catégorie" },
              { key: "stock", label: "Stock", align: "right" }
            ]}
            data={topStockItems.map((item, index) => ({
              rank: index + 1,
              name: item.name,
              sku: item.sku,
            categoryCode: item.categoryCode ?? "—",
              stock: numberFormatter.format(item.stock ?? 0)
            }))}
          />
          <TableCard
            title="Synthèse API par catégorie"
            columns={[
              { key: "category", label: "Catégorie" },
              { key: "itemsCount", label: "Articles", align: "right" },
              { key: "avgPrice", label: "Prix moyen" },
              { key: "totalStock", label: "Stock total", align: "right" }
            ]}
            data={categories.map((category) => {
              const categoryItems = items.filter(
                (item) => item.categoryId === category.id
              );
              const categoryAvgPrice =
                categoryItems.length > 0
                  ? categoryItems.reduce(
                      (sum, item) => sum + Number(item.price ?? 0),
                      0
                    ) / categoryItems.length
                  : 0;
              return {
                category: `${category.name} (${category.code})`,
                itemsCount: numberFormatter.format(categoryItems.length),
                avgPrice: currencyFormatter.format(categoryAvgPrice),
                totalStock: numberFormatter.format(
                  stockByCategory[category.id] ?? 0
                )
              };
            })}
          />
          <TableCard
            title="Log des appels API (résumé)"
            description="Basé sur les réponses des 3 web services consommés côté frontend."
          columns={[
            { key: "endpoint", label: "Endpoint" },
            { key: "status", label: "Statut" },
            { key: "elements", label: "Éléments", align: "right" },
            { key: "comment", label: "Commentaire" }
          ]}
          data={[
            {
              endpoint: "GET /api/categories",
              status: categoriesPage ? "Succès" : "Erreur",
              elements: numberFormatter.format(totalCategories),
              comment: categoriesPage
                ? "Catalogue de catégories chargé."
                : "Échec de la récupération."
            },
            {
              endpoint: "GET /api/items",
              status: itemsPage ? "Succès" : "Erreur",
              elements: numberFormatter.format(totalItems),
              comment: itemsPage
                ? "Inventaire des articles disponible."
                : "Impossible de charger les items."
            },
            {
              endpoint: "GET /api/categories/{id}/items",
              status: relationPage ? "Succès" : "Erreur",
              elements: numberFormatter.format(relationItems.length),
              comment:
                relationPage && categories.length > 0
                  ? `Relation chargée pour ${categories[0].code}.`
                  : "Sélection d'une catégorie requise."
            }
          ]}
        />
        </div>
      </section>

      <footer className="mt-12 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-xl font-semibold text-primary-700">
          Indications rapides (implémentation)
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="font-semibold text-slate-800">JPA mappings</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
              <li>
                <code className="rounded bg-slate-100 px-1 py-0.5">
                  Item @ManyToOne(fetch = LAZY) Category category
                </code>
              </li>
              <li>
                <code className="rounded bg-slate-100 px-1 py-0.5">
                  Category @OneToMany(mappedBy=&quot;category&quot;) List&lt;Item&gt;
                </code>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">
              Requêtes côté contrôleur / repository
            </h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
              <li>Liste items : Page&lt;Item&gt; findAll(Pageable p)</li>
              <li>Filtre : Page&lt;Item&gt; findByCategoryId(Long categoryId, Pageable p)</li>
              <li>
                Variante anti-N+1 : @Query SELECT i FROM Item i JOIN FETCH i.category
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">Spring Data REST</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
              <li>Repos ItemRepository, CategoryRepository exposés</li>
              <li>Projections pour limiter HAL lorsque besoin comparer payloads</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">Livrables</h3>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-600">
              <li>Code des variantes A/C/D (endpoints identiques)</li>
              <li>Fichiers JMeter (.jmx) pour les 4 scénarios</li>
              <li>Dashboards Grafana (JVM + métriques csv exportés)</li>
              <li>
                Tableaux T0 ➜ T7 remplis + analyse (impact JOIN, pagination relationnelle, HAL,
                etc.)
              </li>
              <li>
                Recommandations d&apos;usage (lecture relationnelle, forte écriture, exposition
                rapide de CRUD)
              </li>
            </ol>
          </div>
        </div>
      </footer>
    </main>
  );
}

