// Server functions for AI-powered blog features:
//   - syncAllPosts:   incremental embed + TL;DR generation, content-hash gated
//   - ensurePostIndexed: same but for a single post (used on first view)
//   - getPostBundle:  fetch tldr + related for a slug; auto-syncs if missing
//   - searchPosts:    semantic search via pgvector
import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getAllPosts, getPostBySlug, type Post } from "@/lib/posts";

const EMBEDDING_MODEL = "google/gemini-embedding-001";
const EMBEDDING_DIMS = 1536;
const TLDR_MODEL = "google/gemini-3-flash-preview";

// cyrb53 — fast non-crypto hash, deterministic across runs
function cyrb53(s: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < s.length; i++) {
    const ch = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

function postFingerprint(p: Post): string {
  // includes content so editing a post triggers re-embed
  return cyrb53(`${p.title}|${p.description ?? ""}|${p.content}`);
}

function postForEmbedding(p: Post): string {
  // title + description + body (capped to keep cost predictable)
  const body = p.content.slice(0, 8000);
  return `${p.title}\n\n${p.description ?? ""}\n\n${body}`;
}

function vectorLiteral(v: number[]): string {
  return `[${v.join(",")}]`;
}

async function embed(text: string): Promise<number[]> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY not configured");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: text,
      dimensions: EMBEDDING_DIMS,
    }),
  });
  if (!res.ok) {
    throw new Error(`Embedding API ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as { data: { embedding: number[] }[] };
  return data.data[0].embedding;
}

async function generateTldr(p: Post): Promise<string> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY not configured");
  const body = p.content.slice(0, 12000);
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: TLDR_MODEL,
      messages: [
        {
          role: "system",
          content:
            "你在为一篇技术博客生成 TL;DR。输出 3 句话中文,简体,共 80-160 字。第一句点明问题或主题,第二句说做法或方案,第三句说结论或可借鉴的点。不要 markdown,不要列表,不要引号,不要任何前缀(如「TL;DR:」),纯文本即可。",
        },
        {
          role: "user",
          content: `标题: ${p.title}\n\n${body}`,
        },
      ],
    }),
  });
  if (!res.ok) {
    throw new Error(`TL;DR API ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as { choices: { message: { content: string } }[] };
  return (data.choices?.[0]?.message?.content ?? "").trim();
}

async function indexPost(p: Post): Promise<void> {
  const fp = postFingerprint(p);
  const [embedding, tldr] = await Promise.all([embed(postForEmbedding(p)), generateTldr(p)]);
  const { error } = await supabaseAdmin.from("posts_ai").upsert({
    slug: p.slug,
    content_hash: fp,
    tldr,
    embedding: vectorLiteral(embedding),
  });
  if (error) throw new Error(`upsert failed: ${error.message}`);
}

// Ensure a single post is indexed and up-to-date. Cheap if cached.
export const ensurePostIndexed = createServerFn({ method: "POST" })
  .inputValidator((data: { slug: string }) => data)
  .handler(async ({ data }) => {
    const post = getPostBySlug(data.slug);
    if (!post) return { ok: false as const };
    const fp = postFingerprint(post);
    const { data: row } = await supabaseAdmin
      .from("posts_ai")
      .select("content_hash")
      .eq("slug", post.slug)
      .maybeSingle();
    if (row?.content_hash === fp) return { ok: true as const, cached: true };
    await indexPost(post);
    return { ok: true as const, cached: false };
  });

// Walk all posts, upsert new/changed, delete removed.
export const syncAllPosts = createServerFn({ method: "POST" }).handler(async () => {
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
});

// Get TL;DR + related for a post. Auto-indexes if missing.
export const getPostBundle = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => data)
  .handler(async ({ data }) => {
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
      await indexPost(post);
      const { data: refreshed } = await supabaseAdmin
        .from("posts_ai")
        .select("tldr, embedding")
        .eq("slug", post.slug)
        .maybeSingle();
      embeddingLiteral = refreshed?.embedding as string | undefined;
      tldr = refreshed?.tldr ?? null;
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

// Semantic search over all indexed posts.
export const searchPosts = createServerFn({ method: "POST" })
  .inputValidator((data: { query: string }) => data)
  .handler(async ({ data }) => {
    const q = data.query.trim();
    if (!q) return { results: [] as SearchResult[] };
    const queryEmbedding = await embed(q);
    const { data: matches, error } = await supabaseAdmin.rpc("match_posts", {
      query_embedding: vectorLiteral(queryEmbedding),
      match_count: 8,
    });
    if (error) throw new Error(error.message);
    return { results: (matches ?? []) as SearchResult[] };
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
