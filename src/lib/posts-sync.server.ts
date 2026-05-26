// Server-only sync helper. NOT exposed as a createServerFn RPC — only callable
// from the auth-protected /api/public/sync-posts route handler.
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getAllPosts } from "@/lib/posts";
import { indexPost, postFingerprint } from "@/lib/posts-ai-core.server";

export async function syncAllPostsServer() {
  const all = getAllPosts();
  const { data: rows } = await supabaseAdmin.from("posts_ai").select("slug, content_hash");
  const existing = new Map<string, string>((rows ?? []).map((r) => [r.slug, r.content_hash]));

  const todo = all.filter((p) => existing.get(p.slug) !== postFingerprint(p));
  let updated = 0;
  const failed: string[] = [];
  for (const p of todo) {
    try {
      await indexPost(p);
      updated++;
    } catch (e) {
      console.error(`[sync] ${p.slug}:`, e);
      failed.push(p.slug);
    }
  }

  const currentSlugs = new Set(all.map((p) => p.slug));
  const toDelete = Array.from(existing.keys()).filter((s) => !currentSlugs.has(s));
  if (toDelete.length) {
    await supabaseAdmin.from("posts_ai").delete().in("slug", toDelete);
  }

  return {
    total: all.length,
    updated,
    deleted: toDelete.length,
    failed,
    upToDate: all.length - todo.length,
  };
}
