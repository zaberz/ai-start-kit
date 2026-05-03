-- ============================================================
-- LaFibre CRM - RLS 权限策略
-- 核心原则：只有登录用户才能查看和操作数据
-- ============================================================

-- ============================================================
-- classify 分类表 RLS
-- ============================================================
CREATE POLICY "classify_select_authenticated" ON public.classify
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "classify_insert_authenticated" ON public.classify
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "classify_update_authenticated" ON public.classify
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "classify_delete_authenticated" ON public.classify
  FOR DELETE TO authenticated USING (true);

-- ============================================================
-- tag_color 颜色标签表 RLS
-- ============================================================
CREATE POLICY "tag_color_select_authenticated" ON public.tag_color
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "tag_color_insert_authenticated" ON public.tag_color
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "tag_color_update_authenticated" ON public.tag_color
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "tag_color_delete_authenticated" ON public.tag_color
  FOR DELETE TO authenticated USING (true);

-- ============================================================
-- tag_shazhi 纱质标签表 RLS
-- ============================================================
CREATE POLICY "tag_shazhi_select_authenticated" ON public.tag_shazhi
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "tag_shazhi_insert_authenticated" ON public.tag_shazhi
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "tag_shazhi_update_authenticated" ON public.tag_shazhi
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "tag_shazhi_delete_authenticated" ON public.tag_shazhi
  FOR DELETE TO authenticated USING (true);

-- ============================================================
-- sku 面料SKU表 RLS
-- ============================================================
CREATE POLICY "sku_select_authenticated" ON public.sku
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "sku_insert_authenticated" ON public.sku
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "sku_update_authenticated" ON public.sku
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "sku_delete_authenticated" ON public.sku
  FOR DELETE TO authenticated USING (true);

-- ============================================================
-- sku_classify_price SKU分类价格表 RLS
-- ============================================================
CREATE POLICY "sku_classify_price_select_authenticated" ON public.sku_classify_price
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "sku_classify_price_insert_authenticated" ON public.sku_classify_price
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "sku_classify_price_update_authenticated" ON public.sku_classify_price
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "sku_classify_price_delete_authenticated" ON public.sku_classify_price
  FOR DELETE TO authenticated USING (true);

-- ============================================================
-- customer 客户表 RLS
-- ============================================================
CREATE POLICY "customer_select_authenticated" ON public.customer
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "customer_insert_authenticated" ON public.customer
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "customer_update_authenticated" ON public.customer
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "customer_delete_authenticated" ON public.customer
  FOR DELETE TO authenticated USING (true);

-- ============================================================
-- appointment 预约表 RLS
-- ============================================================
CREATE POLICY "appointment_select_authenticated" ON public.appointment
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "appointment_insert_authenticated" ON public.appointment
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "appointment_update_authenticated" ON public.appointment
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "appointment_delete_authenticated" ON public.appointment
  FOR DELETE TO authenticated USING (true);

-- ============================================================
-- order 订单表 RLS
-- ============================================================
CREATE POLICY "order_select_authenticated" ON public."order"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "order_insert_authenticated" ON public."order"
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "order_update_authenticated" ON public."order"
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "order_delete_authenticated" ON public."order"
  FOR DELETE TO authenticated USING (true);

-- ============================================================
-- order_payment 订单付款表 RLS
-- ============================================================
CREATE POLICY "order_payment_select_authenticated" ON public.order_payment
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "order_payment_insert_authenticated" ON public.order_payment
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "order_payment_update_authenticated" ON public.order_payment
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "order_payment_delete_authenticated" ON public.order_payment
  FOR DELETE TO authenticated USING (true);

-- ============================================================
-- order_progress 订单进度表 RLS
-- ============================================================
CREATE POLICY "order_progress_select_authenticated" ON public.order_progress
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "order_progress_insert_authenticated" ON public.order_progress
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "order_progress_update_authenticated" ON public.order_progress
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "order_progress_delete_authenticated" ON public.order_progress
  FOR DELETE TO authenticated USING (true);

-- ============================================================
-- order_sku_detail 订单SKU明细表 RLS
-- ============================================================
CREATE POLICY "order_sku_detail_select_authenticated" ON public.order_sku_detail
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "order_sku_detail_insert_authenticated" ON public.order_sku_detail
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "order_sku_detail_update_authenticated" ON public.order_sku_detail
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "order_sku_detail_delete_authenticated" ON public.order_sku_detail
  FOR DELETE TO authenticated USING (true);

-- ============================================================
-- 自动填充 user_created 字段的触发器函数
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_user_created()
RETURNS trigger AS $$
BEGIN
  NEW.user_created = auth.uid();
  NEW.date_created = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.set_user_updated()
RETURNS trigger AS $$
BEGIN
  NEW.user_updated = auth.uid();
  NEW.date_updated = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 为各表创建自动填充触发器
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
