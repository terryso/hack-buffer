// Server functions for AI-powered blog features:
//   - ensurePostIndexed: index a single post (used on first view)
//   - getPostBundle:  fetch tldr + related for a slug; auto-syncs if missing
//   - searchPosts:    semantic search via pgvector
//
// NOTE: batch sync is intentionally NOT exposed as a createServerFn (which
// would register an unauthenticated RPC endpoint). It lives in
// posts-sync.server.ts and is only callable from the auth-protected
// /api/public/sync-posts route.
import { createServerFn } from "@tanstack/react-start";
import { getPostBySlug } from "@/lib/posts";

export const ensurePostIndexed = createServerFn({ method: "POST" })
  .inputValidator((data: { slug: string }) => data)
  .handler(async ({ data }) => {
    const [{ supabaseAdmin }, { AiServiceError, indexPost, postFingerprint }] = await Promise.all([
      import("@/integrations/supabase/client.server"),
      import("@/lib/posts-ai-core.server"),
    ]);
    const post = getPostBySlug(data.slug);
    if (!post) return { ok: false as const };
    const fp = postFingerprint(post);
    const { data: row } = await supabaseAdmin
      .from("posts_ai")
      .select("content_hash")
      .eq("slug", post.slug)
      .maybeSingle();
    if (row?.content_hash === fp) return { ok: true as const, cached: true };
    try {
      await indexPost(post);
    } catch (e) {
      if (e instanceof AiServiceError) return { ok: false as const };
      throw e;
    }
    return { ok: true as const, cached: false };
  });

export const getPostBundle = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => data)
  .handler(async ({ data }) => {
    const [{ supabaseAdmin }, { AiServiceError, indexPost, postFingerprint }] = await Promise.all([
      import("@/integrations/supabase/client.server"),
      import("@/lib/posts-ai-core.server"),
    ]);
    const post = getPostBySlug(data.slug);
    if (!post) return { tldr: null, related: [] as RelatedPost[] };

    const fp = postFingerprint(post);
    const { data: row } = await supabaseAdmin
      .from("posts_ai")
      .select("content_hash, tldr, embedding")
      .eq("slug", post.slug)
      .maybeSingle();

    let embeddingLiteral = row?.embedding as string | undefined;
    let tldr = row?.tldr ?? null;
    if (!row || row.content_hash !== fp) {
      try {
        await indexPost(post);
        const { data: refreshed } = await supabaseAdmin
          .from("posts_ai")
          .select("tldr, embedding")
          .eq("slug", post.slug)
          .maybeSingle();
        embeddingLiteral = refreshed?.embedding as string | undefined;
        tldr = refreshed?.tldr ?? null;
      } catch (e) {
        if (!(e instanceof AiServiceError)) throw e;
        // fall through with whatever stale data we have (or none)
      }
    }

    let related: RelatedPost[] = [];
    if (embeddingLiteral) {
      const { data: matches } = await supabaseAdmin.rpc("match_posts", {
        query_embedding: embeddingLiteral as unknown as string,
        match_count: 3,
        exclude_slug: post.slug,
      });
      related = (matches ?? []) as RelatedPost[];
    }

    return { tldr, related };
  });

export const searchPosts = createServerFn({ method: "POST" })
  .inputValidator((data: { query: string }) => {
    if (!data || typeof data.query !== "string") {
      throw new Error("query must be a string");
    }
    const q = data.query.trim();
    if (q.length === 0) throw new Error("query is required");
    if (q.length > 500) throw new Error("query too long (max 500 chars)");
    return { query: q };
  })
  .handler(async ({ data }) => {
    const [{ supabaseAdmin }, { AiServiceError, embed, vectorLiteral }] = await Promise.all([
      import("@/integrations/supabase/client.server"),
      import("@/lib/posts-ai-core.server"),
    ]);
    const q = data.query;
    if (!q) return { results: [] as SearchResult[] };
    try {
      const queryEmbedding = await embed(q);
      const { data: matches, error } = await supabaseAdmin.rpc("match_posts", {
        query_embedding: vectorLiteral(queryEmbedding),
        match_count: 8,
      });
      if (error) {
        console.error("[search] match_posts:", error);
        throw new Error("Search temporarily unavailable");
      }
      return { results: (matches ?? []) as SearchResult[] };
    } catch (e) {
      if (e instanceof AiServiceError) {
        // Already a generic message; rethrow as plain Error for client.
        throw new Error(e.message);
      }
      throw e;
    }
  });

export interface RelatedPost {
  slug: string;
  tldr: string;
  similarity: number;
}

export interface SearchResult {
  slug: string;
  tldr: string;
  similarity: number;
}
