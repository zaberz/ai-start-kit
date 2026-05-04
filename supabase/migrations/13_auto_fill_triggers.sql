-- Step 13: 自动填充 user_created / user_updated 的触发器

CREATE OR REPLACE FUNCTION public.set_user_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- 只在未传入 user_created 时才从 auth.uid() 填入
  IF NEW.user_created IS NULL THEN
    NEW.user_created = auth.uid();
  END IF;
  -- 只在未传入 date_created 时才填入当前时间（保留迁移数据的原始时间）
  IF NEW.date_created IS NULL THEN
    NEW.date_created = now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_user_updated()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- 只在未传入 user_updated 时才从 auth.uid() 填入
  IF NEW.user_updated IS NULL THEN
    NEW.user_updated = auth.uid();
  END IF;
  -- 只在未传入 date_updated 时才填入当前时间（保留迁移数据的原始时间）
  IF NEW.date_updated IS NULL THEN
    NEW.date_updated = now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_classify_user_created
  BEFORE INSERT ON public.classify
  FOR EACH ROW EXECUTE FUNCTION public.set_user_created();
CREATE TRIGGER set_classify_user_updated
  BEFORE UPDATE ON public.classify
  FOR EACH ROW EXECUTE FUNCTION public.set_user_updated();

CREATE TRIGGER set_tag_color_user_created
  BEFORE INSERT ON public.tag_color
  FOR EACH ROW EXECUTE FUNCTION public.set_user_created();
CREATE TRIGGER set_tag_color_user_updated
  BEFORE UPDATE ON public.tag_color
  FOR EACH ROW EXECUTE FUNCTION public.set_user_updated();

CREATE TRIGGER set_tag_shazhi_user_created
  BEFORE INSERT ON public.tag_shazhi
  FOR EACH ROW EXECUTE FUNCTION public.set_user_created();
CREATE TRIGGER set_tag_shazhi_user_updated
  BEFORE UPDATE ON public.tag_shazhi
  FOR EACH ROW EXECUTE FUNCTION public.set_user_updated();

CREATE TRIGGER set_sku_user_created
  BEFORE INSERT ON public.sku
  FOR EACH ROW EXECUTE FUNCTION public.set_user_created();
CREATE TRIGGER set_sku_user_updated
  BEFORE UPDATE ON public.sku
  FOR EACH ROW EXECUTE FUNCTION public.set_user_updated();

CREATE TRIGGER set_sku_classify_price_user_created
  BEFORE INSERT ON public.sku_classify_price
  FOR EACH ROW EXECUTE FUNCTION public.set_user_created();
CREATE TRIGGER set_sku_classify_price_user_updated
  BEFORE UPDATE ON public.sku_classify_price
  FOR EACH ROW EXECUTE FUNCTION public.set_user_updated();

CREATE TRIGGER set_customer_user_created
  BEFORE INSERT ON public.customer
  FOR EACH ROW EXECUTE FUNCTION public.set_user_created();
CREATE TRIGGER set_customer_user_updated
  BEFORE UPDATE ON public.customer
  FOR EACH ROW EXECUTE FUNCTION public.set_user_updated();

CREATE TRIGGER set_appointment_user_created
  BEFORE INSERT ON public.appointment
  FOR EACH ROW EXECUTE FUNCTION public.set_user_created();
CREATE TRIGGER set_appointment_user_updated
  BEFORE UPDATE ON public.appointment
  FOR EACH ROW EXECUTE FUNCTION public.set_user_updated();

CREATE TRIGGER set_order_user_created
  BEFORE INSERT ON public."order"
  FOR EACH ROW EXECUTE FUNCTION public.set_user_created();
CREATE TRIGGER set_order_user_updated
  BEFORE UPDATE ON public."order"
  FOR EACH ROW EXECUTE FUNCTION public.set_user_updated();

CREATE TRIGGER set_order_payment_user_created
  BEFORE INSERT ON public.order_payment
  FOR EACH ROW EXECUTE FUNCTION public.set_user_created();
CREATE TRIGGER set_order_payment_user_updated
  BEFORE UPDATE ON public.order_payment
  FOR EACH ROW EXECUTE FUNCTION public.set_user_updated();

CREATE TRIGGER set_order_progress_user_created
  BEFORE INSERT ON public.order_progress
  FOR EACH ROW EXECUTE FUNCTION public.set_user_created();
CREATE TRIGGER set_order_progress_user_updated
  BEFORE UPDATE ON public.order_progress
  FOR EACH ROW EXECUTE FUNCTION public.set_user_updated();

CREATE TRIGGER set_order_sku_detail_user_created
  BEFORE INSERT ON public.order_sku_detail
  FOR EACH ROW EXECUTE FUNCTION public.set_user_created();
CREATE TRIGGER set_order_sku_detail_user_updated
  BEFORE UPDATE ON public.order_sku_detail
  FOR EACH ROW EXECUTE FUNCTION public.set_user_updated();
