#!/usr/bin/env python3
import json
import sys
from pathlib import Path


def main() -> None:
    path = Path(sys.argv[1])
    label = sys.argv[2] if len(sys.argv) > 2 else "Report"
    if not path.is_file():
        return
    data = json.loads(path.read_text())
    failures = sum(int(suite.get("failures") or 0) for suite in data.get("testsuites") or [])
    if failures:
        print(f"{label} contains {failures} failure(s)", file=sys.stderr)
        raise SystemExit(1)


if __name__ == "__main__":
    main()
