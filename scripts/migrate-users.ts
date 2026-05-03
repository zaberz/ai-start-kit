import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || "";

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("请设置环境变量 SUPABASE_URL 和 SUPABASE_SERVICE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DIRECTUS_USERS = [
  { id: "10522f2d-e348-4578-b2e5-8f3b30f78af9", first_name: "郑栖林", last_name: "郑栖林", email: "542434347@qq.com", status: "active" },
  { id: "136bbb3f-8d42-47a8-9e76-8911270ab17f", first_name: "Admin", last_name: "User", email: "274588107@qq.com", status: "active" },
  { id: "2ee470a6-1d91-443e-a9c8-ce61a64bc662", first_name: "Fang", last_name: "Fang", email: "13275912597@qq.com", status: "active" },
  { id: "5bfdc2a3-dfe4-4105-b9d6-32d76414146b", first_name: "Lynn", last_name: "Lynn", email: "370473758@qq.com", status: "active" },
  { id: "6171332f-23c1-469f-a4c1-04493730edf9", first_name: "Micka", last_name: "Micka", email: "pengchenglu000@163.com", status: "active" },
  { id: "85eacc6c-591a-4c04-82ee-81d250f3795b", first_name: "AVA", last_name: "AVA", email: "960222521@qq.com", status: "active" },
  { id: "8d75a1a6-6ad5-4a84-8507-113774b09123", first_name: "Sven", last_name: "Sven", email: "sven@lafibre.com", status: "active" },
  { id: "f056f767-6d71-43cf-a741-103883279b20", first_name: "User", last_name: "User", email: "user@lafibre.com", status: "active" },
];

const USER_MAPPING: Record<string, string> = {};

async function migrateUsers() {
  console.log("=== 迁移 Directus 用户到 Supabase Auth ===\n");

  for (const user of DIRECTUS_USERS) {
    const displayName = [user.first_name, user.last_name].filter(Boolean).join(" ");

    console.log(`创建用户: ${user.email} (${displayName})`);

    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: "LaFibre2024!",
      email_confirm: true,
      user_metadata: {
        first_name: user.first_name,
        last_name: user.last_name,
        display_name: displayName,
        directus_id: user.id,
      },
    });

    if (error) {
      if (error.message.includes("already been registered")) {
        console.log(`  用户 ${user.email} 已存在，跳过`);
        const { data: listData } = await supabase.auth.admin.listUsers();
        const existing = listData?.users?.find((u) => u.email === user.email);
        if (existing) {
          USER_MAPPING[user.id] = existing.id;
          console.log(`  映射: ${user.id} → ${existing.id}`);
        }
        continue;
      }
      console.error(`  创建用户失败 ${user.email}: ${error.message}`);
      continue;
    }

    if (data.user) {
      USER_MAPPING[user.id] = data.user.id;

      const { error: profileError } = await supabase.from("profiles").upsert({
        id: data.user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        display_name: displayName,
        email: user.email,
        status: user.status,
      });

      if (profileError) {
        console.error(`  更新 profile 失败: ${profileError.message}`);
      } else {
        console.log(`  ✓ ${user.email}: ${user.id} → ${data.user.id}`);
      }
    }
  }

  console.log("\n=== 用户映射表 ===");
  console.log("将以下映射复制到 migrate-mysql-to-supabase.ts 中的 USER_MAPPING（如果需要手动设置）：\n");
  for (const [oldId, newId] of Object.entries(USER_MAPPING)) {
    console.log(`  "${oldId}": "${newId}",`);
  }

  console.log("\n迁移完成！所有用户初始密码为: LaFibre2024!");
  console.log("请提醒用户登录后立即修改密码。");
}

migrateUsers().catch(console.error);
