-- Agregar columnas de límite de escaneos al perfil
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query → Run

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS scans_used INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS scan_credits INT NOT NULL DEFAULT 0;
