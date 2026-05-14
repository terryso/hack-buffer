import { createFileRoute, Link } from "@tanstack/react-router";
import { getAllTags } from "@/lib/posts";

export const Route = createFileRoute("/tags")({
  component: TagsIndex,
  head: () => ({ meta: [{ title: "Tags — terry.so" }] }),
});

function TagsIndex() {
  const tags = getAllTags();
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <header className="mb-8 border-l-2 border-accent pl-4">
        <pre className="text-xs text-accent">$ ls ~/tags</pre>
        <h1 className="mt-2 text-2xl font-bold">All tags</h1>
      </header>
      <ul className="flex flex-wrap gap-3">
        {tags.map(({ tag, count }) => (
          <li key={tag}>
            <Link
              to="/tags/$tag"
              params={{ tag }}
              className="inline-flex items-center gap-2 px-3 py-1.5 border border-border hover:border-accent/60 hover:text-accent transition-colors text-sm"
            >
              <span>#{tag}</span>
              <span className="text-[10px] text-muted-foreground">{count}</span>
            </Link>
          </li>
        ))}
        {tags.length === 0 && <li className="text-muted-foreground text-sm">no tags yet</li>}
      </ul>
    </div>
  );
}
