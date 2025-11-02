#!/usr/bin/env bash
set -euo pipefail
npm run -s build >/dev/null 2>&1 || true
rg -n 'href="https://chatgpt.com/g/.*ai_consult_gpts"' dist/index.html >/dev/null \
  && echo "✅ CTA→GPTs OK" || (echo "❌ CTA検出できず"; exit 1)
