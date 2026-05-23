# terry.so — 一个被 AI 索引过的开发者博客

[English](./README.md)

一个 terminal 风格的个人技术博客,完全在 [Lovable](https://lovable.dev) 上端到端搭建,内置了一条轻量级 RAG 管线:每篇文章自动生成 TL;DR、推荐 3 篇语义相关的旧文,首页支持自然语言搜索。

> 线上: <https://blog.suchuanyi.dev>
> Lovable 预览: <https://blog-magic-sync.lovable.app>

---

## ✨ 亮点

### UI — 终端风、内容优先
- 等宽字体、深色背景、闪烁光标 —— 像在终端里读文章,但版式专门为中文长文调过。
- 基于 **Tailwind CSS v4** + **shadcn/ui** + 语义化 token(`src/styles.css` 里的 `oklch`)。组件层不写任何裸色值。
- 文章是 `content/posts/` 下的纯 Markdown,通过 `react-markdown` + `rehype-highlight` 渲染,代码块自带高亮。
- 首屏 < 100KB,TanStack Start SSR,每个路由都有独立的 canonical / OG / JSON-LD。

### AI — 三个功能,一条管线,零 API Key
全部通过 **Lovable AI Gateway** 调用(项目里没有任何 OpenAI / Gemini key):

1. **每篇文章的 TL;DR** —— 用 `google/gemini-3-flash-preview` 生成 3 句中文摘要,展示在正文上方。
2. **语义相关推荐** —— 用 `google/gemini-embedding-001`(1536 维)生成 embedding,存进 `pgvector`,通过 `match_posts` RPC 做余弦相似度查询。每篇文章下方给出最相关的 3 篇。
3. **首页自然语言搜索** —— 输入「如何用 Swift 写 AI Agent」,首页按语义而不是关键词返回最相关的文章。

### 增量同步 —— 用内容哈希做闸门
索引管线只会重算「真正变过」的文章:
- 每篇文章用 `cyrb53` 对 `title + description + body` 算一个指纹。
- 一个 `POST /api/public/sync-posts` 接口扫描全部文章,upsert 新增/变更、删除已下线,返回 `{ updated, deleted, failed, upToDate }`。
- 本地一个脚本 `./scripts/sync-posts.sh` 在你推完 markdown 到 GitHub 后调用它。不用 CI,不用胶水代码。

---

## 🧱 技术栈

| 层 | 选型 |
|---|---|
| 框架 | TanStack Start(React 19、SSR、文件路由) |
| 构建 | Vite 7 |
| 样式 | Tailwind v4 + shadcn/ui |
| 后端 | Lovable Cloud(Supabase)—— Postgres + pgvector + RLS |
| AI | Lovable AI Gateway —— Gemini embedding + Gemini Flash 写 TL;DR |
| 部署 | Cloudflare Workers(通过 Lovable Publish) |
| 内容 | `content/posts/` 下的 Markdown,用 `gray-matter` 解析 |

---

## 🗂 目录结构

```
content/posts/              所有文章的 markdown 源文件
src/routes/                 文件路由(TanStack Router)
  index.tsx                 首页 + 语义搜索
  posts.$slug.tsx           文章页(TL;DR + 相关推荐)
  api/public/sync-posts.ts  对外的同步触发接口
src/lib/posts-ai.functions.ts  服务端函数:embed、TL;DR、search、sync
src/components/PostAiPanels.tsx  TL;DR + 相关推荐 UI
src/components/SearchBox.tsx     首页自然语言搜索框
supabase/migrations/        pgvector schema、match_posts RPC、RLS
scripts/sync-posts.sh       本地调用同步接口的脚本
```

---

## 🚀 本地开发

```bash
bun install
bun dev
```

写完或改完文章,推到 GitHub 后:

```bash
./scripts/sync-posts.sh        # 打到 dev 预览
./scripts/sync-posts.sh prod   # 打到生产(需要先在 Lovable 上 Publish 过新版本)
```

接口是幂等的 —— 没变过的文章不会重算,也不花钱。

### 当成纯静态博客跑(不要 AI、不要服务端)

所有 AI 能力(TL;DR、相关文章、语义搜索、`/api/public/sync-posts`)由一个环境变量统一控制。想剥掉服务端,回到经典静态博客形态:

```bash
# .env
VITE_ENABLE_AI=false
```

关掉后:
- `SearchBox` 和 `PostAiPanels` 不渲染,不会发起任何 server function 调用
- `/api/public/sync-posts` 直接返回 `503`
- 运行时不再需要 `LOVABLE_API_KEY`,也不会调用 Lovable Cloud / Supabase

默认是**开启**的(`VITE_ENABLE_AI` 未设置或为 `"true"`),与线上部署一致。

---


## 🤝 用 Lovable 搭的

整个项目 —— UI、服务端函数、数据库 schema、RAG 管线、部署 —— 都是在 Lovable 上通过对话搭出来的。GitHub 双向同步打开以后,本地改也行,两边实时同步。

想 fork 这个思路:在 Lovable 里打开,把 `content/posts/` 换成你自己的 markdown,AI 功能开箱即用。

---

## 📄 License

MIT
