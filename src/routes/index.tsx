import { createFileRoute, Link } from "@tanstack/react-router";
import { getAllPosts, formatDate } from "@/lib/posts";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const posts = getAllPosts();

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* Banner */}
      <header className="mb-12 border-l-2 border-accent pl-4">
        <pre className="text-[10px] sm:text-xs text-accent leading-tight overflow-x-auto">{`$ ls -la ~/articles | head -n ${posts.length}`}</pre>
        <h1 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight">
          Agent 内核深潜<span className="text-accent cursor-blink">_</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground font-sans max-w-xl">
          AI Agent、Swift 原生开发与开发者工具的实践笔记。拆 SDK、造轮子、记踩坑。
        </p>
      </header>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">recent_buffers</h2>
        <span className="text-[10px] text-muted-foreground">COUNT: {String(posts.length).padStart(2, "0")}</span>
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
              <div className="text-muted-foreground text-xs pt-1.5">{String(i + 1).padStart(2, "0")}</div>
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
    </div>
  );
}
