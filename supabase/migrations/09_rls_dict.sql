-- Step 9: RLS 策略 - 基础字典表

CREATE POLICY "classify_select_authenticated" ON public.classify
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "classify_insert_authenticated" ON public.classify
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "classify_update_authenticated" ON public.classify
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "classify_delete_authenticated" ON public.classify
  FOR DELETE TO authenticated USING (true);

CREATE POLICY "tag_color_select_authenticated" ON public.tag_color
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "tag_color_insert_authenticated" ON public.tag_color
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "tag_color_update_authenticated" ON public.tag_color
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "tag_color_delete_authenticated" ON public.tag_color
  FOR DELETE TO authenticated USING (true);

CREATE POLICY "tag_shazhi_select_authenticated" ON public.tag_shazhi
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "tag_shazhi_insert_authenticated" ON public.tag_shazhi
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "tag_shazhi_update_authenticated" ON public.tag_shazhi
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "tag_shazhi_delete_authenticated" ON public.tag_shazhi
  FOR DELETE TO authenticated USING (true);
