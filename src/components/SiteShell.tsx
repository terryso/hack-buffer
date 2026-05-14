import { useEffect, useState } from "react";
import { Link, useLocation, useRouter } from "@tanstack/react-router";

export function SiteShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const router = useRouter();
  const [palette, setPalette] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPalette((v) => !v);
      } else if (e.key === "Escape") {
        setPalette(false);
      } else if (!palette && (e.target as HTMLElement)?.tagName !== "INPUT") {
        if (e.key === "g") {
          // pseudo gg → home
          router.navigate({ to: "/" });
        } else if (e.key === "t") {
          router.navigate({ to: "/tags" });
        } else if (e.key === "a") {
          router.navigate({ to: "/about" });
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [palette, router]);

  // breadcrumb path
  const segments = location.pathname.split("/").filter(Boolean);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-mono">
      {/* Top status bar */}
      <nav className="sticky top-0 z-40 bg-background/85 backdrop-blur-md border-b border-border">
        <div className="max-w-5xl mx-auto px-4 h-12 flex items-center justify-between text-xs">
          <div className="flex items-center gap-6 min-w-0">
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <span className="text-accent">●</span>
              <span className="font-bold tracking-tight">terry.so</span>
            </Link>
            <div className="hidden md:flex items-center gap-2 text-muted-foreground truncate">
              <span>~/</span>
              {segments.length === 0 ? (
                <span className="text-foreground">home</span>
              ) : (
                segments.map((s, i) => (
                  <span key={i} className="flex items-center gap-2">
                    <span className={i === segments.length - 1 ? "text-foreground" : ""}>{s}</span>
                    {i < segments.length - 1 && <span>/</span>}
                  </span>
                ))
              )}
              <span className="text-accent/80 ml-2">main*</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-muted-foreground">
            <button
              onClick={() => setPalette(true)}
              className="hidden sm:inline-flex items-center gap-1.5 border border-border px-2 py-0.5 rounded hover:text-foreground hover:border-accent/50 transition-colors"
            >
              <span>⌘K</span>
            </button>
            <div className="hidden md:flex items-center gap-2">
              <span className="size-2 bg-accent rounded-full animate-pulse" />
              <span>CONNECTED</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 pb-20">{children}</main>

      {/* Footer status line — vim-like */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 bg-surface border-t border-border text-[10px]">
        <div className="max-w-5xl mx-auto px-4 py-1.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <span className="bg-accent text-accent-foreground px-1.5 py-0.5 font-bold tracking-wide">NORMAL</span>
            <span className="text-muted-foreground hidden sm:inline truncate">
              {location.pathname === "/" ? "index.md" : `${location.pathname.replace(/^\//, "")}.md`}
            </span>
          </div>
          <div className="flex items-center gap-4 text-muted-foreground">
            <span className="hidden md:inline"><kbd className="text-accent">g</kbd> home</span>
            <span className="hidden md:inline"><kbd className="text-accent">t</kbd> tags</span>
            <span className="hidden md:inline"><kbd className="text-accent">a</kbd> about</span>
            <span className="hidden sm:inline"><kbd className="text-accent">⌘K</kbd> palette</span>
            <span className="text-accent/80">UTF-8</span>
            <span>{now.toTimeString().slice(0, 5)}</span>
          </div>
        </div>
      </footer>

      {palette && <CommandPalette onClose={() => setPalette(false)} />}
    </div>
  );
}

function CommandPalette({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const items = [
    { label: ":home", action: () => router.navigate({ to: "/" }) },
    { label: ":tags", action: () => router.navigate({ to: "/tags" }) },
    { label: ":about", action: () => router.navigate({ to: "/about" }) },
  ];
  const filtered = items.filter((i) => i.label.includes(q.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm flex items-start justify-center pt-[20vh] px-4" onClick={onClose}>
      <div className="w-full max-w-lg bg-surface border border-border rounded-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b border-border px-3 py-2 text-sm">
          <span className="text-accent">$</span>
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && filtered[0]) {
                filtered[0].action();
                onClose();
              }
            }}
            placeholder="type a command..."
            className="flex-1 bg-transparent outline-none font-mono text-foreground placeholder:text-muted-foreground"
          />
          <kbd className="text-[10px] text-muted-foreground border border-border px-1 rounded">ESC</kbd>
        </div>
        <ul className="py-1 max-h-64 overflow-y-auto text-sm">
          {filtered.length === 0 && <li className="px-3 py-2 text-muted-foreground">no matches</li>}
          {filtered.map((i) => (
            <li key={i.label}>
              <button
                onClick={() => {
                  i.action();
                  onClose();
                }}
                className="w-full text-left px-3 py-2 hover:bg-background hover:text-accent transition-colors"
              >
                {i.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
