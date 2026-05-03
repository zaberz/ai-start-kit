ALTER TABLE public.profiles
  DROP CONSTRAINT profiles_id_fkey,
  ADD COLUMN IF NOT EXISTS name text;

UPDATE public.profiles
SET name = TRIM(BOTH FROM CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, '')))
WHERE name IS NULL AND (first_name IS NOT NULL OR last_name IS NOT NULL);

UPDATE public.profiles
SET name = display_name
WHERE (name IS NULL OR name = '') AND display_name IS NOT NULL AND display_name != '';

ALTER TABLE public.profiles
  ALTER COLUMN id SET DEFAULT uuid_generate_v4();

CREATE POLICY "profiles_insert_authenticated" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "profiles_update_authenticated" ON public.profiles
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "profiles_delete_authenticated" ON public.profiles
  FOR DELETE TO authenticated USING (true);
