#!/usr/bin/env python3
import json
import os
import subprocess
import sys
from pathlib import Path


def main() -> None:
    correlation = os.environ.get("CORRELATION", "")
    tag = os.environ.get("TAG", "")
    app = os.environ["APP"]
    bucket = os.environ["CORE_BUCKET"]
    unit_test_file = os.environ.get("LOWOPS_UNIT_TEST_FILE", "unit-test.json")
    include_mda = os.environ.get("LOWOPS_INCLUDE_MDA", "").lower() in ("1", "true", "yes")

    if not correlation:
        marker = Path("/srv/shared") / f"run-{os.environ.get('RUN_ID', '')}"
        if marker.is_file():
            correlation = marker.read_text().strip()
    if not correlation:
        raise SystemExit("build did not register a correlation id")

    share = Path("/srv/shared") / correlation
    status = "Succeeded" if os.environ.get("BUILD_RESULT") == "success" else "Failed"

    subprocess.check_call(
        [
            "mc",
            "alias",
            "set",
            "minio",
            os.environ["MINIO_URL"],
            os.environ["MINIO_ACCESS_KEY"],
            os.environ["MINIO_SECRET_KEY"],
        ]
    )

    def upload(name: str, key: str) -> str:
        source = share / name
        if not source.is_file():
            return ""
        destination = f"{bucket}/{key}"
        subprocess.check_call(["mc", "cp", str(source), f"minio/{destination}"])
        return destination

    details = {
        "buildLogs": upload("build-log.txt", f"taskrun-logs/{app}/{correlation}.txt"),
        "mxLintResults": upload("report.json", f"linting-results/{app}/{tag}.json") if tag else "",
        "mxUnitTestingResults": (
            upload(unit_test_file, f"unit-testing-results/{app}/{tag}.json") if tag else ""
        ),
        "mxAppMdaMetadata": (
            upload("metadata.json", f"mda-metadata/{app}/{tag}.json") if tag and include_mda else ""
        ),
        "mxAppVulnerabilities": (
            upload("scan-result.json", f"oci-scan-results/{app}/{tag}.json") if tag else ""
        ),
        "commitId": os.environ["COMMIT"],
        "backupId": "",
        "backupDbLocation": "",
        "backupStorageLocation": "",
        "backupComment": "",
        "actionsetName": "",
        "packageId": tag,
    }
    message = {
        "appName": app,
        "envName": "",
        "correlationId": correlation,
        "requester": os.environ["REQUESTER"],
        "status": status,
        "details": details,
    }
    subprocess.check_call(
        [
            "python",
            "/usr/local/bin/push-pipeline-events.py",
            "--host",
            os.environ["RABBITMQ_HOST"],
            "--port",
            "5672",
            "--username",
            os.environ["RABBITMQ_USERNAME"],
            "--password",
            os.environ["RABBITMQ_PASSWORD"],
            "--exchange",
            "lowops-exchange",
            "--vhost",
            "/lowops-vhost",
            "--routing-key",
            "controller.app.build.complete",
            "--message",
            json.dumps(message),
        ]
    )


if __name__ == "__main__":
    try:
        main()
    except KeyError as exc:
        print(f"Missing environment variable: {exc}", file=sys.stderr)
        raise SystemExit(1) from exc
