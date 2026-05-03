-- ============================================================
-- LaFibre CRM - 种子数据
-- 用于全新安装时初始化基础数据
-- ============================================================

-- 基础分类
INSERT INTO public.classify (id, name) VALUES
  (1, '两件套'),
  (2, '三件套'),
  (3, '西服'),
  (4, '裤子'),
  (5, '马甲'),
  (7, '衬衫'),
  (8, '袖扣'),
  (9, '领结'),
  (10, '领带'),
  (11, '皮鞋'),
  (12, '活动'),
  (13, '30000充值卡'),
  (14, '里布'),
  (15, 'POLO')
ON CONFLICT (id) DO NOTHING;

-- 颜色标签
INSERT INTO public.tag_color (id, name) VALUES
  (1, '黑'),
  (2, '灰'),
  (3, '白'),
  (4, '红'),
  (5, '蓝'),
  (6, '香槟色')
ON CONFLICT (id) DO NOTHING;

-- 纱质标签
INSERT INTO public.tag_shazhi (id, name) VALUES
  (1, '60''s'),
  (2, '100''s'),
  (3, '110''s'),
  (4, '120''s'),
  (5, '130''s'),
  (6, '140''s'),
  (7, '150''s'),
  (8, '160''s')
ON CONFLICT (id) DO NOTHING;

-- 重置序列到正确的值
SELECT setval('public.classify_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM public.classify));
SELECT setval('public.tag_color_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM public.tag_color));
SELECT setval('public.tag_shazhi_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM public.tag_shazhi));
