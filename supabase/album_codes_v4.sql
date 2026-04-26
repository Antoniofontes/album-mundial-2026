-- ============================================================
-- Migración v4: pasar el modelo de NÚMERO GLOBAL (1..980) a
-- CÓDIGO STRING (ARG12, FWC3, CC7, 00, etc.) — total 994 stickers.
-- Correr DESPUÉS de album_pages_v3.sql.
-- ============================================================

-- 0. Wipear datos viejos. Ya estaban vacíos pero por las dudas.
truncate table public.collection;
truncate table public.holdings;
truncate table public.scans;
truncate table public.album_pages;

-- ============================================================
-- 1. collection: sticker_number int -> sticker_code text
-- ============================================================
alter table public.collection drop constraint if exists collection_pkey;
alter table public.collection drop constraint if exists collection_sticker_number_check;
alter table public.collection drop column if exists sticker_number;

alter table public.collection
  add column if not exists sticker_code text not null default '00';

-- Quitar el default ahora que ya no hay filas
alter table public.collection alter column sticker_code drop default;

alter table public.collection
  add primary key (user_id, sticker_code);

drop index if exists collection_sticker_idx;
create index if not exists collection_sticker_code_idx
  on public.collection(sticker_code);

-- ============================================================
-- 2. holdings: sticker_number int -> sticker_code text
-- ============================================================
alter table public.holdings drop constraint if exists holdings_sticker_number_check;
alter table public.holdings drop column if exists sticker_number;

alter table public.holdings
  add column if not exists sticker_code text not null default '00';

alter table public.holdings alter column sticker_code drop default;

drop index if exists holdings_sticker_idx;
create index if not exists holdings_sticker_code_idx
  on public.holdings(sticker_code);

-- ============================================================
-- 3. scans: detected_numbers int[] -> detected_codes text[]
-- ============================================================
alter table public.scans drop column if exists detected_numbers;
alter table public.scans
  add column if not exists detected_codes text[] not null default '{}';

-- ============================================================
-- 4. album_pages: sticker_numbers int[] -> sticker_codes text[]
--    + permitir kind nuevos (intro, fwc) además de los existentes.
-- ============================================================
alter table public.album_pages drop column if exists sticker_numbers;
alter table public.album_pages
  add column if not exists sticker_codes text[] not null default '{}';

alter table public.album_pages drop constraint if exists album_pages_kind_check;
alter table public.album_pages
  add constraint album_pages_kind_check
  check (kind in ('team', 'coca_cola', 'fwc', 'intro', 'custom'));

-- ============================================================
-- 5. Recrear vista user_stats con el total = 994
-- ============================================================
drop view if exists public.user_stats cascade;
create or replace view public.user_stats as
select
  p.id as user_id,
  p.username,
  p.display_name,
  p.avatar_url,
  p.is_public,
  coalesce(sum(case when c.count > 0 then 1 else 0 end), 0)::int as owned,
  coalesce(sum(case when c.count > 1 then c.count - 1 else 0 end), 0)::int as duplicates,
  coalesce(sum(c.count), 0)::int as total_count,
  994 - coalesce(sum(case when c.count > 0 then 1 else 0 end), 0)::int as missing
from public.profiles p
left join public.collection c on c.user_id = p.id
group by p.id, p.username, p.display_name, p.avatar_url, p.is_public;

grant select on public.user_stats to anon, authenticated;
