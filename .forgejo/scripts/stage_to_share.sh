#!/usr/bin/env bash
set -eu

# Usage: stage_to_share.sh <local-path> <share-filename>
# Requires CORRELATION.

src=$1
dest_name=$2

if [ -z "${CORRELATION:-}" ] || [ ! -f "$src" ]; then
  exit 0
fi

mkdir -p "/srv/shared/${CORRELATION}"
cp "$src" "/srv/shared/${CORRELATION}/${dest_name}"
