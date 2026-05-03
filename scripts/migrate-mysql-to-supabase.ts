import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || "";
const MYSQL_DUMP_PATH = process.env.MYSQL_DUMP_PATH || path.join(__dirname, "../ficus_2026-05-02_01-34-16_mysql_data.sql");

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("请设置环境变量 SUPABASE_URL 和 SUPABASE_SERVICE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

interface DirectusUser {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  status: string;
}

const USER_MAPPING: Record<string, string> = {};
const loadedUsers: DirectusUser[] = [];

function parseInsertStatements(sql: string, tableName: string): string[][] {
  const results: string[][] = [];
  const pattern = new RegExp(
    `INSERT INTO \`${tableName}\` VALUES\\s*(.+?);`,
    "gs"
  );
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(sql)) !== null) {
    const valuesStr = match[1];
    const rows = parseValues(valuesStr);
    results.push(...rows);
  }

  return results;
}

function parseValues(valuesStr: string): string[][] {
  const rows: string[][] = [];
  let depth = 0;
  let current = "";
  let inString = false;
  let stringChar = "";

  for (let i = 0; i < valuesStr.length; i++) {
    const ch = valuesStr[i];

    if (inString) {
      if (ch === "\\") {
        current += ch + (valuesStr[i + 1] || "");
        i++;
        continue;
      }
      if (ch === stringChar) {
        inString = false;
        current += ch;
        continue;
      }
      current += ch;
      continue;
    }

    if (ch === "'" || ch === '"') {
      inString = true;
      stringChar = ch;
      current += ch;
      continue;
    }

    if (ch === "(") {
      if (depth === 0) {
        current = "";
      } else {
        current += ch;
      }
      depth++;
      continue;
    }

    if (ch === ")") {
      depth--;
      if (depth === 0) {
        rows.push(parseRow(current));
        current = "";
      } else {
        current += ch;
      }
      continue;
    }

    current += ch;
  }

  return rows;
}

function parseRow(rowStr: string): string[] {
  const values: string[] = [];
  let current = "";
  let inString = false;
  let stringChar = "";

  for (let i = 0; i < rowStr.length; i++) {
    const ch = rowStr[i];

    if (inString) {
      if (ch === "\\") {
        const next = rowStr[i + 1] || "";
        if (next === "'" || next === '"' || next === "\\") {
          current += next;
          i++;
          continue;
        }
        if (next === "n") {
          current += "\n";
          i++;
          continue;
        }
        if (next === "r") {
          current += "\r";
          i++;
          continue;
        }
        if (next === "t") {
          current += "\t";
          i++;
          continue;
        }
        current += ch;
        continue;
      }
      if (ch === stringChar) {
        inString = false;
        continue;
      }
      current += ch;
      continue;
    }

    if (ch === "'" || ch === '"') {
      inString = true;
      stringChar = ch;
      continue;
    }

    if (ch === ",") {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += ch;
  }

  values.push(current.trim());
  return values;
}

function toNull(val: string | null | undefined): string | null {
  if (val === null || val === undefined || val === "NULL" || val === "") return null;
  return val;
}

function toBool(val: string | null | undefined): boolean | null {
  if (val === null || val === undefined || val === "NULL") return null;
  return val === "1";
}

function toNumber(val: string | null | undefined): number | null {
  if (val === null || val === undefined || val === "NULL" || val === "") return null;
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

function toInt(val: string | null | undefined): number | null {
  if (val === null || val === undefined || val === "NULL" || val === "") return null;
  const n = parseInt(val, 10);
  return isNaN(n) ? null : n;
}

async function migrateUsers(sql: string) {
  console.log("\n=== 迁移用户 (Directus Users → Supabase Auth) ===");

  const rows = parseInsertStatements(sql, "directus_users");
  console.log(`找到 ${rows.length} 个用户`);

  for (const row of rows) {
    const [id, first_name, last_name, email, _password, _location, _title, _description, _tags, _avatar, _language, _tfa_secret, status, _role, _token, _last_access, _last_page, _provider, _external_identifier, _auth_data, _email_notifications, _appearance, _theme_dark, _theme_light, _theme_light_overrides, _theme_dark_overrides] = row;

    if (!email || email === "NULL") {
      console.log(`跳过无邮箱用户: ${id}`);
      continue;
    }

    const displayName = [first_name, last_name].filter(Boolean).join(" ") || null;

    console.log(`创建用户: ${email} (${displayName})`);

    const { data, error } = await supabase.auth.admin.createUser({
      email: email,
      password: "TempPass123!",
      email_confirm: true,
      user_metadata: {
        first_name: toNull(first_name),
        last_name: toNull(last_name),
        display_name: displayName,
        directus_id: id,
      },
    });

    if (error) {
      console.error(`  创建用户失败 ${email}: ${error.message}`);
      continue;
    }

    if (data.user) {
      USER_MAPPING[id] = data.user.id;
      loadedUsers.push({
        id: data.user.id,
        first_name: toNull(first_name),
        last_name: toNull(last_name),
        email: email,
        status: toNull(status) || "active",
      });

      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: data.user.id,
          first_name: toNull(first_name),
          last_name: toNull(last_name),
          display_name: displayName,
          email: email,
          status: toNull(status) || "active",
        });

      if (profileError) {
        console.error(`  更新 profile 失败 ${email}: ${profileError.message}`);
      } else {
        console.log(`  ✓ 用户 ${email} 创建成功 (原ID: ${id} → 新ID: ${data.user.id})`);
      }
    }
  }

  console.log(`成功迁移 ${Object.keys(USER_MAPPING).length} 个用户`);
}

function mapUserId(directusId: string | null | undefined): string | null {
  if (!directusId || directusId === "NULL") return null;
  return USER_MAPPING[directusId] || null;
}

async function migrateClassify(sql: string) {
  console.log("\n=== 迁移分类 (classify) ===");
  const rows = parseInsertStatements(sql, "classify");
  console.log(`找到 ${rows.length} 条记录`);

  const records = rows.map((row) => ({
    id: toInt(row[0]),
    sort: toInt(row[1]),
    user_created: mapUserId(row[2]),
    date_created: toNull(row[3]),
    user_updated: mapUserId(row[4]),
    date_updated: toNull(row[5]),
    name: toNull(row[6]),
  })).filter((r) => r.name !== null);

  const { error } = await supabase.from("classify").upsert(records, { onConflict: "id" });
  if (error) console.error(`迁移 classify 失败: ${error.message}`);
  else console.log(`✓ 迁移 ${records.length} 条分类`);
}

async function migrateTagColor(sql: string) {
  console.log("\n=== 迁移颜色标签 (tag_color) ===");
  const rows = parseInsertStatements(sql, "tag_color");
  console.log(`找到 ${rows.length} 条记录`);

  const records = rows.map((row) => ({
    id: toInt(row[0]),
    sort: toInt(row[1]),
    user_created: mapUserId(row[2]),
    date_created: toNull(row[3]),
    user_updated: mapUserId(row[4]),
    date_updated: toNull(row[5]),
    name: toNull(row[6]),
  })).filter((r) => r.name !== null);

  const { error } = await supabase.from("tag_color").upsert(records, { onConflict: "id" });
  if (error) console.error(`迁移 tag_color 失败: ${error.message}`);
  else console.log(`✓ 迁移 ${records.length} 条颜色标签`);
}

async function migrateTagShazhi(sql: string) {
  console.log("\n=== 迁移纱质标签 (tag_shazhi) ===");
  const rows = parseInsertStatements(sql, "tag_shazhi");
  console.log(`找到 ${rows.length} 条记录`);

  const records = rows.map((row) => ({
    id: toInt(row[0]),
    sort: toInt(row[1]),
    user_created: mapUserId(row[2]),
    date_created: toNull(row[3]),
    user_updated: mapUserId(row[4]),
    date_updated: toNull(row[5]),
    name: toNull(row[6]),
  })).filter((r) => r.name !== null);

  const { error } = await supabase.from("tag_shazhi").upsert(records, { onConflict: "id" });
  if (error) console.error(`迁移 tag_shazhi 失败: ${error.message}`);
  else console.log(`✓ 迁移 ${records.length} 条纱质标签`);
}

async function migrateSku(sql: string) {
  console.log("\n=== 迁移面料SKU (sku) ===");
  const rows = parseInsertStatements(sql, "sku");
  console.log(`找到 ${rows.length} 条记录`);

  const records = rows.map((row) => ({
    id: toInt(row[0]),
    sort: toInt(row[1]),
    user_created: mapUserId(row[2]),
    date_created: toNull(row[3]),
    user_updated: mapUserId(row[4]),
    date_updated: toNull(row[5]),
    code: toNull(row[6]),
    name: toNull(row[7]),
    cover: toNull(row[8]),
  }));

  const { error } = await supabase.from("sku").upsert(records, { onConflict: "id" });
  if (error) console.error(`迁移 sku 失败: ${error.message}`);
  else console.log(`✓ 迁移 ${records.length} 条SKU`);
}

async function migrateSkuClassifyPrice(sql: string) {
  console.log("\n=== 迁移SKU分类价格 (sku_classify_price) ===");
  const rows = parseInsertStatements(sql, "sku_classify_price");
  console.log(`找到 ${rows.length} 条记录`);

  const BATCH_SIZE = 500;
  const records = rows.map((row) => ({
    id: toInt(row[0]),
    user_created: mapUserId(row[1]),
    date_created: toNull(row[2]),
    user_updated: mapUserId(row[3]),
    date_updated: toNull(row[4]),
    sku_id: toInt(row[5]),
    classify_id: toInt(row[6]),
    price: toInt(row[7]),
  }));

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from("sku_classify_price").upsert(batch, { onConflict: "id" });
    if (error) {
      console.error(`迁移 sku_classify_price 批次 ${i} 失败: ${error.message}`);
    } else {
      console.log(`✓ 迁移 sku_classify_price ${i + batch.length}/${records.length}`);
    }
  }
}

async function migrateCustomer(sql: string) {
  console.log("\n=== 迁移客户 (customer) ===");
  const rows = parseInsertStatements(sql, "customer");
  console.log(`找到 ${rows.length} 条记录`);

  const BATCH_SIZE = 200;
  const records = rows.map((row) => ({
    id: toInt(row[0]),
    user_created: mapUserId(row[1]),
    date_created: toNull(row[2]),
    user_updated: mapUserId(row[3]),
    date_updated: toNull(row[4]),
    name: toNull(row[5]),
    phone: toNull(row[6]),
    remark: toNull(row[7]),
    wedding_date: toNull(row[8]),
    address: toNull(row[9]),
  }));

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from("customer").upsert(batch, { onConflict: "id" });
    if (error) {
      console.error(`迁移 customer 批次 ${i} 失败: ${error.message}`);
    } else {
      console.log(`✓ 迁移 customer ${i + batch.length}/${records.length}`);
    }
  }
}

async function migrateAppointment(sql: string) {
  console.log("\n=== 迁移预约 (appointment) ===");
  const rows = parseInsertStatements(sql, "appointment");
  console.log(`找到 ${rows.length} 条记录`);

  const BATCH_SIZE = 200;
  const records = rows.map((row) => ({
    id: toInt(row[0]),
    sort: toInt(row[1]),
    user_created: mapUserId(row[2]),
    date_created: toNull(row[3]),
    user_updated: mapUserId(row[4]),
    date_updated: toNull(row[5]),
    event: toNull(row[6]) || "其他",
    remark: toNull(row[7]),
    counselor_id: mapUserId(row[8]),
    start_time: toNull(row[9]),
    end_time: toNull(row[10]),
    customer_id: toInt(row[11]),
    archived: toBool(row[12]) ?? false,
  }));

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from("appointment").upsert(batch, { onConflict: "id" });
    if (error) {
      console.error(`迁移 appointment 批次 ${i} 失败: ${error.message}`);
    } else {
      console.log(`✓ 迁移 appointment ${i + batch.length}/${records.length}`);
    }
  }
}

async function migrateOrder(sql: string) {
  console.log("\n=== 迁移订单 (order) ===");
  const rows = parseInsertStatements(sql, "order");
  console.log(`找到 ${rows.length} 条记录`);

  const BATCH_SIZE = 100;
  const records = rows.map((row) => ({
    id: toNull(row[0]),
    user_created: mapUserId(row[1]),
    date_created: toNull(row[2]),
    user_updated: mapUserId(row[3]),
    date_updated: toNull(row[4]),
    user_id: mapUserId(row[5]),
    pay_type: toNull(row[6]),
    remark: toNull(row[7]),
    real_price: toNumber(row[8]),
    total_price: toNumber(row[9]),
    customer_id: toInt(row[10]),
    customer_name: toNull(row[11]),
    counselor_name: toNull(row[12]),
  })).filter((r) => r.id !== null);

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from("order").upsert(batch, { onConflict: "id" });
    if (error) {
      console.error(`迁移 order 批次 ${i} 失败: ${error.message}`);
    } else {
      console.log(`✓ 迁移 order ${i + batch.length}/${records.length}`);
    }
  }
}

async function migrateOrderPayment(sql: string) {
  console.log("\n=== 迁移订单付款 (order_payment) ===");
  const rows = parseInsertStatements(sql, "order_payment");
  console.log(`找到 ${rows.length} 条记录`);

  const BATCH_SIZE = 200;
  const records = rows.map((row) => ({
    id: toInt(row[0]),
    user_created: mapUserId(row[1]),
    date_created: toNull(row[2]),
    user_updated: mapUserId(row[3]),
    date_updated: toNull(row[4]),
    order_id: toNull(row[5]),
    price: toNumber(row[6]),
    show_counselor_name: toNull(row[7]),
  }));

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from("order_payment").upsert(batch, { onConflict: "id" });
    if (error) {
      console.error(`迁移 order_payment 批次 ${i} 失败: ${error.message}`);
    } else {
      console.log(`✓ 迁移 order_payment ${i + batch.length}/${records.length}`);
    }
  }
}

async function migrateOrderProgress(sql: string) {
  console.log("\n=== 迁移订单进度 (order_progress) ===");
  const rows = parseInsertStatements(sql, "order_progress");
  console.log(`找到 ${rows.length} 条记录`);

  const BATCH_SIZE = 100;
  const records = rows.map((row) => ({
    id: toInt(row[0]),
    user_created: mapUserId(row[1]),
    date_created: toNull(row[2]),
    user_updated: mapUserId(row[3]),
    date_updated: toNull(row[4]),
    order_id: toNull(row[5]),
    mianliao_price: toNumber(row[6]),
    maopi_daohuo_time: toNull(row[7]),
    xizhuang_xiadan_time: toNull(row[8]),
    fanchang_time: toNull(row[9]),
    chengyi_daohuo_time: toNull(row[10]),
    gongyi_price: toNumber(row[11]),
    chenshan_mianliao_xiadan_time: toNull(row[12]),
    chenshan_mianliao_price: toNumber(row[13]),
    chenshan_changjia: toNull(row[14]),
    chenshan_xiadan_time: toNull(row[15]),
    chenshan_daohuo_time: toNull(row[16]),
    chenshan_gongyi_price: toInt(row[17]),
    peijian_xiadan_time: toNull(row[18]),
    peijian_daohuo_time: toNull(row[19]),
    peijian_price: toNull(row[20]),
    xizhuang_mianliao: toNull(row[21]),
    xizhuang_mianliao_bianhao: toNull(row[22]),
    mianliao_xiadan_time: toNull(row[23]),
    xizhuang_changjia: toNull(row[24]),
    chenshan_mianliao_bianhao: toNull(row[25]),
    peijian_bianhao: toNull(row[26]),
    quyi_time: toNull(row[27]),
    quyi_content: toNull(row[28]),
    beizhu: toNull(row[29]),
    maopi_daohuo_time2: toNull(row[30]),
    guke_name: toNull(row[31]),
  }));

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from("order_progress").upsert(batch, { onConflict: "id" });
    if (error) {
      console.error(`迁移 order_progress 批次 ${i} 失败: ${error.message}`);
    } else {
      console.log(`✓ 迁移 order_progress ${i + batch.length}/${records.length}`);
    }
  }
}

async function migrateOrderSkuDetail(sql: string) {
  console.log("\n=== 迁移订单SKU明细 (order_sku_detail) ===");
  const rows = parseInsertStatements(sql, "order_sku_detail");
  console.log(`找到 ${rows.length} 条记录`);

  const BATCH_SIZE = 200;
  const records = rows.map((row) => ({
    id: toInt(row[0]),
    user_created: mapUserId(row[1]),
    date_created: toNull(row[2]),
    user_updated: mapUserId(row[3]),
    date_updated: toNull(row[4]),
    classify_id: toInt(row[5]),
    color_id: toInt(row[6]),
    shazhi_id: toInt(row[7]),
    order_id: toNull(row[8]),
    sku_id: toInt(row[9]),
    price: toNumber(row[10]),
    mianliao_bianhao: toNull(row[11]),
  }));

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from("order_sku_detail").upsert(batch, { onConflict: "id" });
    if (error) {
      console.error(`迁移 order_sku_detail 批次 ${i} 失败: ${error.message}`);
    } else {
      console.log(`✓ 迁移 order_sku_detail ${i + batch.length}/${records.length}`);
    }
  }
}

async function main() {
  console.log("LaFibre CRM - MySQL → Supabase 数据迁移");
  console.log("=".repeat(50));

  if (!fs.existsSync(MYSQL_DUMP_PATH)) {
    console.error(`MySQL dump 文件不存在: ${MYSQL_DUMP_PATH}`);
    process.exit(1);
  }

  console.log(`读取 MySQL dump: ${MYSQL_DUMP_PATH}`);
  const sql = fs.readFileSync(MYSQL_DUMP_PATH, "utf-8");
  console.log(`文件大小: ${(sql.length / 1024 / 1024).toFixed(2)} MB`);

  const MIGRATION_ORDER = [
    { name: "users", fn: () => migrateUsers(sql) },
    { name: "classify", fn: () => migrateClassify(sql) },
    { name: "tag_color", fn: () => migrateTagColor(sql) },
    { name: "tag_shazhi", fn: () => migrateTagShazhi(sql) },
    { name: "sku", fn: () => migrateSku(sql) },
    { name: "sku_classify_price", fn: () => migrateSkuClassifyPrice(sql) },
    { name: "customer", fn: () => migrateCustomer(sql) },
    { name: "appointment", fn: () => migrateAppointment(sql) },
    { name: "order", fn: () => migrateOrder(sql) },
    { name: "order_payment", fn: () => migrateOrderPayment(sql) },
    { name: "order_progress", fn: () => migrateOrderProgress(sql) },
    { name: "order_sku_detail", fn: () => migrateOrderSkuDetail(sql) },
  ];

  for (const step of MIGRATION_ORDER) {
    try {
      await step.fn();
    } catch (err) {
      console.error(`迁移 ${step.name} 时出错:`, err);
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log("迁移完成！");
  console.log(`用户映射表 (Directus ID → Supabase ID):`);
  for (const [oldId, newId] of Object.entries(USER_MAPPING)) {
    const user = loadedUsers.find((u) => u.id === newId);
    console.log(`  ${oldId} → ${newId} (${user?.email || "unknown"})`);
  }
}

main().catch(console.error);
