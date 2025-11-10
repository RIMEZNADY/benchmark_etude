#!/bin/bash
set -euo pipefail

JMETER_HOME="${JMETER_HOME:-/opt/apache-jmeter-5.6.3}"
RESULTS_DIR="/test/results"
PLANS_DIR="/test/plans"
DATA_DIR="/test/data"

SCENARIO="${SCENARIO:-read-heavy}"
VARIANT="${VARIANT:-restcontroller}"

TIMESTAMP="$(date +%Y%m%d%H%M%S)"
RESULT_PREFIX="${RESULTS_DIR}/${SCENARIO}-${TIMESTAMP}"

mkdir -p "${RESULTS_DIR}"

case "${SCENARIO}" in
  read-heavy)      PLAN="${PLANS_DIR}/read-heavy.jmx" ;;
  join-filter)     PLAN="${PLANS_DIR}/join-filter.jmx" ;;
  mixed)           PLAN="${PLANS_DIR}/mixed-entities.jmx" ;;
  heavy-body)      PLAN="${PLANS_DIR}/heavy-body.jmx" ;;
  *)
    echo "Scénario inconnu: ${SCENARIO}" >&2
    echo "  valeurs possibles: read-heavy | join-filter | mixed | heavy-body" >&2
    exit 1
    ;;
esac

case "${VARIANT}" in
  restcontroller) DEFAULT_BASE_URL="http://backend-restcontroller:8081" ;;
  jersey)         DEFAULT_BASE_URL="http://backend-jersey:8082" ;;
  spring-data-rest) DEFAULT_BASE_URL="http://backend-spring-data:8083" ;;
  *)
    echo "Variante inconnue: ${VARIANT}" >&2
    echo "  valeurs possibles: restcontroller | jersey | spring-data-rest" >&2
    exit 1
    ;;
esac

BASE_URL="${BASE_URL:-${DEFAULT_BASE_URL}}"
CSV_CATEGORIES="${CSV_CATEGORIES:-${DATA_DIR}/categories.csv}"
CSV_ITEMS="${CSV_ITEMS:-${DATA_DIR}/items.csv}"

INFLUX_URL="${INFLUX_URL:-http://influxdb:8086}"
INFLUX_TOKEN="${INFLUX_TOKEN:-xOgmUS8mLFwLYgZMeY9HHXWTzG-lB9ivuOb9f08aUFRPpXX5iQiTCP-PogwEOIcU6SjKhjhLMt8ydm7MFFBcAQ==}"
INFLUX_ORG="${INFLUX_ORG:-perf}"
INFLUX_BUCKET="${INFLUX_BUCKET:-jmeter}"

echo "------------------------------------------------------------"
echo " JMeter scenario      : ${SCENARIO}"
echo " Backend variant      : ${VARIANT} (${BASE_URL})"
echo " InfluxDB             : ${INFLUX_URL} (org=${INFLUX_ORG}, bucket=${INFLUX_BUCKET})"
echo " Results              : ${RESULT_PREFIX}.jtl"
echo "------------------------------------------------------------"

"${JMETER_HOME}/bin/jmeter" \
  -n \
  -t "${PLAN}" \
  -JbaseUrl="${BASE_URL}" \
  -JcsvCategories="${CSV_CATEGORIES}" \
  -JcsvItems="${CSV_ITEMS}" \
  -JinfluxUrl="${INFLUX_URL}" \
  -JinfluxToken="${INFLUX_TOKEN}" \
  -JinfluxOrg="${INFLUX_ORG}" \
  -JinfluxBucket="${INFLUX_BUCKET}" \
  -l "${RESULT_PREFIX}.jtl" \
  -e -o "${RESULT_PREFIX}-report"

echo "Exécution terminée. Rapport HTML disponible dans ${RESULT_PREFIX}-report/index.html"

