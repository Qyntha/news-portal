const db = require('./database.js');
const fs = require('fs');
const path = require('path');

// 备份文件目录（请将你从 Railway 下载的 JSON 文件放在这里）
const backupDir = path.join(__dirname, 'backup');

function readBackupFile(filename) {
  const filePath = path.join(backupDir, filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  备份文件不存在: ${filePath}`);
    return [];
  }
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

console.log('📦 开始数据迁移...');

// 1. 迁移用户
const users = readBackupFile('users.json');
const insertUser = db.prepare('INSERT OR IGNORE INTO users (id, username, password) VALUES (?, ?, ?)');
const userInsert = db.transaction((users) => {
  for (const u of users) {
    insertUser.run(u.id, u.username, u.password);
  }
});
userInsert(users);
console.log(`✅ 用户迁移完成: ${users.length} 条`);

// 2. 迁移文章
const articles = readBackupFile('articles.json');
const insertArticle = db.prepare(`
  INSERT OR IGNORE INTO articles (id, title, content, topic, time, image, source)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);
const articleInsert = db.transaction((articles) => {
  for (const a of articles) {
    // content 是数组，需要转为 JSON 字符串存储
    const contentStr = JSON.stringify(a.content);
    insertArticle.run(a.id, a.title, contentStr, a.topic || '', a.time || '', a.image || '', a.source || '');
  }
});
articleInsert(articles);
console.log(`✅ 文章迁移完成: ${articles.length} 条`);

// 3. 迁移评论
const comments = readBackupFile('comments.json');
const insertComment = db.prepare(`
  INSERT OR IGNORE INTO comments (id, articleId, username, content, time)
  VALUES (?, ?, ?, ?, ?)
`);
const commentInsert = db.transaction((comments) => {
  for (const c of comments) {
    insertComment.run(c.id, c.articleId, c.username, c.content, c.time || '');
  }
});
commentInsert(comments);
console.log(`✅ 评论迁移完成: ${comments.length} 条`);

console.log('🎉 数据迁移全部完成！');