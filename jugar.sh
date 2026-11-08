#!/usr/bin/env sh
cd "$(dirname "$0")"
[ -d node_modules ] || npm install
[ -f dist/index.html ] || npm run build
(sleep 2; (xdg-open http://localhost:4173 || open http://localhost:4173) >/dev/null 2>&1) &
npm run preview
