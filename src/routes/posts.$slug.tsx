import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getPostBySlug, getAllPosts, formatDate } from "@/lib/posts";
import { Markdown } from "@/components/Markdown";

export const Route = createFileRoute("/posts/$slug")({
  component: PostPage,
  loader: ({ params }) => {
    const post = getPostBySlug(params.slug);
    if (!post) throw notFound();
    return { post };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.post.title} — terry.so` },
          { name: "description", content: loaderData.post.description ?? loaderData.post.title },
          { property: "og:title", content: loaderData.post.title },
          { property: "og:description", content: loaderData.post.description ?? "" },
          { property: "og:type", content: "article" },
        ]
      : [],
  }),
  notFoundComponent: () => (
    <div className="max-w-3xl mx-auto px-4 py-24 text-center">
      <pre className="text-accent">$ cat: post not found</pre>
      <Link to="/" className="text-accent underline mt-4 inline-block">cd ~/</Link>
    </div>
  ),
});

function PostPage() {
  const { post } = Route.useLoaderData();
  const all = getAllPosts();
  const idx = all.findIndex((p) => p.slug === post.slug);
  const prev = all[idx + 1];
  const next = all[idx - 1];

  return (
    <article className="max-w-3xl mx-auto px-4 py-12">
      {/* Frontmatter banner */}
      <div className="text-xs text-muted-foreground border border-border bg-surface/40 p-4 mb-10 rounded">
        <div className="text-accent">---</div>
        <div className="grid grid-cols-[5rem_1fr] gap-y-1 my-1">
          <span>title:</span>
          <span className="text-foreground">"{post.title}"</span>
          <span>date:</span>
          <span className="text-foreground">{formatDate(post.date)}</span>
          {post.categories.length > 0 && (
            <>
              <span>category:</span>
              <span className="text-foreground">[{post.categories.join(", ")}]</span>
            </>
          )}
          {post.tags.length > 0 && (
            <>
              <span>tags:</span>
              <span className="text-foreground">[{post.tags.join(", ")}]</span>
            </>
          )}
          <span>status:</span>
          <span className="text-accent">published</span>
        </div>
        <div className="text-accent">---</div>
      </div>

      <header className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-[1.15] font-mono">
          {post.title}
        </h1>
        {post.description && (
          <p className="mt-4 text-base text-muted-foreground font-sans leading-relaxed">
            {post.description}
          </p>
        )}
        <div className="mt-5 flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground uppercase tracking-widest">
          <span>{formatDate(post.date)}</span>
          <span>·</span>
          <span>{post.readingMinutes} min read</span>
          <span>·</span>
          <span>{post.sizeKB}KB</span>
        </div>
      </header>

      <Markdown>{post.content}</Markdown>

      {/* Tags */}
      {post.tags.length > 0 && (
        <div className="mt-16 pt-6 border-t border-border flex flex-wrap gap-2">
          {post.tags.map((t: string) => (
            <Link
              key={t}
              to="/tags/$tag"
              params={{ tag: t }}
              className="text-[11px] px-2 py-1 border border-border text-muted-foreground hover:text-accent hover:border-accent/60 transition-colors"
            >
              #{t}
            </Link>
          ))}
        </div>
      )}

      {/* Prev / next */}
      <nav className="mt-10 grid grid-cols-2 gap-4 text-sm">
        <div>
          {prev && (
            <Link to="/posts/$slug" params={{ slug: prev.slug }} className="block p-4 border border-border hover:border-accent/60 hover:text-accent transition-colors group">
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">← prev</div>
              <div className="font-bold line-clamp-2">{prev.title}</div>
            </Link>
          )}
        </div>
        <div>
          {next && (
            <Link to="/posts/$slug" params={{ slug: next.slug }} className="block p-4 border border-border hover:border-accent/60 hover:text-accent transition-colors text-right">
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">next →</div>
              <div className="font-bold line-clamp-2">{next.title}</div>
            </Link>
          )}
        </div>
      </nav>
    </article>
  );
}
