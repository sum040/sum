#!/bin/sh
# 프로토타입 폴더를 공개 사이트로 복사. index.html은 문서 머리(doctype, 글자 인코딩, 화면 크기)를 붙여서 씀.
# 사용: sh build.sh /mnt/project-files/prototype/sumin-v1
set -e
SRC="${1:-/mnt/project-files/prototype/sumin-v1}"
DEST="$(dirname "$0")"
cp -r "$SRC/assets" "$DEST/"
cp "$SRC/firebase-config.js" "$SRC/firebase-live.js" "$SRC/firestore.rules" "$DEST/"
{
  printf '<!doctype html>\n<html lang="ko">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n</head>\n<body>\n'
  cat "$SRC/index.html"
  printf '\n</body>\n</html>\n'
} > "$DEST/index.html"
