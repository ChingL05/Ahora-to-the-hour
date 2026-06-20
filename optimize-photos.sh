#!/bin/bash
# Optimise every original photo in photos/ into web-ready copies in photos/web/.
# Usage:  ./optimize-photos.sh
# Re-run any time you drop new photos into photos/ — it skips ones already done.

set -e
cd "$(dirname "$0")/photos"
mkdir -p web

for f in *.jpeg *.jpg *.JPG *.png *.PNG; do
  [ -e "$f" ] || continue                 # skip if no match
  base="${f%.*}"
  out="web/${base}.jpg"
  if [ -f "$out" ] && [ "$out" -nt "$f" ]; then
    echo "skip   $f (already optimised)"
    continue
  fi
  sips -Z 2000 -s format jpeg -s formatOptions 72 "$f" --out "$out" >/dev/null 2>&1
  echo "made   $out"
done

echo "Done. Web copies are in photos/web/"
