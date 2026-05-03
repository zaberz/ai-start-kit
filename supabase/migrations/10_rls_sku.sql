-- Step 10: RLS 策略 - SKU 相关表

CREATE POLICY "sku_select_authenticated" ON public.sku
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "sku_insert_authenticated" ON public.sku
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "sku_update_authenticated" ON public.sku
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "sku_delete_authenticated" ON public.sku
  FOR DELETE TO authenticated USING (true);

CREATE POLICY "sku_classify_price_select_authenticated" ON public.sku_classify_price
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "sku_classify_price_insert_authenticated" ON public.sku_classify_price
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "sku_classify_price_update_authenticated" ON public.sku_classify_price
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "sku_classify_price_delete_authenticated" ON public.sku_classify_price
  FOR DELETE TO authenticated USING (true);
