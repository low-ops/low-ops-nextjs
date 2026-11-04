#!/usr/bin/env python3
import json
import os
import subprocess
import sys
from pathlib import Path


def main() -> None:
    correlation = subprocess.check_output(
        ["cat", "/proc/sys/kernel/random/uuid"], text=True
    ).strip()
    share = Path("/srv/shared", correlation)
    share.mkdir(parents=True, exist_ok=True)
    share.chmod(0o777)

    run_id = os.environ.get("RUN_ID", "")
    if run_id:
        Path("/srv/shared", f"run-{run_id}").write_text(correlation)

    github_output = os.environ.get("GITHUB_OUTPUT")
    if github_output:
        with open(github_output, "a", encoding="utf-8") as output:
            output.write(f"correlation={correlation}\n")

    message = {
        "appName": os.environ["APP"],
        "envName": "",
        "correlationId": correlation,
        "requester": os.environ["REQUESTER"],
        "status": "Succeeded",
        "details": {
            "buildLogs": "",
            "mxLintResults": "",
            "mxUnitTestingResults": "",
            "mxAppMdaMetadata": "",
            "mxAppVulnerabilities": "",
            "commitId": os.environ["COMMIT"],
            "backupId": "",
            "backupDbLocation": "",
            "backupStorageLocation": "",
            "backupComment": "",
            "actionsetName": "",
            "packageId": "",
        },
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
            "controller.app.build.submit",
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
