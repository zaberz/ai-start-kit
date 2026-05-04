-- Step 17: 修复触发器，允许数据迁移时保留原始 date_created / date_updated
--
-- 原触发器无条件用 now() 覆盖时间字段，导致迁移后所有记录时间变成迁移当天。
-- 修复：仅在字段为 NULL 时才填入默认值，若已传入值则保留。

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
