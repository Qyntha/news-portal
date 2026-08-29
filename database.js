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
    password TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    topic TEXT DEFAULT '',
    time TEXT DEFAULT '',
    image TEXT DEFAULT '',
    source TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    articleId INTEGER NOT NULL,
    username TEXT NOT NULL,
    content TEXT NOT NULL,
    time TEXT DEFAULT '',
    FOREIGN KEY (articleId) REFERENCES articles(id) ON DELETE CASCADE
  );
`);

console.log('✅ SQLite 数据库初始化完成');
console.log(`📁 数据库位置: ${dbPath}`);

module.exports = db;