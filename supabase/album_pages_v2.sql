-- ============================================================
-- Migración v2: agregar team_sheet (1 ó 2) a album_pages.
-- Correr DESPUÉS de album_pages.sql.
-- ============================================================

alter table public.album_pages
  add column if not exists team_sheet smallint
  check (team_sheet in (1, 2));

-- Reemplazamos el unique index por uno que considere el sheet
drop index if exists album_pages_kind_team_idx;
drop index if exists album_pages_kind_team_sheet_idx;
create unique index album_pages_kind_team_sheet_idx
  on public.album_pages (
    kind,
    coalesce(team_code, ''),
    coalesce(team_sheet::text, '')
  );
