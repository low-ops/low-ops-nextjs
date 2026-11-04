#!/usr/bin/env bash
set -eu

root="$(cd "$(dirname "$0")" && pwd)"

export NODE_ENV=development
npm i

set +e
npx eslint . --format json --output-file eslint.json
eslint_status=$?
set -e

python3 "$root/eslint_to_report.py" eslint.json report.json
bash "$root/stage_to_share.sh" report.json report.json

exit "$eslint_status"
