ALTER TABLE public.sku
  ADD COLUMN IF NOT EXISTS remark text,
  ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;

ALTER TABLE public.tag_color
  ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;

ALTER TABLE public.tag_shazhi
  ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;
