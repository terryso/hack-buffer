import { createFileRoute, Link } from "@tanstack/react-router";
import { getPostsByTag, formatDate, type Post } from "@/lib/posts";

export const Route = createFileRoute("/tags/$tag")({
  component: TagPage,
  loader: ({ params }) => ({ posts: getPostsByTag(params.tag), tag: params.tag }),
  head: ({ loaderData, params }) => {
    const tag = loaderData?.tag ?? params.tag;
    const count = loaderData?.posts.length ?? 0;
    const url = `https://blog.suchuanyi.dev/tags/${encodeURIComponent(tag)}`;
    return {
      meta: [
        { title: `#${tag} — terry.so` },
        { name: "description", content: `terry.so 上标签为 #${tag} 的全部技术文章合集（共 ${count} 篇），按发布时间倒序排列，涵盖相关实战笔记与踩坑记录。` },
        { property: "og:title", content: `#${tag} — terry.so` },
        { property: "og:description", content: `浏览 terry.so 上标签为 #${tag} 的全部技术文章（共 ${count} 篇），按时间倒序排列。` },
        { property: "og:url", content: url },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
});

function TagPage() {
  const { posts, tag } = Route.useLoaderData();

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <header className="mb-8 border-l-2 border-accent pl-4">
        <pre className="text-xs text-accent">$ grep -l "#{tag}" ~/articles/*</pre>
        <h1 className="mt-2 text-2xl font-bold">
          <span className="text-muted-foreground">tag:</span> #{tag}
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">{posts.length} post(s)</p>
      </header>

      <div className="divide-y divide-border border-y border-border">
        {posts.map((post: Post, i: number) => (
          <Link
            key={post.slug}
            to="/posts/$slug"
            params={{ slug: post.slug }}
            className="group block py-5 hover:bg-surface/60 transition-colors"
          >
            <div className="grid grid-cols-[2.5rem_1fr] md:grid-cols-[3rem_1fr_8rem] gap-3">
              <div className="text-muted-foreground text-xs pt-1">{String(i + 1).padStart(2, "0")}</div>
              <div>
                <h2 className="font-bold group-hover:text-accent transition-colors">{post.title}</h2>
                {post.description && (
                  <p className="text-muted-foreground text-sm font-sans mt-1 line-clamp-1">{post.description}</p>
                )}
              </div>
              <div className="hidden md:block text-right text-[10px] text-muted-foreground pt-1">
                {formatDate(post.date)}
              </div>
            </div>
          </Link>
        ))}
        {posts.length === 0 && <div className="py-12 text-center text-muted-foreground text-sm">no posts under this tag</div>}
      </div>

      <Link to="/tags" className="inline-block mt-6 text-xs text-muted-foreground hover:text-accent">← all tags</Link>
    </div>
  );
}
