#!/usr/bin/env python3
import json
import sys
from pathlib import Path


def main() -> None:
    source = Path(sys.argv[1] if len(sys.argv) > 1 else "eslint.json")
    output = Path(sys.argv[2] if len(sys.argv) > 2 else "report.json")

    raw_files = []
    if source.is_file() and source.stat().st_size:
        loaded = json.loads(source.read_text())
        if isinstance(loaded, list):
            raw_files = loaded

    testsuites = []
    rules = []
    for file_result in raw_files:
        filename = file_result.get("filePath") or "unknown"
        for item in file_result.get("messages") or []:
            code = item.get("ruleId") or "eslint"
            message = item.get("message") or ""
            row = item.get("line") or 0
            column = item.get("column") or 0
            severity_num = item.get("severity") or 1
            if severity_num >= 2:
                severity = "HIGH"
            elif severity_num == 1:
                severity = "MEDIUM"
            else:
                severity = "LOW"
            case_name = f"{code}:{filename}:{row}:{column}"
            detail = message
            testsuites.append(
                {
                    "name": case_name,
                    "tests": 1,
                    "failures": 1,
                    "skipped": 0,
                    "time": 0,
                    "testcases": [
                        {
                            "name": case_name,
                            "document": filename,
                            "location": filename,
                            "time": 0,
                            "failure": {"message": detail, "type": code, "content": detail},
                            "skipped": None,
                        }
                    ],
                }
            )
            rules.append(
                {
                    "title": code,
                    "description": detail,
                    "category": "General",
                    "severity": severity,
                    "ruleNumber": code,
                    "remediation": "",
                    "ruleName": case_name,
                    "path": filename,
                    "skipReason": "",
                    "pattern": "",
                    "packageName": code,
                }
            )

    output.write_text(json.dumps({"testsuites": testsuites, "rules": rules}, indent=2))


if __name__ == "__main__":
    main()
