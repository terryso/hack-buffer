// Manual sync trigger. Call this after pushing new markdown to GitHub:
//   curl -X POST https://blog.suchuanyi.dev/api/public/sync-posts
// Returns JSON with counts: { total, updated, deleted, failed, upToDate }
import { createFileRoute } from "@tanstack/react-router";
import { syncAllPosts } from "@/lib/posts-ai.functions";

export const Route = createFileRoute("/api/public/sync-posts")({
  server: {
    handlers: {
      GET: async () => {
        const result = await syncAllPosts();
        return Response.json(result);
      },
      POST: async () => {
        const result = await syncAllPosts();
        return Response.json(result);
      },
    },
  },
});
