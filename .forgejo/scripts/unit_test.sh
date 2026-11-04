#!/usr/bin/env bash
set -eu

root="$(cd "$(dirname "$0")" && pwd)"

export NODE_ENV=development
mkdir -p reports
npm i

set +e
npm run test
status=$?
set -e

if [ ! -f reports/unit-test.xml ]; then
  echo "reports/unit-test.xml was not produced"
  exit "$status"
fi

python3 "$root/junit_to_report.py" reports/unit-test.xml
bash "$root/stage_to_share.sh" reports/unit-test.json unit-test.json
exit "$status"
