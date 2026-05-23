#!/usr/bin/env bash
# Trigger AI 索引增量同步 (embeddings + TL;DR)
# 用法:
#   ./scripts/sync-posts.sh              # 同步 production (blog.suchuanyi.dev)
#   ./scripts/sync-posts.sh dev          # 同步 preview 构建
set -euo pipefail

TARGET="${1:-prod}"
case "$TARGET" in
  prod) URL="https://blog.suchuanyi.dev/api/public/sync-posts" ;;
  dev)  URL="https://project--03bdf90c-34a3-4556-a833-1daec1be6b15-dev.lovable.app/api/public/sync-posts" ;;
  *) echo "usage: $0 [prod|dev]" >&2; exit 1 ;;
esac

echo "→ POST $URL"
curl -fsS -X POST "$URL" | tee /dev/stderr | python3 -m json.tool 2>/dev/null || true
echo
