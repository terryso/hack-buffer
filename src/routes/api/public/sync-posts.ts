// Manual sync trigger. Call this after pushing new markdown to GitHub:
//   curl -X POST https://blog.suchuanyi.dev/api/public/sync-posts
// Returns JSON with counts: { total, updated, deleted, failed, upToDate }
//
// Disabled when VITE_ENABLE_AI !== "true" — responds 503 so the site can
// run as a pure static blog with zero server-side dependencies.
import { createFileRoute } from "@tanstack/react-router";
import { syncAllPostsServer } from "@/lib/posts-sync.server";
import { AI_ENABLED } from "@/lib/ai-flag";

const disabled = () =>
  Response.json(
    { error: "AI features disabled. Set VITE_ENABLE_AI=true to enable." },
    { status: 503 },
  );

const unauthorized = () =>
  Response.json({ error: "Unauthorized" }, { status: 401 });

function checkAuth(request: Request): boolean {
  const expected = process.env.SYNC_SECRET;
  if (!expected) return false; // fail-closed when secret not configured
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  return token.length > 0 && token === expected;
}

const handle = async (request: Request) => {
  if (!AI_ENABLED) return disabled();
  if (!checkAuth(request)) return unauthorized();
  return Response.json(await syncAllPostsServer());
};

export const Route = createFileRoute("/api/public/sync-posts")({
  server: {
    handlers: {
      GET: async ({ request }) => handle(request),
      POST: async ({ request }) => handle(request),
    },
  },
});
