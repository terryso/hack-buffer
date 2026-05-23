import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useEffect, useRef } from "react";
import { getAllPosts, formatDate } from "@/lib/posts";
import { SearchBox } from "@/components/SearchBox";
import { AI_ENABLED } from "@/lib/ai-flag";

const PER_PAGE = 10;

const searchSchema = z.object({
  page: fallback(z.number().int().min(1), 1).default(1),
});

export const Route = createFileRoute("/")({
  validateSearch: zodValidator(searchSchema),
  component: Index,
  head: () => ({
    meta: [
      { title: "terry.so — Agent 内核深潜与 Swift 原生开发笔记" },
      { name: "description", content: "Terry So 的技术博客：AI Agent SDK 内核拆解、Swift/macOS 原生开发实战、开发者工具造轮子记录。" },
      { property: "og:title", content: "terry.so — Agent 内核深潜" },
      { property: "og:description", content: "首页索引：终端风格列出全部文章，覆盖 AI Agent SDK 拆解、Swift/macOS 原生开发与开发者工具造轮子实战笔记。" },
      { property: "og:url", content: "https://blog.suchuanyi.dev/" },
    ],
    links: [{ rel: "canonical", href: "https://blog.suchuanyi.dev/" }],
  }),
});

function Index() {
  const all = getAllPosts();
  const { page } = Route.useSearch();
  const totalPages = Math.max(1, Math.ceil(all.length / PER_PAGE));
  const current = Math.min(Math.max(1, page), totalPages);
  const start = (current - 1) * PER_PAGE;
  const posts = all.slice(start, start + PER_PAGE);

  const navigate = useNavigate();
  const lastKeyRef = useRef<{ key: string; t: number }>({ key: "", t: 0 });
  useEffect(() => {
    const isTyping = (el: EventTarget | null) => {
      const t = el as HTMLElement | null;
      if (!t) return false;
      const tag = t.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || t.isContentEditable;
    };
    const go = (p: number) => {
      const target = Math.min(Math.max(1, p), totalPages);
      if (target === current) return;
      navigate({ to: "/", search: { page: target } });
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTyping(e.target)) return;
      if (e.key === "h" || e.key === "ArrowLeft" || e.key === "[") {
        e.preventDefault();
        go(current - 1);
      } else if (e.key === "l" || e.key === "ArrowRight" || e.key === "]") {
        e.preventDefault();
        go(current + 1);
      } else if (e.key === "G") {
        e.preventDefault();
        go(totalPages);
      } else if (e.key === "g") {
        const now = Date.now();
        if (lastKeyRef.current.key === "g" && now - lastKeyRef.current.t < 500) {
          e.preventDefault();
          go(1);
          lastKeyRef.current = { key: "", t: 0 };
        } else {
          lastKeyRef.current = { key: "g", t: now };
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, totalPages, navigate]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* Banner */}
      <header className="mb-12 border-l-2 border-accent pl-4">
        <pre className="text-[10px] sm:text-xs text-accent leading-tight overflow-x-auto">{`$ ls -la ~/articles | sed -n '${start + 1},${start + posts.length}p'`}</pre>
        <h1 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight">
          Agent 内核深潜<span className="text-accent cursor-blink">_</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground font-sans max-w-xl">
          AI Agent、Swift 原生开发与开发者工具的实践笔记。拆 SDK、造轮子、记踩坑。
        </p>
      </header>

      {AI_ENABLED && <SearchBox />}

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">recent_buffers</h2>
        <span className="text-[10px] text-muted-foreground">
          PAGE {String(current).padStart(2, "0")}/{String(totalPages).padStart(2, "0")} · TOTAL {String(all.length).padStart(2, "0")}
        </span>
      </div>

      <div className="divide-y divide-border border-y border-border">
        {posts.map((post, i) => (
          <Link
            key={post.slug}
            to="/posts/$slug"
            params={{ slug: post.slug }}
            className="group block py-6 hover:bg-surface/60 transition-colors"
          >
            <div className="grid grid-cols-[2.5rem_1fr] md:grid-cols-[3rem_1fr_11rem] gap-3">
              <div className="text-muted-foreground text-xs pt-1.5">{String(start + i + 1).padStart(2, "0")}</div>
              <div className="space-y-2 min-w-0">
                <h3 className="text-base sm:text-lg font-bold group-hover:text-accent transition-colors leading-snug">
                  {post.title}
                </h3>
                {post.description && (
                  <p className="text-muted-foreground text-sm font-sans leading-relaxed line-clamp-2">
                    {post.description}
                  </p>
                )}
                {post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {post.tags.slice(0, 5).map((t) => (
                      <span key={t} className="text-[10px] px-1.5 py-0.5 border border-border text-muted-foreground">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="hidden md:flex flex-col items-end justify-start text-[10px] text-muted-foreground gap-1 pt-1.5">
                <span>UPDATED: {formatDate(post.date)}</span>
                <span>SIZE: {post.sizeKB}KB</span>
                <span>READ: {post.readingMinutes}MIN</span>
              </div>
            </div>
          </Link>
        ))}
        {posts.length === 0 && (
          <div className="py-12 text-center text-muted-foreground text-sm">
            $ no posts yet — add a markdown file to <code className="text-accent">content/posts/</code>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="mt-10 flex items-center justify-between gap-4 text-sm" aria-label="Pagination">
          <div className="flex-1">
            {current > 1 ? (
              <Link
                to="/"
                search={{ page: current - 1 }}
                className="inline-block px-4 py-2 border border-border hover:border-accent/60 hover:text-accent transition-colors"
              >
                ← prev
              </Link>
            ) : (
              <span className="inline-block px-4 py-2 border border-border/50 text-muted-foreground cursor-not-allowed">← prev</span>
            )}
          </div>

          <div className="flex items-center gap-1 text-[11px] text-muted-foreground uppercase tracking-widest">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                to="/"
                search={{ page: p }}
                className={
                  p === current
                    ? "px-2.5 py-1 border border-accent text-accent"
                    : "px-2.5 py-1 border border-border hover:border-accent/60 hover:text-accent transition-colors"
                }
              >
                {String(p).padStart(2, "0")}
              </Link>
            ))}
          </div>

          <div className="flex-1 text-right">
            {current < totalPages ? (
              <Link
                to="/"
                search={{ page: current + 1 }}
                className="inline-block px-4 py-2 border border-border hover:border-accent/60 hover:text-accent transition-colors"
              >
                next →
              </Link>
            ) : (
              <span className="inline-block px-4 py-2 border border-border/50 text-muted-foreground cursor-not-allowed">next →</span>
            )}
          </div>
        </nav>
      )}
    </div>
  );
}
