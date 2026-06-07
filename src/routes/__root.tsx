// build: rebuild to re-inject VITE_SUPABASE_* env vars
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { SiteShell } from "@/components/SiteShell";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "terry.so — terminal-style tech blog" },
      { name: "description", content: "AI Agent 内核拆解、Swift/macOS 原生开发与开发者工具造轮子实战笔记。记录 SDK 深潜、Agent Loop、MCP 与日常开发踩坑。" },
      { name: "author", content: "Terry So" },
      { property: "og:title", content: "terry.so — terminal-style tech blog" },
      { property: "og:description", content: "AI Agent 内核拆解、Swift/macOS 原生开发与开发者工具造轮子实战笔记。记录 SDK 深潜、Agent Loop、MCP 与日常开发踩坑。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@suchuanyi" },
      { name: "twitter:creator", content: "@suchuanyi" },
      { name: "twitter:title", content: "terry.so — terminal-style tech blog" },
      { name: "twitter:description", content: "AI Agent 内核拆解、Swift/macOS 原生开发与开发者工具造轮子实战笔记。记录 SDK 深潜、Agent Loop、MCP 与日常开发踩坑。" },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/4b2942bc-d396-4c2c-bbbe-001fcd9441ef" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/4b2942bc-d396-4c2c-bbbe-001fcd9441ef" },
      { name: "google-site-verification", content: "vrDXebTTxS9QYk4kUiNgbrb-zl5YdYDRbCp80STfw-M" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
    ],
    scripts: [
      {
        src: "https://www.googletagmanager.com/gtag/js?id=G-734TFMZ8ZN",
        async: true,
      },
      {
        children: `window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', 'G-734TFMZ8ZN');`,
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebSite",
              "@id": "https://blog.suchuanyi.dev/#website",
              url: "https://blog.suchuanyi.dev/",
              name: "terry.so",
              description: "AI Agent、Swift 原生开发与开发者工具的实践笔记。",
              inLanguage: "zh-CN",
            },
            {
              "@type": "Person",
              "@id": "https://blog.suchuanyi.dev/#person",
              name: "Terry So (NEE)",
              url: "https://blog.suchuanyi.dev/about",
              sameAs: [
                "https://github.com/terryso",
                "https://x.com/suchuanyi",
              ],
            },
          ],
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <SiteShell>
        <Outlet />
      </SiteShell>
    </QueryClientProvider>
  );
}
