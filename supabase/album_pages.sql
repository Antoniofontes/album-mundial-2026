-- ============================================================
-- Migración: tabla de páginas de referencia del álbum vacío.
-- Correr DESPUÉS del schema.sql inicial.
-- ============================================================

create table if not exists public.album_pages (
  id uuid primary key default gen_random_uuid(),
  uploaded_by uuid references auth.users(id) on delete set null,
  kind text not null check (kind in ('team','intro','stadium','coca_cola','legend','special')),
  team_code text,
  storage_path text not null,
  sticker_numbers integer[] not null default '{}',
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create unique index if not exists album_pages_kind_team_idx
  on public.album_pages (kind, coalesce(team_code, ''));

alter table public.album_pages enable row level security;

drop policy if exists "anyone authenticated can read pages" on public.album_pages;
create policy "anyone authenticated can read pages"
  on public.album_pages
  for select
  using (auth.role() = 'authenticated');

drop policy if exists "anyone authenticated can insert pages" on public.album_pages;
create policy "anyone authenticated can insert pages"
  on public.album_pages
  for insert
  with check (auth.uid() is not null);

drop policy if exists "uploader can update pages" on public.album_pages;
create policy "uploader can update pages"
  on public.album_pages
  for update
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

drop policy if exists "uploader can delete pages" on public.album_pages;
create policy "uploader can delete pages"
  on public.album_pages
  for delete
  using (auth.uid() is not null);

-- ============================================================
-- Bucket de storage para las referencias (privado).
-- ============================================================

insert into storage.buckets (id, name, public)
values ('album-pages', 'album-pages', false)
on conflict (id) do nothing;

drop policy if exists "auth users read pages" on storage.objects;
create policy "auth users read pages"
  on storage.objects
  for select
  using (bucket_id = 'album-pages' and auth.role() = 'authenticated');

drop policy if exists "auth users upload pages" on storage.objects;
create policy "auth users upload pages"
  on storage.objects
  for insert
  with check (bucket_id = 'album-pages' and auth.uid() is not null);

drop policy if exists "auth users update pages" on storage.objects;
create policy "auth users update pages"
  on storage.objects
  for update
  using (bucket_id = 'album-pages' and auth.uid() is not null);

drop policy if exists "auth users delete pages" on storage.objects;
create policy "auth users delete pages"
  on storage.objects
  for delete
  using (bucket_id = 'album-pages' and auth.uid() is not null);
