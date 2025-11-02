#!/usr/bin/env bash
set -euo pipefail
echo "## ROUTES"; find src/pages -type f \( -name "*.astro" -o -name "*.mdx" -o -name "*.md" \) | sort
echo; echo "## GPTs CTA (built)"; npm run -s build >/dev/null 2>&1 || true; rg -n 'chatgpt.com/g/.+ai_consult_gpts' dist/index.html || echo "(not found)"
echo; echo "## MONEY WORDS (source)"; rg -n --hidden --glob '!node_modules' --glob '!dist' '([0-9０-９]+ *万|月[0-9０-９]+|円|万円)' src/pages || echo "OK: 金額表記なし"
echo; echo "## COST WORDS (source)"; rg -n --hidden --glob '!node_modules' --glob '!dist' '費用|料金|見積' src/pages || true
echo; echo "## Base.astro og/canonical"; rg -n 'og.jpg|canonical|<title>|description' src/layouts/Base.astro || true
echo; echo "## public/og.jpg"; [ -f public/og.jpg ] && ls -lah public/og.jpg || echo "missing"
