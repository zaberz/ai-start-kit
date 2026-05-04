import * as mysql from "mysql2/promise";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const MYSQL_HOST = process.env.MYSQL_HOST || "localhost";
const MYSQL_PORT = parseInt(process.env.MYSQL_PORT || "3306", 10);
const MYSQL_USER = process.env.MYSQL_USER || "root";
const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD || "";
const MYSQL_DATABASE = process.env.MYSQL_DATABASE || "ficus";

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || "";
const DEFAULT_PASSWORD = process.env.DEFAULT_PASSWORD || "123456";

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("请设置环境变量 SUPABASE_URL 和 SUPABASE_SERVICE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const USER_MAPPING: Record<string, string> = {};

function toNull(val: unknown): string | null {
  if (val === null || val === undefined || val === "") return null;
  return String(val);
}

function toTimestamp(val: unknown): string | null {
  if (val === null || val === undefined || val === "") return null;

  let d: Date;

  if (val instanceof Date) {
    d = val;
  } else {
    const s = String(val).trim();
    if (s === "NULL" || s === "") return null;
    d = new Date(s);
  }

  if (isNaN(d.getTime())) return null;
  if (d.getFullYear() < 1000) return null;
  return d.toISOString();
}

function toDateOnly(val: unknown): string | null {
  const ts = toTimestamp(val);
  if (!ts) return null;
  return ts.split("T")[0];
}

function toBool(val: unknown): boolean | null {
  if (val === null || val === undefined) return null;
  return val === 1 || val === true;
}

function toNumber(val: unknown): number | null {
  if (val === null || val === undefined || val === "") return null;
  const n = parseFloat(String(val));
  return isNaN(n) ? null : n;
}

function toInt(val: unknown): number | null {
  if (val === null || val === undefined || val === "") return null;
  const n = parseInt(String(val), 10);
  return isNaN(n) ? null : n;
}

function mapUserId(directusId: string | null | undefined): string | null {
  if (!directusId) return null;
  return USER_MAPPING[directusId] || null;
}

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`${label} 超时 (${ms}ms)`)), ms)
  );
  return Promise.race([promise, timeout]);
}

async function queryMySQL(pool: mysql.Pool, sql: string): Promise<mysql.RowDataPacket[]> {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query<mysql.RowDataPacket[]>(sql);
    return rows;
  } finally {
    conn.release();
  }
}

async function migrateUsers(pool: mysql.Pool) {
  console.log("\n=== 迁移用户 (directus_users → Supabase Auth) ===");

  const rows = await queryMySQL(pool,
    "SELECT id, first_name, last_name, email, status FROM directus_users WHERE email IS NOT NULL"
  );

  console.log(`找到 ${rows.length} 个用户`);

  console.log("获取 Supabase 现有用户列表...");
  let existingUsers: { id: string; email?: string }[] = [];
  try {
    const { data: existingList } = await withTimeout(
      supabase.auth.admin.listUsers(),
      30000,
      "listUsers"
    );
    existingUsers = existingList?.users || [];
    console.log(`Supabase 中已有 ${existingUsers.length} 个用户`);
  } catch (err) {
    console.error("获取现有用户列表失败:", err);
    console.log("将尝试逐个创建（重复会报错跳过）");
  }

  const existingEmailMap = new Map<string, string>();
  for (const u of existingUsers) {
    if (u.email) existingEmailMap.set(u.email, u.id);
  }

  for (const row of rows) {
    const id: string = row.id;
    const first_name: string | null = row.first_name;
    const last_name: string | null = row.last_name;
    const email: string = row.email;
    const status: string = row.status;

    if (!email) {
      console.log(`跳过无邮箱用户: ${id}`);
      continue;
    }

    const displayName = [first_name, last_name].filter(Boolean).join(" ") || null;

    const existingId = existingEmailMap.get(email);
    if (existingId) {
      USER_MAPPING[id] = existingId;
      console.log(`  用户 ${email} 已存在，映射: ${id} → ${existingId}`);

      await supabase.from("profiles").upsert({
        id: existingId,
        name: displayName,
        email,
        status: status || "active",
      }, { onConflict: "id" });
      continue;
    }

    console.log(`创建用户: ${email} (${displayName})`);

    try {
      const { data, error } = await withTimeout(
        supabase.auth.admin.createUser({
          email,
          password: DEFAULT_PASSWORD,
          email_confirm: true,
          user_metadata: {
            first_name: first_name || null,
            last_name: last_name || null,
            display_name: displayName,
            directus_id: id,
          },
        }),
        30000,
        `createUser(${email})`
      );

      if (error) {
        if (error.message.includes("already been registered")) {
          console.log(`  用户 ${email} 已注册，尝试查找映射...`);
          const { data: listData } = await withTimeout(
            supabase.auth.admin.listUsers(),
            30000,
            "listUsers"
          );
          const found = listData?.users?.find((u: { email?: string }) => u.email === email);
          if (found) {
            USER_MAPPING[id] = found.id;
            existingEmailMap.set(email, found.id);
            console.log(`  映射: ${id} → ${found.id}`);
          }
        } else {
          console.error(`  创建用户失败 ${email}: ${error.message}`);
        }
        continue;
      }

      if (data.user) {
        USER_MAPPING[id] = data.user.id;
        existingEmailMap.set(email, data.user.id);

        await supabase.from("profiles").upsert({
          id: data.user.id,
          name: displayName,
          email,
          status: status || "active",
        }, { onConflict: "id" });

        console.log(`  ✓ ${email}: ${id} → ${data.user.id}`);
      }
    } catch (err) {
      console.error(`  处理用户 ${email} 时出错:`, err);
    }
  }

  console.log(`成功映射 ${Object.keys(USER_MAPPING).length} 个用户`);
}

async function migrateClassify(pool: mysql.Pool) {
  console.log("\n=== 迁移分类 (classify) ===");
  const rows = await queryMySQL(pool, "SELECT * FROM classify");
  console.log(`找到 ${rows.length} 条记录`);

  const records = rows.map((row) => ({
    id: toInt(row.id),
    sort: toInt(row.sort),
    user_created: mapUserId(row.user_created),
    date_created: toTimestamp(row.date_created),
    user_updated: mapUserId(row.user_updated),
    date_updated: toTimestamp(row.date_updated),
    name: toNull(row.name),
  })).filter((r) => r.name !== null);

  const { error } = await supabase.from("classify").upsert(records, { onConflict: "id" });
  if (error) console.error(`迁移 classify 失败: ${error.message}`);
  else console.log(`✓ 迁移 ${records.length} 条分类`);
}

async function migrateTagColor(pool: mysql.Pool) {
  console.log("\n=== 迁移颜色标签 (tag_color) ===");
  const rows = await queryMySQL(pool, "SELECT * FROM tag_color");
  console.log(`找到 ${rows.length} 条记录`);

  const records = rows.map((row) => ({
    id: toInt(row.id),
    sort: toInt(row.sort),
    user_created: mapUserId(row.user_created),
    date_created: toTimestamp(row.date_created),
    user_updated: mapUserId(row.user_updated),
    date_updated: toTimestamp(row.date_updated),
    name: toNull(row.name),
  })).filter((r) => r.name !== null);

  const { error } = await supabase.from("tag_color").upsert(records, { onConflict: "id" });
  if (error) console.error(`迁移 tag_color 失败: ${error.message}`);
  else console.log(`✓ 迁移 ${records.length} 条颜色标签`);
}

async function migrateTagShazhi(pool: mysql.Pool) {
  console.log("\n=== 迁移纱质标签 (tag_shazhi) ===");
  const rows = await queryMySQL(pool, "SELECT * FROM tag_shazhi");
  console.log(`找到 ${rows.length} 条记录`);

  const records = rows.map((row) => ({
    id: toInt(row.id),
    sort: toInt(row.sort),
    user_created: mapUserId(row.user_created),
    date_created: toTimestamp(row.date_created),
    user_updated: mapUserId(row.user_updated),
    date_updated: toTimestamp(row.date_updated),
    name: toNull(row.name),
  })).filter((r) => r.name !== null);

  const { error } = await supabase.from("tag_shazhi").upsert(records, { onConflict: "id" });
  if (error) console.error(`迁移 tag_shazhi 失败: ${error.message}`);
  else console.log(`✓ 迁移 ${records.length} 条纱质标签`);
}

async function migrateSku(pool: mysql.Pool) {
  console.log("\n=== 迁移面料SKU (sku) ===");
  const rows = await queryMySQL(pool, "SELECT * FROM sku");
  console.log(`找到 ${rows.length} 条记录`);

  const BATCH_SIZE = 200;
  const records = rows.map((row) => ({
    id: toInt(row.id),
    sort: toInt(row.sort),
    user_created: mapUserId(row.user_created),
    date_created: toTimestamp(row.date_created),
    user_updated: mapUserId(row.user_updated),
    date_updated: toTimestamp(row.date_updated),
    code: toNull(row.code),
    name: toNull(row.name),
    cover: toNull(row.cover),
    remark: toNull(row.remark),
    archived: toBool(row.archived) ?? false,
  }));

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from("sku").upsert(batch, { onConflict: "id" });
    if (error) console.error(`迁移 sku 批次 ${i} 失败: ${error.message}`);
    else console.log(`✓ 迁移 sku ${i + batch.length}/${records.length}`);
  }
}

async function migrateSkuClassifyPrice(pool: mysql.Pool) {
  console.log("\n=== 迁移SKU分类价格 (sku_classify_price) ===");
  const rows = await queryMySQL(pool, "SELECT * FROM sku_classify_price");
  console.log(`找到 ${rows.length} 条记录`);

  const BATCH_SIZE = 500;
  const records = rows.map((row) => ({
    id: toInt(row.id),
    user_created: mapUserId(row.user_created),
    date_created: toTimestamp(row.date_created),
    user_updated: mapUserId(row.user_updated),
    date_updated: toTimestamp(row.date_updated),
    sku_id: toInt(row.sku_id),
    classify_id: toInt(row.classify_id),
    price: toInt(row.price),
  }));

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from("sku_classify_price").upsert(batch, { onConflict: "id" });
    if (error) console.error(`迁移 sku_classify_price 批次 ${i} 失败: ${error.message}`);
    else console.log(`✓ 迁移 sku_classify_price ${i + batch.length}/${records.length}`);
  }
}

async function migrateCustomer(pool: mysql.Pool) {
  console.log("\n=== 迁移客户 (customer) ===");
  const rows = await queryMySQL(pool, "SELECT * FROM customer");
  console.log(`找到 ${rows.length} 条记录`);

  const BATCH_SIZE = 200;
  const records = rows.map((row) => ({
    id: toInt(row.id),
    user_created: mapUserId(row.user_created),
    date_created: toTimestamp(row.date_created),
    user_updated: mapUserId(row.user_updated),
    date_updated: toTimestamp(row.date_updated),
    name: toNull(row.name),
    phone: toNull(row.phone),
    remark: toNull(row.remark),
    wedding_date: toDateOnly(row.weddingDate || row.wedding_date),
    address: toNull(row.address),
  }));

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from("customer").upsert(batch, { onConflict: "id" });
    if (error) console.error(`迁移 customer 批次 ${i} 失败: ${error.message}`);
    else console.log(`✓ 迁移 customer ${i + batch.length}/${records.length}`);
  }
}

async function migrateAppointment(pool: mysql.Pool) {
  console.log("\n=== 迁移预约 (appointment) ===");
  const rows = await queryMySQL(pool, "SELECT * FROM appointment");
  console.log(`找到 ${rows.length} 条记录`);

  const BATCH_SIZE = 200;
  const records = rows.map((row) => ({
    id: toInt(row.id),
    sort: toInt(row.sort),
    user_created: mapUserId(row.user_created),
    date_created: toTimestamp(row.date_created),
    user_updated: mapUserId(row.user_updated),
    date_updated: toTimestamp(row.date_updated),
    event: toNull(row.event) || "其他",
    remark: toNull(row.remark),
    counselor_id: mapUserId(row.counselorId || row.counselor_id),
    start_time: toTimestamp(row.startTime || row.start_time),
    end_time: toTimestamp(row.endTime || row.end_time),
    customer_id: toInt(row.customer || row.customer_id),
    archived: toBool(row.archived) ?? false,
  }));

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from("appointment").upsert(batch, { onConflict: "id" });
    if (error) console.error(`迁移 appointment 批次 ${i} 失败: ${error.message}`);
    else console.log(`✓ 迁移 appointment ${i + batch.length}/${records.length}`);
  }
}

async function migrateOrder(pool: mysql.Pool) {
  console.log("\n=== 迁移订单 (order) ===");
  const rows = await queryMySQL(pool, "SELECT * FROM `order`");
  console.log(`找到 ${rows.length} 条记录`);

  const BATCH_SIZE = 100;
  console.log("示例数据 (前3条):");
  rows.slice(0, 3).forEach((row, i) => {
    console.log(`  订单${i + 1}: id=${row.id}, customer=${row.customer ?? 'undefined'}, customer_id=${row.customer_id ?? 'undefined'}, customer_name=${row.customer_name ?? 'undefined'}`);
  });

  const records = rows.map((row) => ({
    id: toNull(row.id),
    user_created: mapUserId(row.user_created),
    date_created: toTimestamp(row.date_created),
    user_updated: mapUserId(row.user_updated),
    date_updated: toTimestamp(row.date_updated),
    user_id: mapUserId(row.user_id),
    pay_type: toNull(row.pay_type),
    remark: toNull(row.remark),
    real_price: toNumber(row.real_price),
    total_price: toNumber(row.total_price),
    customer_id: toInt(row.customer || row.customer_id),
    customer_name: toNull(row.customer_name),
    counselor_name: toNull(row.counselor_name),
  })).filter((r) => r.id !== null);

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from("order").upsert(batch, { onConflict: "id" });
    if (error) console.error(`迁移 order 批次 ${i} 失败: ${error.message}`);
    else console.log(`✓ 迁移 order ${i + batch.length}/${records.length}`);
  }
}

async function migrateOrderPayment(pool: mysql.Pool) {
  console.log("\n=== 迁移订单付款 (order_payment) ===");
  const rows = await queryMySQL(pool, "SELECT * FROM order_payment");
  console.log(`找到 ${rows.length} 条记录`);

  const BATCH_SIZE = 200;
  const records = rows.map((row) => ({
    id: toInt(row.id),
    user_created: mapUserId(row.user_created),
    date_created: toTimestamp(row.date_created),
    user_updated: mapUserId(row.user_updated),
    date_updated: toTimestamp(row.date_updated),
    order_id: toNull(row.order_id),
    price: toNumber(row.price),
    show_counselor_name: toNull(row.show_counselor_name),
  }));

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from("order_payment").upsert(batch, { onConflict: "id" });
    if (error) console.error(`迁移 order_payment 批次 ${i} 失败: ${error.message}`);
    else console.log(`✓ 迁移 order_payment ${i + batch.length}/${records.length}`);
  }
}

async function migrateOrderProgress(pool: mysql.Pool) {
  console.log("\n=== 迁移订单进度 (order_progress) ===");
  const rows = await queryMySQL(pool, "SELECT * FROM order_progress");
  console.log(`找到 ${rows.length} 条记录`);

  const BATCH_SIZE = 100;
  const records = rows.map((row) => ({
    id: toInt(row.id),
    user_created: mapUserId(row.user_created),
    date_created: toTimestamp(row.date_created),
    user_updated: mapUserId(row.user_updated),
    date_updated: toTimestamp(row.date_updated),
    order_id: toNull(row.order_id),
    mianliao_price: toNumber(row.mianliao_price),
    maopi_daohuo_time: toDateOnly(row.maopi_daohuo_time),
    xizhuang_xiadan_time: toDateOnly(row.xizhuang_xiadan_time),
    fanchang_time: toDateOnly(row.fanchang_time),
    chengyi_daohuo_time: toDateOnly(row.chengyi_daohuo_time),
    gongyi_price: toNumber(row.gongyi_price),
    chenshan_mianliao_xiadan_time: toDateOnly(row.chenshan_mianliao_xiadan_time),
    chenshan_mianliao_price: toNumber(row.chenshan_mianliao_price),
    chenshan_changjia: toNull(row.chenshan_changjia),
    chenshan_xiadan_time: toDateOnly(row.chenshan_xiadan_time),
    chenshan_daohuo_time: toDateOnly(row.chenshan_daohuo_time),
    chenshan_gongyi_price: toInt(row.chenshan_gongyi_price),
    peijian_xiadan_time: toDateOnly(row.peijian_xiadan_time),
    peijian_daohuo_time: toDateOnly(row.peijian_daohuo_time),
    peijian_price: toNull(row.peijian_price),
    xizhuang_mianliao: toNull(row.xizhuang_mianliao),
    xizhuang_mianliao_bianhao: toNull(row.xizhuang_mianliao_bianhao),
    mianliao_xiadan_time: toTimestamp(row.mianliao_xiadan_time),
    xizhuang_changjia: toNull(row.xizhuang_changjia),
    chenshan_mianliao_bianhao: toNull(row.chenshan_mianliao_bianhao),
    peijian_bianhao: toNull(row.peijian_bianhao),
    quyi_time: toTimestamp(row.quyi_time),
    quyi_content: toNull(row.quyi_content),
    beizhu: toNull(row.beizhu),
    maopi_daohuo_time2: toDateOnly(row.maopi_daohuo_time2),
    guke_name: toNull(row.guke_name),
  }));

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from("order_progress").upsert(batch, { onConflict: "id" });
    if (error) console.error(`迁移 order_progress 批次 ${i} 失败: ${error.message}`);
    else console.log(`✓ 迁移 order_progress ${i + batch.length}/${records.length}`);
  }
}

async function migrateOrderSkuDetail(pool: mysql.Pool) {
  console.log("\n=== 迁移订单SKU明细 (order_sku_detail) ===");
  const rows = await queryMySQL(pool, "SELECT * FROM order_sku_detail");
  console.log(`找到 ${rows.length} 条记录`);

  const BATCH_SIZE = 200;
  const records = rows.map((row) => ({
    id: toInt(row.id),
    user_created: mapUserId(row.user_created),
    date_created: toTimestamp(row.date_created),
    user_updated: mapUserId(row.user_updated),
    date_updated: toTimestamp(row.date_updated),
    classify_id: toInt(row.classify_id),
    color_id: toInt(row.color_id),
    shazhi_id: toInt(row.shazhi_id),
    order_id: toNull(row.order_id),
    sku_id: toInt(row.sku_id),
    price: toNumber(row.price),
    mianliao_bianhao: toNull(row.mianliao_bianhao),
  }));

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from("order_sku_detail").upsert(batch, { onConflict: "id" });
    if (error) console.error(`迁移 order_sku_detail 批次 ${i} 失败: ${error.message}`);
    else console.log(`✓ 迁移 order_sku_detail ${i + batch.length}/${records.length}`);
  }
}

async function resetSequences() {
  console.log("\n=== 重置序列 ===");
  console.log("以下 SQL 请在 Supabase SQL Editor 中手动执行:\n");
  const tables = ["classify", "tag_color", "tag_shazhi", "sku", "sku_classify_price", "customer", "appointment", "order_payment", "order_progress", "order_sku_detail"];
  for (const table of tables) {
    const seqName = `public.${table}_id_seq`;
    console.log(`  SELECT setval('${seqName}', (SELECT COALESCE(MAX(id), 0) + 1 FROM public.${table}));`);
  }
  console.log("\n(序列重置不影响数据迁移，仅影响后续自增ID起始值)");
}

async function clearSupabaseData() {
  console.log("\n=== 清空 Supabase 现有数据 ===");

  // keyType: "int" 表示主键是 bigint，用 neq 0 清空
  //         "uuid" 表示主键是 uuid，用 neq 全零 UUID 清空
  const tables = [
    { name: "order_sku_detail", key: "id", keyType: "int" },
    { name: "order_progress", key: "id", keyType: "int" },
    { name: "order_payment", key: "id", keyType: "int" },
    { name: "order", key: "id", keyType: "uuid" },
    { name: "appointment", key: "id", keyType: "int" },
    { name: "customer", key: "id", keyType: "int" },
    { name: "sku_classify_price", key: "id", keyType: "int" },
    { name: "sku", key: "id", keyType: "int" },
    { name: "tag_shazhi", key: "id", keyType: "int" },
    { name: "tag_color", key: "id", keyType: "int" },
    { name: "classify", key: "id", keyType: "int" },
  ];

  for (const table of tables) {
    const sentinel = table.keyType === "uuid"
      ? "00000000-0000-0000-0000-000000000000"
      : 0;
    const { error } = await supabase.from(table.name).delete()
      .neq(table.key, sentinel);
    if (error) {
      console.log(`  ⚠ ${table.name}: ${error.message}`);
    } else {
      console.log(`  ✓ ${table.name} 已清空`);
    }
  }

  console.log("\n获取现有用户列表...");
  let page = 1;
  let allUsers: { id: string }[] = [];
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page: page,
      perPage: 1000,
    });
    if (error || !data?.users?.length) break;
    allUsers.push(...data.users);
    if (data.users.length < 1000) break;
    page++;
  }

  if (allUsers.length > 0) {
    console.log(`找到 ${allUsers.length} 个用户，开始删除...`);
    for (const user of allUsers) {
      const { error } = await supabase.auth.admin.deleteUser(user.id);
      if (error) {
        console.log(`  ⚠ 删除用户 ${user.id} 失败: ${error.message}`);
      }
    }
    console.log(`✓ 用户清理完成`);
  } else {
    console.log("没有需要清理的用户");
  }
}

async function main() {
  console.log("LaFibre CRM - MySQL → Supabase 直连数据迁移");
  console.log("=".repeat(50));
  console.log(`MySQL: ${MYSQL_USER}@${MYSQL_HOST}:${MYSQL_PORT}/${MYSQL_DATABASE}`);
  console.log(`Supabase: ${SUPABASE_URL}`);

  const pool = mysql.createPool({
    host: MYSQL_HOST,
    port: MYSQL_PORT,
    user: MYSQL_USER,
    password: MYSQL_PASSWORD,
    database: MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 5,
    charset: "utf8mb4",
  });

  try {
    const conn = await pool.getConnection();
    console.log("✓ MySQL 连接成功");
    conn.release();

    await clearSupabaseData();

    const MIGRATION_ORDER = [
      { name: "users", fn: () => migrateUsers(pool) },
      { name: "classify", fn: () => migrateClassify(pool) },
      { name: "tag_color", fn: () => migrateTagColor(pool) },
      { name: "tag_shazhi", fn: () => migrateTagShazhi(pool) },
      { name: "sku", fn: () => migrateSku(pool) },
      { name: "sku_classify_price", fn: () => migrateSkuClassifyPrice(pool) },
      { name: "customer", fn: () => migrateCustomer(pool) },
      { name: "appointment", fn: () => migrateAppointment(pool) },
      { name: "order", fn: () => migrateOrder(pool) },
      { name: "order_payment", fn: () => migrateOrderPayment(pool) },
      { name: "order_progress", fn: () => migrateOrderProgress(pool) },
      { name: "order_sku_detail", fn: () => migrateOrderSkuDetail(pool) },
    ];

    for (const step of MIGRATION_ORDER) {
      try {
        await step.fn();
      } catch (err) {
        console.error(`迁移 ${step.name} 时出错:`, err);
      }
    }

    try {
      await resetSequences();
    } catch {
      console.log("序列重置跳过 (可手动在 SQL Editor 中执行)");
    }

    console.log("\n" + "=".repeat(50));
    console.log("迁移完成！");
    console.log(`用户映射表 (Directus ID → Supabase ID):`);
    for (const [oldId, newId] of Object.entries(USER_MAPPING)) {
      console.log(`  ${oldId} → ${newId}`);
    }
    console.log(`\n所有用户初始密码: ${DEFAULT_PASSWORD}`);
    console.log("请提醒用户登录后立即修改密码。");
  } finally {
    console.log("\n正在关闭 MySQL 连接池...");
    await pool.end();
    console.log("✓ MySQL 连接池已关闭");
  }
}

main().catch(console.error);
