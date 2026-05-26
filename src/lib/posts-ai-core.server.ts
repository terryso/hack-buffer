// Server-only AI helpers shared by serverFns and the sync route.
// Errors thrown here include details for server logs only — callers must
// translate to generic messages before surfacing to clients.
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Post } from "@/lib/posts";

const EMBEDDING_MODEL = "google/gemini-embedding-001";
const EMBEDDING_DIMS = 1536;
const TLDR_MODEL = "google/gemini-3-flash-preview";

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

export function postFingerprint(p: Post): string {
  return cyrb53(`${p.title}|${p.description ?? ""}|${p.content}`);
}

function postForEmbedding(p: Post): string {
  const body = p.content.slice(0, 8000);
  return `${p.title}\n\n${p.description ?? ""}\n\n${body}`;
}

export function vectorLiteral(v: number[]): string {
  return `[${v.join(",")}]`;
}

// AiServiceError carries a generic public message + internal details for logs.
export class AiServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiServiceError";
  }
}

export async function embed(text: string): Promise<number[]> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) {
    console.error("[ai] LOVABLE_API_KEY not configured");
    throw new AiServiceError("AI service unavailable");
  }
  const res = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: EMBEDDING_MODEL, input: text, dimensions: EMBEDDING_DIMS }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`[ai] embedding ${res.status}:`, body);
    throw new AiServiceError(`AI service temporarily unavailable (${res.status})`);
  }
  const data = (await res.json()) as { data: { embedding: number[] }[] };
  return data.data[0].embedding;
}

export async function generateTldr(p: Post): Promise<string> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) {
    console.error("[ai] LOVABLE_API_KEY not configured");
    throw new AiServiceError("AI service unavailable");
  }
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
        { role: "user", content: `标题: ${p.title}\n\n${body}` },
      ],
    }),
  });
  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    console.error(`[ai] tldr ${res.status}:`, errBody);
    throw new AiServiceError(`AI service temporarily unavailable (${res.status})`);
  }
  const data = (await res.json()) as { choices: { message: { content: string } }[] };
  return (data.choices?.[0]?.message?.content ?? "").trim();
}

export async function indexPost(p: Post): Promise<void> {
  const fp = postFingerprint(p);
  const [embedding, tldr] = await Promise.all([embed(postForEmbedding(p)), generateTldr(p)]);
  const { error } = await supabaseAdmin.from("posts_ai").upsert({
    slug: p.slug,
    content_hash: fp,
    tldr,
    embedding: vectorLiteral(embedding),
  });
  if (error) {
    console.error(`[ai] upsert ${p.slug}:`, error);
    throw new AiServiceError("Failed to persist AI index");
  }
}
