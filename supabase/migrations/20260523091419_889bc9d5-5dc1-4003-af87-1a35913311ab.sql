-- 给两个函数显式设置 search_path
create or replace function public.update_posts_ai_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

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
language sql
stable
security invoker
set search_path = public, extensions
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

-- pgvector 移到 extensions schema
create schema if not exists extensions;
alter extension vector set schema extensions;