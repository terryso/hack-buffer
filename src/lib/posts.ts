// Auto-discovers markdown files in /content/posts/*.md.
// Drop a new .md file in content/posts/ and Vite picks it up immediately (HMR).

const modules = import.meta.glob("/content/posts/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;

export interface PostFrontmatter {
  title: string;
  description?: string;
  date: string; // ISO string
  categories: string[];
  tags: string[];
  cover?: string;
  layout?: string;
}

export interface Post extends PostFrontmatter {
  slug: string;
  content: string; // raw markdown body (no frontmatter)
  readingMinutes: number;
  sizeKB: string;
}

// Tiny YAML-lite parser tuned for Jekyll-style frontmatter:
// scalars, quoted strings, ISO dates, [a, b, c] arrays.
function parseFrontmatter(raw: string): { data: Record<string, unknown>; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { data: {}, body: raw };
  const [, fm, body] = match;
  const data: Record<string, unknown> = {};
  for (const line of fm.split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z_][\w-]*)\s*:\s*(.*)$/);
    if (!m) continue;
    const key = m[1];
    let value: string = m[2].trim();
    if (!value) continue;
    // Array: [a, b, "c d"]
    if (value.startsWith("[") && value.endsWith("]")) {
      const inner = value.slice(1, -1).trim();
      data[key] = inner
        ? inner.split(",").map((s) => s.trim().replace(/^["']|["']$/g, ""))
        : [];
      continue;
    }
    // Strip wrapping quotes
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    data[key] = value;
  }
  return { data, body };
}

function toArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === "string" && v.length) return [v];
  return [];
}

function parsePost(path: string, raw: string): Post {
  const filename = path.split("/").pop() ?? "";
  // Filename: 2026-05-14-some-slug.md  →  slug = some-slug
  const base = filename.replace(/\.md$/, "");
  const dateInName = base.match(/^(\d{4}-\d{2}-\d{2})-(.+)$/);
  const slug = dateInName ? dateInName[2] : base;

  const { data, body } = parseFrontmatter(raw);

  const dateRaw = (data.date as string) ?? (dateInName ? dateInName[1] : new Date().toISOString());
  // normalize "2026-05-14 10:25:36 +0800" → "2026-05-14T10:25:36+0800"
  const normalized = String(dateRaw).replace(" ", "T").replace(/\s+([+-]\d{2}:?\d{2})$/, "$1");
  const parsed = new Date(normalized);
  const dateIso = isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();

  const wordCount = body.split(/\s+/).filter(Boolean).length + body.replace(/\s/g, "").length / 2;
  const readingMinutes = Math.max(1, Math.round(wordCount / 400));
  const sizeKB = (new Blob([raw]).size / 1024).toFixed(1);

  return {
    slug,
    title: (data.title as string) ?? slug,
    description: data.description as string | undefined,
    date: dateIso,
    categories: toArray(data.categories),
    tags: toArray(data.tags),
    cover: data.cover as string | undefined,
    layout: data.layout as string | undefined,
    content: body,
    readingMinutes,
    sizeKB,
  };
}

const allPosts: Post[] = Object.entries(modules)
  .map(([path, raw]) => parsePost(path, raw))
  .sort((a, b) => (a.date < b.date ? 1 : -1));

export function getAllPosts(): Post[] {
  return allPosts;
}

export function getPostBySlug(slug: string): Post | undefined {
  return allPosts.find((p) => p.slug === slug);
}

export function getAllTags(): { tag: string; count: number }[] {
  const map = new Map<string, number>();
  for (const p of allPosts) for (const t of p.tags) map.set(t, (map.get(t) ?? 0) + 1);
  return Array.from(map, ([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count);
}

export function getPostsByTag(tag: string): Post[] {
  return allPosts.filter((p) => p.tags.includes(tag));
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}
