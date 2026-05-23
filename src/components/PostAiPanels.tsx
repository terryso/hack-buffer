import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { getPostBundle, type RelatedPost } from "@/lib/posts-ai.functions";
import { getPostBySlug } from "@/lib/posts";

// Combined panel: fetches tldr + related once, renders both inline.
// Lives in the post page; first render shows skeletons, then content.
export function PostAiPanels({ slug, position }: { slug: string; position: "top" | "bottom" }) {
  const bundle = useServerFn(getPostBundle);
  const [state, setState] = useState<{
    loading: boolean;
    tldr: string | null;
    related: RelatedPost[];
    error: string | null;
  }>({ loading: true, tldr: null, related: [], error: null });

  useEffect(() => {
    let cancelled = false;
    setState({ loading: true, tldr: null, related: [], error: null });
    bundle({ data: { slug } })
      .then((r) => {
        if (cancelled) return;
        setState({ loading: false, tldr: r.tldr, related: r.related, error: null });
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setState({
          loading: false,
          tldr: null,
          related: [],
          error: e instanceof Error ? e.message : "fetch failed",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [slug, bundle]);

  if (position === "top") {
    // TL;DR block — comment-style, fits the terminal aesthetic
    if (state.loading) {
      return (
        <div className="mb-8 border-l-2 border-accent/40 pl-4 py-1 text-xs text-muted-foreground">
          <span className="text-accent/60">// tl;dr:</span> generating summary...
        </div>
      );
    }
    if (!state.tldr) return null;
    return (
      <div className="mb-10 border-l-2 border-accent pl-4 py-1">
        <div className="text-[10px] uppercase tracking-widest text-accent mb-1.5">
          // tl;dr · ai generated
        </div>
        <p className="text-sm text-foreground/90 font-sans leading-relaxed">{state.tldr}</p>
      </div>
    );
  }

  // bottom: related posts
  if (state.loading) {
    return (
      <div className="mt-10 text-xs text-muted-foreground">
        <span className="text-accent">// related:</span> searching nearest posts...
      </div>
    );
  }
  if (state.related.length === 0) return null;

  return (
    <section className="mt-12 pt-8 border-t border-border">
      <div className="text-[11px] text-muted-foreground uppercase tracking-widest mb-4">
        // related · semantic
      </div>
      <ul className="space-y-3">
        {state.related.map((r) => {
          const post = getPostBySlug(r.slug);
          return (
            <li key={r.slug}>
              <Link
                to="/posts/$slug"
                params={{ slug: r.slug }}
                className="group block border border-border hover:border-accent/60 p-4 transition-colors"
              >
                <div className="flex items-baseline gap-3">
                  <span className="text-[10px] text-accent font-mono shrink-0">
                    {Math.round(r.similarity * 100)}%
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-sm group-hover:text-accent transition-colors leading-snug">
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
    </section>
  );
}
