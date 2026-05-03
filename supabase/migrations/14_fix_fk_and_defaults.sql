ALTER TABLE public.classify
  DROP CONSTRAINT classify_user_created_fkey,
  DROP CONSTRAINT classify_user_updated_fkey,
  ADD CONSTRAINT classify_user_created_fkey FOREIGN KEY (user_created) REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD CONSTRAINT classify_user_updated_fkey FOREIGN KEY (user_updated) REFERENCES auth.users(id) ON DELETE SET NULL,
  ALTER COLUMN date_created SET DEFAULT now(),
  ALTER COLUMN date_updated SET DEFAULT now();

ALTER TABLE public.tag_color
  DROP CONSTRAINT tag_color_user_created_fkey,
  DROP CONSTRAINT tag_color_user_updated_fkey,
  ADD CONSTRAINT tag_color_user_created_fkey FOREIGN KEY (user_created) REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD CONSTRAINT tag_color_user_updated_fkey FOREIGN KEY (user_updated) REFERENCES auth.users(id) ON DELETE SET NULL,
  ALTER COLUMN date_created SET DEFAULT now(),
  ALTER COLUMN date_updated SET DEFAULT now();

ALTER TABLE public.tag_shazhi
  DROP CONSTRAINT tag_shazhi_user_created_fkey,
  DROP CONSTRAINT tag_shazhi_user_updated_fkey,
  ADD CONSTRAINT tag_shazhi_user_created_fkey FOREIGN KEY (user_created) REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD CONSTRAINT tag_shazhi_user_updated_fkey FOREIGN KEY (user_updated) REFERENCES auth.users(id) ON DELETE SET NULL,
  ALTER COLUMN date_created SET DEFAULT now(),
  ALTER COLUMN date_updated SET DEFAULT now();

ALTER TABLE public.sku
  DROP CONSTRAINT sku_user_created_fkey,
  DROP CONSTRAINT sku_user_updated_fkey,
  ADD CONSTRAINT sku_user_created_fkey FOREIGN KEY (user_created) REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD CONSTRAINT sku_user_updated_fkey FOREIGN KEY (user_updated) REFERENCES auth.users(id) ON DELETE SET NULL,
  ALTER COLUMN date_created SET DEFAULT now(),
  ALTER COLUMN date_updated SET DEFAULT now();

ALTER TABLE public.sku_classify_price
  DROP CONSTRAINT sku_classify_price_user_created_fkey,
  DROP CONSTRAINT sku_classify_price_user_updated_fkey,
  ADD CONSTRAINT sku_classify_price_user_created_fkey FOREIGN KEY (user_created) REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD CONSTRAINT sku_classify_price_user_updated_fkey FOREIGN KEY (user_updated) REFERENCES auth.users(id) ON DELETE SET NULL,
  ALTER COLUMN date_created SET DEFAULT now(),
  ALTER COLUMN date_updated SET DEFAULT now();

ALTER TABLE public.customer
  DROP CONSTRAINT customer_user_created_fkey,
  DROP CONSTRAINT customer_user_updated_fkey,
  ADD CONSTRAINT customer_user_created_fkey FOREIGN KEY (user_created) REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD CONSTRAINT customer_user_updated_fkey FOREIGN KEY (user_updated) REFERENCES auth.users(id) ON DELETE SET NULL,
  ALTER COLUMN date_created SET DEFAULT now(),
  ALTER COLUMN date_updated SET DEFAULT now();

ALTER TABLE public.appointment
  DROP CONSTRAINT appointment_user_created_fkey,
  DROP CONSTRAINT appointment_user_updated_fkey,
  ADD CONSTRAINT appointment_user_created_fkey FOREIGN KEY (user_created) REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD CONSTRAINT appointment_user_updated_fkey FOREIGN KEY (user_updated) REFERENCES auth.users(id) ON DELETE SET NULL,
  ALTER COLUMN date_created SET DEFAULT now(),
  ALTER COLUMN date_updated SET DEFAULT now();

ALTER TABLE public."order"
  DROP CONSTRAINT order_user_created_fkey,
  DROP CONSTRAINT order_user_updated_fkey,
  ADD CONSTRAINT order_user_created_fkey FOREIGN KEY (user_created) REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD CONSTRAINT order_user_updated_fkey FOREIGN KEY (user_updated) REFERENCES auth.users(id) ON DELETE SET NULL,
  ALTER COLUMN date_created SET DEFAULT now(),
  ALTER COLUMN date_updated SET DEFAULT now();

ALTER TABLE public.order_payment
  DROP CONSTRAINT order_payment_user_created_fkey,
  DROP CONSTRAINT order_payment_user_updated_fkey,
  ADD CONSTRAINT order_payment_user_created_fkey FOREIGN KEY (user_created) REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD CONSTRAINT order_payment_user_updated_fkey FOREIGN KEY (user_updated) REFERENCES auth.users(id) ON DELETE SET NULL,
  ALTER COLUMN date_updated SET DEFAULT now();

ALTER TABLE public.order_progress
  DROP CONSTRAINT order_progress_user_created_fkey,
  DROP CONSTRAINT order_progress_user_updated_fkey,
  ADD CONSTRAINT order_progress_user_created_fkey FOREIGN KEY (user_created) REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD CONSTRAINT order_progress_user_updated_fkey FOREIGN KEY (user_updated) REFERENCES auth.users(id) ON DELETE SET NULL,
  ALTER COLUMN date_created SET DEFAULT now(),
  ALTER COLUMN date_updated SET DEFAULT now();

ALTER TABLE public.order_sku_detail
  DROP CONSTRAINT order_sku_detail_user_created_fkey,
  DROP CONSTRAINT order_sku_detail_user_updated_fkey,
  ADD CONSTRAINT order_sku_detail_user_created_fkey FOREIGN KEY (user_created) REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD CONSTRAINT order_sku_detail_user_updated_fkey FOREIGN KEY (user_updated) REFERENCES auth.users(id) ON DELETE SET NULL,
  ALTER COLUMN date_created SET DEFAULT now(),
  ALTER COLUMN date_updated SET DEFAULT now();
