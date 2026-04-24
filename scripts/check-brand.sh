#!/usr/bin/env bash
set -euo pipefail
LIST="$(cd "$(dirname "$0")/.." && pwd)/.brand-forbidden"
if [ ! -f "$LIST" ]; then
  echo "brand-safety: .brand-forbidden missing — cannot verify"
  exit 2
fi
PATTERN=$(tr '\n' '|' < "$LIST" | sed 's/|$//' | sed 's/||*/|/g')
if [ -z "$PATTERN" ]; then
  echo "brand-safety: .brand-forbidden empty — cannot verify"
  exit 2
fi
MATCHES=$(grep -rEi "$PATTERN" \
  --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.next \
  --exclude=.brand-forbidden \
  --exclude=check-brand.sh \
  . || true)
if [ -n "$MATCHES" ]; then
  echo "brand-safety: forbidden names found:"
  echo "$MATCHES"
  exit 1
fi
echo "brand-safety: clean"
