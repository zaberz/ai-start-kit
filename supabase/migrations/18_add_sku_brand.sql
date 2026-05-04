ALTER TABLE public.sku
  ADD COLUMN IF NOT EXISTS brand text;
