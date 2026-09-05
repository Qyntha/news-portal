const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// 确保 data 目录存在
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 数据库文件路径
const dbPath = path.join(dataDir, 'newsportal.db');
const db = new Database(dbPath);

// 启用外键约束（保证数据一致性）
db.pragma('foreign_keys = ON');

// 创建表结构
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user'
  );

  CREATE TABLE IF NOT EXISTS articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    topic TEXT DEFAULT '',
    time TEXT DEFAULT '',
    image TEXT DEFAULT '',
    source TEXT DEFAULT '',
    author TEXT DEFAULT '',
    is_carousel INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    articleId INTEGER NOT NULL,
    username TEXT NOT NULL,
    content TEXT NOT NULL,
    time TEXT DEFAULT '',
    parent_id INTEGER DEFAULT NULL,
    reply_to_username TEXT DEFAULT '',
    is_deleted INTEGER DEFAULT 0,
    deleted_at TEXT DEFAULT '',
    FOREIGN KEY (articleId) REFERENCES articles(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    updated_at TEXT DEFAULT ''
  );
`);

// ---- 兼容旧数据库：为已有表补充缺失的列（一次性迁移） ----
let addedRoleColumn = false;
let addedAuthorColumn = false;
function ensureColumn(table, column, definition) {
  const columns = db.pragma(`table_info(${table})`);
  if (!columns.some(c => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    console.log(`✅ 已为 ${table} 表补充 ${column} 字段`);
    if (table === 'users' && column === 'role') addedRoleColumn = true;
    if (table === 'articles' && column === 'author') addedAuthorColumn = true;
    return true;
  }
  return false;
}
ensureColumn('users', 'role', "TEXT DEFAULT 'user'");
ensureColumn('articles', 'author', "TEXT DEFAULT ''");
ensureColumn('articles', 'is_carousel', 'INTEGER DEFAULT 0');
ensureColumn('comments', 'parent_id', 'INTEGER DEFAULT NULL');
ensureColumn('comments', 'reply_to_username', "TEXT DEFAULT ''");
ensureColumn('comments', 'is_deleted', 'INTEGER DEFAULT 0');
ensureColumn('comments', 'deleted_at', "TEXT DEFAULT ''");
const createdAdded = ensureColumn('users', 'created_at', "TEXT DEFAULT ''");

// 旧库刚补 role 列：此前所有注册用户均可发布，统一恢复为管理员身份（仅迁移时执行一次）
if (addedRoleColumn) {
  const promoted = db.prepare("UPDATE users SET role = 'admin' WHERE username <> 'admin' AND role = 'user'").run();
  console.log(`✅ 已为 ${promoted.changes} 名老用户设置管理员身份`);
}

// 旧库刚补 author 列：老文章作者统一设为 admin（仅迁移时执行一次）
if (addedAuthorColumn) {
  const authorFixed = db.prepare("UPDATE articles SET author = 'admin' WHERE author IS NULL OR author = ''").run();
  console.log(`✅ 已为 ${authorFixed.changes} 篇老文章设置作者 admin`);
}

// ---- 示例「关于我们」文章（无该专题文章时插入，供频道精选展示） ----
const aboutCount = db.prepare("SELECT COUNT(*) AS n FROM articles WHERE topic = '关于我们'").get().n;
if (aboutCount === 0) {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  const ts = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const sample = JSON.stringify([
    '相思门户网是一个轻量级新闻资讯平台，聚合本地视野与全球资讯。',
    '我们坚持真实、及时、贴近生活的报道理念，欢迎每一位创作者与读者的参与。'
  ]);
  db.prepare("INSERT INTO articles (title, content, topic, time, image, source, author, is_carousel) VALUES ('关于我们', ?, '关于我们', ?, '', '相思门户网', 'admin', 0)")
    .run(sample, ts);
  console.log('✅ 已插入示例「关于我们」文章');
}

// ---- 旧版 content（JSON 数组字符串）→ HTML 段落 迁移 ----
const contentRows = db.prepare('SELECT id, content FROM articles').all();
let migratedContent = 0;
const contentUpdate = db.prepare('UPDATE articles SET content = ? WHERE id = ?');
for (const row of contentRows) {
  const raw = String(row.content || '').trim();
  if (raw.startsWith('[')) {
    try {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        const html = arr.map(p => `<p>${String(p)}</p>`).join('');
        contentUpdate.run(html, row.id);
        migratedContent++;
      }
    } catch (e) {
      // 非 JSON 内容保持不变
    }
  }
}
if (migratedContent > 0) {
  console.log(`✅ 已将 ${migratedContent} 篇文章的 content 由 JSON 数组转为 HTML`);
}

// 旧库刚补 created_at 列：为老用户补上注册时间（以当前时间近似）
if (createdAdded) {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  const ts = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const updated = db.prepare("UPDATE users SET created_at = ? WHERE created_at IS NULL OR created_at = ''").run(ts);
  console.log(`✅ 已为 ${updated.changes} 名老用户补充注册时间`);
}

// ---- 初始化默认公告 ----
const announcementCount = db.prepare('SELECT COUNT(*) AS n FROM announcements').get().n;
if (announcementCount === 0) {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  const ts = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  db.prepare("INSERT INTO announcements (content, is_active, updated_at) VALUES (?, 1, ?)")
    .run('📢 欢迎访问相思门户网，本地视野，全球资讯。', ts);
  console.log('✅ 已插入默认公告');
}

// ---- 初始化最高管理员 ----
// 规则：只有用户名为 admin 的才是最高管理员（superadmin）。
// 用户表为空（全新数据库）时自动创建 admin，保证上线后始终有超级管理员；
// 若 admin 已存在但角色不是 superadmin，则自动恢复。
const adminUser = db.prepare("SELECT id, role FROM users WHERE username = 'admin'").get();
if (!adminUser) {
  const initialPassword = process.env.ADMIN_PASSWORD || 'admin123456';
  db.prepare("INSERT INTO users (username, password, role) VALUES ('admin', ?, 'superadmin')")
    .run(initialPassword);
  console.warn('⚠️  未检测到最高管理员，已自动创建默认账号 admin');
  console.warn('⚠️  请务必通过环境变量 ADMIN_PASSWORD 设置初始密码，或登录后尽快修改密码！');
} else if (adminUser.role !== 'superadmin') {
  db.prepare("UPDATE users SET role = 'superadmin' WHERE username = 'admin'").run();
  console.log('✅ 已将 admin 的角色恢复为 superadmin');
}

console.log('✅ SQLite 数据库初始化完成');
console.log(`📁 数据库位置: ${dbPath}`);

module.exports = db;
