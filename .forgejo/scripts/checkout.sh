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

base="${SERVER%/}"
case "$base" in
  https://*) origin="https://oauth2:${TOKEN}@${base#https://}" ;;
  http://*) origin="http://oauth2:${TOKEN}@${base#http://}" ;;
  *) origin="http://oauth2:${TOKEN}@${base}" ;;
esac
git init .
git remote add origin "${origin}/${REPO}.git"
git fetch --depth 1 origin "$SHA"
git checkout FETCH_HEAD
