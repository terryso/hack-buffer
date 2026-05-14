import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  component: About,
  head: () => ({
    meta: [
      { title: "About — TERRYSO::DEV" },
      { name: "description", content: "About this blog and its author." },
    ],
  }),
});

function About() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <pre className="text-xs text-accent mb-2">$ cat ~/about.md</pre>
      <h1 className="text-3xl font-bold mb-6">whoami</h1>
      <div className="markdown">
        <p>
          Hi — I'm <strong>Terry</strong>. This is a personal tech blog for notes about software, AI tooling,
          and the practice of building.
        </p>
        <p>
          The site is intentionally plain-text first. Every post is a Markdown file in{" "}
          <code>content/posts/</code>; rendering, indexing, tags, and SEO are derived from frontmatter at
          build time.
        </p>
        <h2>How to add a post</h2>
        <ol>
          <li>Create <code>content/posts/YYYY-MM-DD-slug.md</code></li>
          <li>Add YAML frontmatter (<code>title</code>, <code>description</code>, <code>date</code>, <code>tags</code>)</li>
          <li>Write Markdown — code blocks, tables, images, inline HTML all work</li>
          <li>Save → the index reflects it instantly</li>
        </ol>
        <h2>Keyboard</h2>
        <ul>
          <li><kbd>g</kbd> — go home</li>
          <li><kbd>t</kbd> — tags</li>
          <li><kbd>a</kbd> — about</li>
          <li><kbd>⌘K</kbd> / <kbd>Ctrl K</kbd> — command palette</li>
        </ul>
      </div>
    </div>
  );
}
