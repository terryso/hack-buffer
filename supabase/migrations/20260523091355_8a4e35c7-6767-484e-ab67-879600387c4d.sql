-- pgvector 扩展
create extension if not exists vector;

-- 每篇博客的 AI 衍生数据
create table public.posts_ai (
  slug text primary key,
  content_hash text not null,
  tldr text not null,
  embedding vector(1536) not null,
  updated_at timestamptz not null default now()
);

alter table public.posts_ai enable row level security;

-- 公开博客 —— 任何人都可以读
create policy "Anyone can read posts_ai"
  on public.posts_ai
  for select
  using (true);

-- 写入只能通过服务端(service role 自动绕过 RLS,不需要 policy)

-- HNSW 索引加速余弦相似度搜索
create index posts_ai_embedding_idx
  on public.posts_ai
  using hnsw (embedding vector_cosine_ops);

-- 自动更新 updated_at
create or replace function public.update_posts_ai_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger posts_ai_updated_at
  before update on public.posts_ai
  for each row execute function public.update_posts_ai_updated_at();

-- 相似度搜索函数:输入向量,返回最相似的 N 篇,可选排除某 slug
create or replace function public.match_posts(
  query_embedding vector(1536),
  match_count int default 5,
  exclude_slug text default null
)
returns table (
  slug text,
  tldr text,
  similarity float
)
language sql stable
as $$
  select
    p.slug,
    p.tldr,
    1 - (p.embedding <=> query_embedding) as similarity
  from public.posts_ai p
  where exclude_slug is null or p.slug <> exclude_slug
  order by p.embedding <=> query_embedding
  limit match_count;
$$;