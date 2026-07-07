#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
PKG="$ROOT/package"

rm -rf "$PKG"
mkdir -p "$PKG"

cp "$ROOT/main.py" "$ROOT/requirements.txt" "$PKG/"
pip install -r "$ROOT/requirements.txt" -t "$PKG" --quiet
