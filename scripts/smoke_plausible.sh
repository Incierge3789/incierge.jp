#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-https://incierge.jp}"

echo "🔎 Checking ${BASE_URL}/js/script ..."
for i in {1..30}; do
  CODE=$(curl -sS -o /tmp/script.out -w "%{http_code}" "${BASE_URL}/js/script" || true)
  if [ "$CODE" = "200" ]; then
    ctype=$(curl -sSI "${BASE_URL}/js/script" | awk -F': ' 'tolower($1)=="content-type"{print tolower($2)}' | tr -d '\r')
    echo "HTTP 200, Content-Type: ${ctype}"
    [[ "$ctype" == application/javascript* ]] && break
  fi
  echo "… not ready yet (${i}/30), sleep 10s"; sleep 10
done

echo "🔎 POST ${BASE_URL}/api/plausible (pageview)"
CODE=$(curl -sS -o /dev/null -w "%{http_code}" "${BASE_URL}/api/plausible" \
  -H 'Content-Type: application/json' \
  -H "User-Agent: SmokeTest/1.0" \
  -H "Referer: ${BASE_URL}/" \
  --data "{\"name\":\"pageview\",\"url\":\"${BASE_URL}/\",\"domain\":\"incierge.jp\"}")
test "$CODE" = "202" || { echo "❌ /api/plausible expected 202, got ${CODE}"; exit 1; }

echo "🔎 POST ${BASE_URL}/api/plausible (form_submitted)"
CODE=$(curl -sS -o /dev/null -w "%{http_code}" "${BASE_URL}/api/plausible" \
  -H 'Content-Type: application/json' \
  -H "User-Agent: SmokeTest/1.0" \
  -H "Referer: ${BASE_URL}/contact/thanks/?ticket=SMOKE" \
  --data "{\"name\":\"form_submitted\",\"url\":\"${BASE_URL}/contact/thanks/?ticket=SMOKE\",\"domain\":\"incierge.jp\",\"props\":{\"ticket\":\"SMOKE\"}}")
test "$CODE" = "202" || { echo "❌ /api/plausible expected 202, got ${CODE}"; exit 1; }

echo "✅ Plausible proxy smoke passed."
