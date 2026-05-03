-- Step 7: 创建索引

CREATE INDEX idx_classify_user_created ON public.classify(user_created);
CREATE INDEX idx_classify_user_updated ON public.classify(user_updated);

CREATE INDEX idx_tag_color_user_created ON public.tag_color(user_created);
CREATE INDEX idx_tag_color_user_updated ON public.tag_color(user_updated);

CREATE INDEX idx_tag_shazhi_user_created ON public.tag_shazhi(user_created);
CREATE INDEX idx_tag_shazhi_user_updated ON public.tag_shazhi(user_updated);

CREATE INDEX idx_sku_user_created ON public.sku(user_created);
CREATE INDEX idx_sku_user_updated ON public.sku(user_updated);

CREATE INDEX idx_sku_classify_price_sku ON public.sku_classify_price(sku_id);
CREATE INDEX idx_sku_classify_price_classify ON public.sku_classify_price(classify_id);

CREATE INDEX idx_customer_user_created ON public.customer(user_created);
CREATE INDEX idx_customer_user_updated ON public.customer(user_updated);

CREATE INDEX idx_appointment_counselor ON public.appointment(counselor_id);
CREATE INDEX idx_appointment_customer ON public.appointment(customer_id);
CREATE INDEX idx_appointment_user_created ON public.appointment(user_created);

CREATE INDEX idx_order_user_id ON public."order"(user_id);
CREATE INDEX idx_order_customer_id ON public."order"(customer_id);
CREATE INDEX idx_order_user_created ON public."order"(user_created);

CREATE INDEX idx_order_payment_order_id ON public.order_payment(order_id);

CREATE INDEX idx_order_progress_order_id ON public.order_progress(order_id);

CREATE INDEX idx_order_sku_detail_order_id ON public.order_sku_detail(order_id);
CREATE INDEX idx_order_sku_detail_sku_id ON public.order_sku_detail(sku_id);
CREATE INDEX idx_order_sku_detail_classify_id ON public.order_sku_detail(classify_id);
CREATE INDEX idx_order_sku_detail_color_id ON public.order_sku_detail(color_id);
CREATE INDEX idx_order_sku_detail_shazhi_id ON public.order_sku_detail(shazhi_id);
