#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
PKG="$ROOT/package"

rm -rf "$PKG"
mkdir -p "$PKG"

cp "$ROOT/main.py" "$ROOT/workshop_chain.py" "$ROOT/requirements.txt" "$PKG/"
python3 -m pip install -r "$ROOT/requirements.txt" -t "$PKG" --quiet
