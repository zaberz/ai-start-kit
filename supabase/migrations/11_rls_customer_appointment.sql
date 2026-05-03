-- Step 11: RLS 策略 - 客户和预约表

CREATE POLICY "customer_select_authenticated" ON public.customer
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "customer_insert_authenticated" ON public.customer
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "customer_update_authenticated" ON public.customer
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "customer_delete_authenticated" ON public.customer
  FOR DELETE TO authenticated USING (true);

CREATE POLICY "appointment_select_authenticated" ON public.appointment
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "appointment_insert_authenticated" ON public.appointment
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "appointment_update_authenticated" ON public.appointment
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "appointment_delete_authenticated" ON public.appointment
  FOR DELETE TO authenticated USING (true);
