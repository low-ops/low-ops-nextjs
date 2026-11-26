#!/usr/bin/env bash
set -eu

short=$(printf '%s' "$SHA" | cut -c1-7)
tag=$(printf '%s' "${REF_NAME}-${short}" | sed 's/%20/_/g' | tr -cd '[:alnum:]_.-' | sed 's/^[.-]*//' | cut -c -128)
image="${REGISTRY}/apps-${APP}/app:${tag}"

share="/srv/shared/${CORRELATION}"
mkdir -p "$share"
chmod 777 "$share"
printf 'image=%s\ncommit=%s\n' "$image" "$SHA" > "$share/build-log.txt"

mkdir -p /kaniko/.docker
auth=$(printf '%s:%s' "$HARBOR_USERNAME" "$HARBOR_PASSWORD" | base64 | tr -d '\n')
printf '{"auths":{"https://%s":{"auth":"%s"},"%s":{"auth":"%s"}}}\n' \
  "$REGISTRY" "$auth" "$REGISTRY" "$auth" > /kaniko/.docker/config.json

/kaniko/executor \
  --context "$PWD" \
  --dockerfile "$PWD/Dockerfile" \
  --destination "$image" \
  --ignore-path=/var/mail \
  --ignore-path=/var/spool/mail \
  --ignore-path=//product_uuid \
  --ignore-path=/srv/shared \
  --snapshot-mode=redo \
  --use-new-run \
  --compressed-caching=false \
  --cleanup

echo "image=${image}" >> "$GITHUB_OUTPUT"
echo "tag=${tag}" >> "$GITHUB_OUTPUT"
