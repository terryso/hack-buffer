import { useState, useRef, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { searchPosts, type SearchResult } from "@/lib/posts-ai.functions";
import { getPostBySlug } from "@/lib/posts";

export function SearchBox() {
  const search = useServerFn(searchPosts);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // `/` focuses the search (vim-ish)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) return;
      if (e.key === "/") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const run = async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) {
      setResults(null);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { results } = await search({ data: { query: trimmed } });
      setResults(results);
    } catch (e) {
      setError(e instanceof Error ? e.message : "search failed");
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-8">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(query);
        }}
        className="flex items-center gap-2 border border-border bg-surface/40 px-3 py-2 focus-within:border-accent/60 transition-colors"
      >
        <span className="text-accent text-sm select-none">$</span>
        <span className="text-muted-foreground text-sm select-none">grep -r</span>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="问点啥...例如 swift agent 集成"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
          aria-label="语义搜索"
        />
        <kbd className="hidden sm:inline text-[10px] text-muted-foreground border border-border px-1.5 py-0.5">
          /
        </kbd>
      </form>

      {loading && (
        <div className="mt-3 text-xs text-muted-foreground">
          <span className="text-accent">$</span> embedding query...
        </div>
      )}

      {error && (
        <div className="mt-3 text-xs text-destructive">
          <span className="text-accent">$</span> err: {error}
        </div>
      )}

      {results && !loading && (
        <div className="mt-4 border border-border bg-surface/20">
          <div className="px-3 py-2 border-b border-border text-[10px] uppercase tracking-widest text-muted-foreground flex justify-between">
            <span>// {results.length} match{results.length === 1 ? "" : "es"}</span>
            <button
              onClick={() => {
                setResults(null);
                setQuery("");
              }}
              className="hover:text-accent transition-colors"
            >
              [x] close
            </button>
          </div>
          {results.length === 0 ? (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
              no matches — try different wording
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {results.map((r) => {
                const post = getPostBySlug(r.slug);
                return (
                  <li key={r.slug}>
                    <Link
                      to="/posts/$slug"
                      params={{ slug: r.slug }}
                      className="block px-3 py-3 hover:bg-surface/60 transition-colors"
                    >
                      <div className="flex items-baseline gap-3">
                        <span className="text-[10px] text-accent font-mono shrink-0">
                          {Math.round(r.similarity * 100)}%
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-sm leading-snug">
                            {post?.title ?? r.slug}
                          </div>
                          <p className="text-xs text-muted-foreground font-sans leading-relaxed mt-1 line-clamp-2">
                            {r.tldr}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
