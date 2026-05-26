#!/usr/bin/env bash
# Trigger AI 索引增量同步 (embeddings + TL;DR)
# 用法:
#   ./scripts/sync-posts.sh              # 默认 dev (preview 构建)
#   ./scripts/sync-posts.sh prod         # 同步已 publish 的生产 (blog.suchuanyi.dev)
#
# 注意: prod 需要先在 Lovable 里 Publish 一次,新路由才会上线。
set -euo pipefail

TARGET="${1:-dev}"
case "$TARGET" in
  dev)  URL="https://project--03bdf90c-34a3-4556-a833-1daec1be6b15-dev.lovable.app/api/public/sync-posts" ;;
  prod) URL="https://blog.suchuanyi.dev/api/public/sync-posts" ;;
  *) echo "usage: $0 [dev|prod]" >&2; exit 1 ;;
esac

if [[ -z "${SYNC_SECRET:-}" ]]; then
  echo "error: SYNC_SECRET env var is required" >&2
  exit 1
fi

echo "→ POST $URL"
curl -fsS -X POST -H "Authorization: Bearer $SYNC_SECRET" "$URL" | python3 -m json.tool
