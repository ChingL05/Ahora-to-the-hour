#!/bin/bash
# Optimise every original photo in photos/ into web-ready copies in photos/web/,
# then stamp each web copy with ownership metadata (author + copyright), so the
# claim of ownership travels inside the file even if someone downloads it.
#
# Usage:  ./optimize-photos.sh
# Re-run any time you drop new photos into photos/ — it skips ones already sized,
# but always refreshes the metadata (harmless to repeat).
#
# The metadata step needs exiftool (a one-time install):  brew install exiftool
# Without it the photos are still optimised; only the embedded copyright is skipped.

set -e
cd "$(dirname "$0")/photos"
mkdir -p web

# --- ownership stamped into every web photo ---
CREATOR="Astrid B. (Ahora.)"
RIGHTS="© 2026 Ahora. — Astrid B. All rights reserved. Not for reproduction or reuse without permission."

for f in *.jpeg *.jpg *.JPG *.png *.PNG; do
  [ -e "$f" ] || continue                 # skip if no match
  base="${f%.*}"
  out="web/${base}.jpg"
  if [ -f "$out" ] && [ "$out" -nt "$f" ]; then
    echo "skip   $f (already optimised)"
    continue
  fi
  # quality-first: longest side up to 2560px, JPEG quality 90 (crisp on retina)
  sips -Z 2560 -s format jpeg -s formatOptions 90 "$f" --out "$out" >/dev/null 2>&1
  echo "made   $out"
done

# --- stamp ownership into EXIF / IPTC / XMP of every web copy ---
if command -v exiftool >/dev/null 2>&1; then
  exiftool -q -overwrite_original \
    -EXIF:Artist="$CREATOR" \
    -EXIF:Copyright="$RIGHTS" \
    -IPTC:By-line="$CREATOR" \
    -IPTC:CopyrightNotice="$RIGHTS" \
    -XMP-dc:Creator="$CREATOR" \
    -XMP-dc:Rights="$RIGHTS" \
    web/*.jpg
  echo "stamped ownership metadata into web/*.jpg"
else
  echo "note: exiftool not found — photos optimised, but ownership metadata was NOT embedded."
  echo "      install it once with:  brew install exiftool   (then re-run this script)"
fi

echo "Done. Web copies are in photos/web/"
