#!/bin/sh
# Builds the folder Netlify publishes.
#
# Everything at the top of this repository is part of the website, except the
# project's own files listed below: the guard that runs on Netlify's side, the
# tests and tools, and the notes for people working on the site. Leaving them
# out keeps them off the public site.
#
# Usage: sh tools/build-site.sh [output folder, default "dist"]
set -eu

cd "$(dirname "$0")/.."
out="${1:-dist}"

# The output folder is emptied first, so it must be dist or not exist yet.
if [ "$out" != "dist" ] && [ -e "$out" ]; then
  echo "Not building: $out already exists. Name a folder that does not exist yet." >&2
  exit 1
fi

rm -rf "$out"
mkdir -p "$out"

for item in *; do
  case "$item" in
    dist | node_modules | netlify | netlify.toml | tests | tools | package.json | package-lock.json | README.md) ;;
    *) [ "$item" = "$out" ] || cp -R "$item" "$out/" ;;
  esac
done

# The one hidden folder websites use (for example to prove who owns a domain).
if [ -d .well-known ]; then cp -R .well-known "$out/"; fi

echo "Site built in $out: $(find "$out" -type f | wc -l | tr -d ' ') files"
