// ============================================================
// 相思门户网 · 四角色体系数据迁移脚本
// 1. users 表增加 role 字段（默认 'user'）
// 2. 用户名 'admin' 的用户设为 'superadmin'
// 3. 其他现有用户设为 'admin'
// 4. articles 表增加 author 字段（默认 ''）
// 5. 现有文章 author 设为 'admin'
// 幂等：已存在字段/已设置角色时不会重复执行
// 用法：node migrate-roles.js
// ============================================================

const db = require('./database.js');

function hasColumn(table, column) {
  const cols = db.pragma(`table_info(${table})`);
  return cols.some(c => c.name === column);
}

console.log('📦 开始角色体系迁移...');

// 1. users 表增加 role 字段
if (!hasColumn('users', 'role')) {
  db.exec("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'");
  console.log('✅ users.role 字段已添加');
} else {
  console.log('⏭️  users.role 字段已存在，跳过');
}

// 2. 将用户名 'admin' 的用户设为 'superadmin'
const adminUpdate = db.prepare("UPDATE users SET role = 'superadmin' WHERE username = 'admin'");
const adminChanges = adminUpdate.run().changes;
console.log(adminChanges > 0
  ? `✅ 已将 'admin' 设为 superadmin`
  : '⏭️  未找到 username=admin 的用户，或已是 superadmin');

// 3. 其他现有用户设为 'admin'（因为之前都是管理员）
const othersUpdate = db.prepare(
  "UPDATE users SET role = 'admin' WHERE username <> 'admin' AND role = 'user'"
);
const othersChanges = othersUpdate.run().changes;
console.log(`✅ 已将 ${othersChanges} 名现有用户设为 admin`);

// 4. articles 表增加 author 字段
if (!hasColumn('articles', 'author')) {
  db.exec("ALTER TABLE articles ADD COLUMN author TEXT DEFAULT ''");
  console.log('✅ articles.author 字段已添加');
} else {
  console.log('⏭️  articles.author 字段已存在，跳过');
}

// 5. 现有文章 author 设为 'admin'
const authorUpdate = db.prepare("UPDATE articles SET author = 'admin' WHERE author IS NULL OR author = ''");
const authorChanges = authorUpdate.run().changes;
console.log(`✅ 已为 ${authorChanges} 篇文章设置 author=admin`);

console.log('🎉 角色体系迁移完成！');
