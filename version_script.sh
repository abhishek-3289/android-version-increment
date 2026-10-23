#!/bin/bash
set -euo pipefail

INCREMENT_TYPE=${1:-patch}
OUTPUT_FILE=${GITHUB_OUTPUT:-/dev/stdout}

if ! git fetch --tags --force --quiet 2>/dev/null; then
  echo "::warning::Could not fetch tags from remote; using tags available locally"
fi

LATEST_TAG=$(
  git tag --list \
    | grep -E '^v?[0-9]+\.[0-9]+\.[0-9]+$' \
    | awk '{ version = $0; sub(/^v/, "", version); print version " " $0 }' \
    | sort -t. -k1,1n -k2,2n -k3,3n \
    | tail -n 1 \
    | cut -d' ' -f2 \
    || true
)
LATEST_TAG=${LATEST_TAG:-v0.0.0}

[[ $LATEST_TAG =~ ^v?([0-9]+)\.([0-9]+)\.([0-9]+)$ ]]
MAJOR=${BASH_REMATCH[1]}
MINOR=${BASH_REMATCH[2]}
PATCH=${BASH_REMATCH[3]}
OLD_VERSION="$MAJOR.$MINOR.$PATCH"

case $INCREMENT_TYPE in
  major)
    MAJOR=$((MAJOR + 1))
    MINOR=0
    PATCH=0
    ;;
  minor)
    MINOR=$((MINOR + 1))
    PATCH=0
    ;;
  patch)
    PATCH=$((PATCH + 1))
    ;;
  *)
    echo "::error::increment-type must be one of major, minor, patch (https://semver.org/), got '$INCREMENT_TYPE'"
    exit 1
    ;;
esac

NEW_VERSION="$MAJOR.$MINOR.$PATCH"
echo "Latest tag: $LATEST_TAG -> new version: $NEW_VERSION"
{
  echo "latest_tag=$LATEST_TAG"
  echo "old_version=$OLD_VERSION"
  echo "new_version=$NEW_VERSION"
  echo "major_version=$MAJOR"
  echo "minor_version=$MINOR"
  echo "patch_version=$PATCH"
} >> "$OUTPUT_FILE"
