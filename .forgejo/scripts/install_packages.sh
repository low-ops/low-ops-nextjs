#!/usr/bin/env bash
set -eu

if [ -n "${APT_PACKAGES:-}" ]; then
  export DEBIAN_FRONTEND=noninteractive
  apt-get update
  # shellcheck disable=SC2086
  apt-get install -y --no-install-recommends ${APT_PACKAGES}
fi

if [ -n "${APK_PACKAGES:-}" ]; then
  # shellcheck disable=SC2086
  apk add --no-cache ${APK_PACKAGES}
fi
