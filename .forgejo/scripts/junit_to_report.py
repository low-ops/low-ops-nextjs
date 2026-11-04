#!/usr/bin/env python3
import argparse
import html
import json
import os
import sys
import xml.etree.ElementTree as ET


def extract_failure_summary(content: str) -> str:
    if not content:
        return ""
    lines = content.split("\n")
    summary_lines = []
    for line in lines[:10]:
        line = line.strip()
        if line and not line.startswith("    at ") and not line.startswith("Error:"):
            if not any(skip in line.lower() for skip in ["stack trace", "at ", "node_modules"]):
                summary_lines.append(line)
    if summary_lines:
        return "\n".join(summary_lines[:3])
    for line in lines:
        if line.strip():
            return line.strip()
    return content[:200] + "..." if len(content) > 200 else content


def parse_testcase(testcase_elem):
    classname = testcase_elem.get("classname", "")
    if classname.endswith((".ts", ".tsx", ".js", ".jsx")):
        filename = classname
    else:
        filename = classname.replace(".", "/") + ".ts" if classname else ""
    testcase = {
        "name": html.unescape(testcase_elem.get("name", "")),
        "location": filename or classname,
        "time": float(testcase_elem.get("time", 0)),
        "failure": None,
        "skipped": None,
    }
    failure_elem = testcase_elem.find("failure")
    if failure_elem is not None:
        full_content = failure_elem.text.strip() if failure_elem.text else ""
        message = failure_elem.get("message", "") or extract_failure_summary(full_content)
        testcase["failure"] = {
            "message": message,
            "type": failure_elem.get("type", "") or "AssertionError",
            "content": full_content[-2000:] if full_content else message,
        }
    error_elem = testcase_elem.find("error")
    if error_elem is not None:
        full_content = error_elem.text.strip() if error_elem.text else ""
        message = error_elem.get("message", "") or extract_failure_summary(full_content)
        testcase["failure"] = {
            "message": message,
            "type": error_elem.get("type", "") or "Error",
            "content": full_content[-2000:] if full_content else message,
        }
    skipped_elem = testcase_elem.find("skipped")
    if skipped_elem is not None:
        testcase["skipped"] = {
            "message": skipped_elem.get("message", "") or "Test skipped",
            "type": "skip",
            "content": skipped_elem.text.strip() if skipped_elem.text else "",
        }
    return testcase


def parse_testsuite(testsuite_elem):
    testsuite = {
        "name": testsuite_elem.get("name", ""),
        "tests": int(testsuite_elem.get("tests", 0)),
        "failures": int(testsuite_elem.get("failures", 0)),
        "errors": int(testsuite_elem.get("errors", 0)),
        "skipped": int(testsuite_elem.get("skipped", 0)),
        "time": float(testsuite_elem.get("time", 0)),
        "timestamp": testsuite_elem.get("timestamp", ""),
        "testcases": [],
    }
    for testcase_elem in testsuite_elem.findall("testcase"):
        testsuite["testcases"].append(parse_testcase(testcase_elem))
    return testsuite


def parse_junit_xml(xml_file: str):
    tree = ET.parse(xml_file)
    root = tree.getroot()
    testsuites = []
    if root.tag == "testsuites":
        for testsuite_elem in root.findall("testsuite"):
            testsuites.append(parse_testsuite(testsuite_elem))
    elif root.tag == "testsuite":
        testsuites.append(parse_testsuite(root))
    else:
        raise ValueError(f"Unexpected root element: {root.tag}")
    return {"testsuites": testsuites}


def main() -> None:
    parser = argparse.ArgumentParser(description="Convert JUnit XML to LowOps JSON")
    parser.add_argument("xml_file")
    args = parser.parse_args()
    if not os.path.exists(args.xml_file):
        print(f"Error: File '{args.xml_file}' not found", file=sys.stderr)
        raise SystemExit(1)
    data = parse_junit_xml(args.xml_file)
    json_file = f"{os.path.splitext(args.xml_file)[0]}.json"
    with open(json_file, "w", encoding="utf-8") as handle:
        handle.write(json.dumps(data, indent=2))
    print(f"Converted '{args.xml_file}' to '{json_file}'")


if __name__ == "__main__":
    main()
