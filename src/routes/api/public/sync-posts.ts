// Manual sync trigger. Call this after pushing new markdown to GitHub:
//   curl -X POST https://blog.suchuanyi.dev/api/public/sync-posts
// Returns JSON with counts: { total, updated, deleted, failed, upToDate }
//
// Disabled when VITE_ENABLE_AI !== "true" — responds 503 so the site can
// run as a pure static blog with zero server-side dependencies.
import { createFileRoute } from "@tanstack/react-router";
import { syncAllPosts } from "@/lib/posts-ai.functions";
import { AI_ENABLED } from "@/lib/ai-flag";

const disabled = () =>
  Response.json(
    { error: "AI features disabled. Set VITE_ENABLE_AI=true to enable." },
    { status: 503 },
  );

export const Route = createFileRoute("/api/public/sync-posts")({
  server: {
    handlers: {
      GET: async () => {
        if (!AI_ENABLED) return disabled();
        return Response.json(await syncAllPosts());
      },
      POST: async () => {
        if (!AI_ENABLED) return disabled();
        return Response.json(await syncAllPosts());
      },
    },
  },
});
