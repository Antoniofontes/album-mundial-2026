-- ============================================================
-- Migración v3: simplificar kinds y agregar hojas custom.
-- Correr DESPUÉS de album_pages_v2.sql.
-- ============================================================

-- 1. Crear la columna custom_label primero (idempotente)
alter table public.album_pages
  add column if not exists custom_label text;

-- 2. Aflojar el check constraint actual antes de migrar filas
alter table public.album_pages
  drop constraint if exists album_pages_kind_check;

-- 3. Migrar las filas existentes con kinds eliminados a 'custom'
update public.album_pages
set custom_label = case kind
      when 'intro' then 'Introducción / FIFA'
      when 'stadium' then 'Estadios'
      when 'legend' then 'Campeones del Mundo / Leyendas'
      else custom_label
    end,
    kind = 'custom'
where kind in ('intro', 'stadium', 'legend');

-- 4. Reinstalar el check constraint con los kinds nuevos
alter table public.album_pages
  add constraint album_pages_kind_check
  check (kind in ('team', 'coca_cola', 'special', 'custom'));

-- 5. Wipe de la collection del usuario (modelo viejo era incorrecto)
-- IMPORTANTE: esto borra TODAS las marcas de TODOS los usuarios.
-- Si querés conservar algo, comentá esta sección.
truncate table public.collection;
truncate table public.holdings;
truncate table public.scans;

-- 6. Wipe del bucket de scans también para empezar limpio
-- (el storage no se borra desde SQL — limpialo manualmente desde el dashboard si querés)
