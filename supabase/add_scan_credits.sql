-- =====================================================================
-- Límite de escaneos freemium
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query → Run
-- =====================================================================

-- 1. Columnas en profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS scans_used INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS scan_credits INT NOT NULL DEFAULT 0;

-- 2. Función atómica SECURITY DEFINER
--    Verifica el límite e incrementa en una sola transacción.
--    El FOR UPDATE bloquea la fila → evita race condition.
--    SECURITY DEFINER = corre como postgres, no como el usuario → no bypasseable.
CREATE OR REPLACE FUNCTION public.use_scan()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_used      int;
  v_credits   int;
  v_remaining int;
  FREE_LIMIT  CONSTANT int := 30;
BEGIN
  SELECT scans_used, scan_credits
    INTO v_used, v_credits
    FROM profiles
   WHERE id = auth.uid()
     FOR UPDATE;

  v_remaining := FREE_LIMIT + v_credits - v_used;

  IF v_remaining <= 0 THEN
    RETURN -1;
  END IF;

  UPDATE profiles SET scans_used = scans_used + 1 WHERE id = auth.uid();
  RETURN v_remaining - 1;
END;
$$;

-- Solo usuarios autenticados pueden llamar a la función
REVOKE ALL ON FUNCTION public.use_scan() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.use_scan() TO authenticated;

-- 3. Política de update que bloquea cambios en scans_used y scan_credits
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND scans_used   IS NOT DISTINCT FROM (SELECT scans_used   FROM profiles WHERE id = auth.uid())
    AND scan_credits IS NOT DISTINCT FROM (SELECT scan_credits FROM profiles WHERE id = auth.uid())
  );
