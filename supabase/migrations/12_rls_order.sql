-- Step 12: RLS 策略 - 订单相关表

CREATE POLICY "order_select_authenticated" ON public."order"
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "order_insert_authenticated" ON public."order"
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "order_update_authenticated" ON public."order"
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "order_delete_authenticated" ON public."order"
  FOR DELETE TO authenticated USING (true);

CREATE POLICY "order_payment_select_authenticated" ON public.order_payment
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "order_payment_insert_authenticated" ON public.order_payment
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "order_payment_update_authenticated" ON public.order_payment
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "order_payment_delete_authenticated" ON public.order_payment
  FOR DELETE TO authenticated USING (true);

CREATE POLICY "order_progress_select_authenticated" ON public.order_progress
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "order_progress_insert_authenticated" ON public.order_progress
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "order_progress_update_authenticated" ON public.order_progress
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "order_progress_delete_authenticated" ON public.order_progress
  FOR DELETE TO authenticated USING (true);

CREATE POLICY "order_sku_detail_select_authenticated" ON public.order_sku_detail
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "order_sku_detail_insert_authenticated" ON public.order_sku_detail
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "order_sku_detail_update_authenticated" ON public.order_sku_detail
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "order_sku_detail_delete_authenticated" ON public.order_sku_detail
  FOR DELETE TO authenticated USING (true);
