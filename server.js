const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const db = require('./database.js');

const app = express();
const PORT = process.env.PORT || 3000;

// Supabase 客户端（凭据来自 .env，生产环境配置在 Railway 环境变量中）
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || 'news-images';
const supabase = SUPABASE_URL && SUPABASE_ANON_KEY ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

// multer：内存存储，便于后续转传 Supabase
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

// 根据用户名查询用户（含角色）
function getUserByUsername(username) {
  const user = db.prepare('SELECT id, username, role FROM users WHERE username = ?').get(username);
  // 规则：只有用户名为 admin 的才是最高管理员，登录/操作时自动恢复其 superadmin 身份
  if (user && user.username === 'admin' && user.role !== 'superadmin') {
    db.prepare("UPDATE users SET role = 'superadmin' WHERE username = 'admin'").run();
    user.role = 'superadmin';
  }
  return user;
}

function formatNow() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// 跨域支持
app.use(cors());

// JSON 请求体解析
app.use(express.json());

// 根路由（健康检查）
app.get('/', (req, res) => {
  res.json({
    name: '相思门户网 API',
    status: 'running',
    port: PORT,
    time: new Date().toISOString()
  });
});

// ---- 用户注册 ----
app.post('/api/register', async (req, res) => {
  // 注册可自选身份：普通用户（user，默认）或创作者（creator）；管理员身份只能由管理员授予
  const { username, password, role } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ success: false, message: '用户名和密码不能为空' });
  }
  try {
    // 保留用户名 admin：只有它才是最高管理员，不允许通过注册冒领
    if (username === 'admin') {
      return res.status(400).json({ success: false, message: '该用户名已被保留，无法注册' });
    }
    const requestedRole = role || 'user';
    if (requestedRole !== 'user' && requestedRole !== 'creator') {
      return res.status(400).json({ success: false, message: '注册身份无效' });
    }
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existing) {
      return res.json({ success: false, message: '用户名已存在' });
    }
    const d = new Date();
    const pad = n => String(n).padStart(2, '0');
    const created_at = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    const stmt = db.prepare('INSERT INTO users (username, password, role, created_at) VALUES (?, ?, ?, ?)');
    const info = stmt.run(username, password, requestedRole, created_at);
    res.json({ success: true, message: '注册成功', id: info.lastInsertRowid });
  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

// ---- 用户登录 ----
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ success: false, message: '用户名和密码不能为空' });
  }
  try {
    const user = db.prepare('SELECT username, role, created_at FROM users WHERE username = ? AND password = ?').get(username, password);
    if (!user) {
      return res.json({ success: false, message: '用户名或密码错误' });
    }
    // 保证 username=admin 始终以 superadmin 身份登录
    if (user.username === 'admin' && user.role !== 'superadmin') {
      db.prepare("UPDATE users SET role = 'superadmin' WHERE username = 'admin'").run();
      user.role = 'superadmin';
    }
    res.json({ success: true, username: user.username, role: user.role, created_at: user.created_at || '', message: '登录成功' });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

// ---- 发布文章 ----
app.post('/api/articles', async (req, res) => {
  const { title, content, topic, time, image, source, username, is_carousel } = req.body || {};
  if (!title || !content) {
    return res.status(400).json({ success: false, message: '标题和内容不能为空' });
  }
  try {
    if (!username) {
      return res.status(401).json({ success: false, message: '请先登录' });
    }
    const user = getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ success: false, message: '用户不存在，请重新登录' });
    }
    if (user.role === 'user') {
      return res.status(403).json({ success: false, message: '普通用户无权发布文章' });
    }
    if (is_carousel !== undefined && user.role !== 'superadmin' && user.role !== 'admin') {
      return res.status(403).json({ success: false, message: '无权设置轮播' });
    }
    const stmt = db.prepare(
      'INSERT INTO articles (title, content, topic, time, image, source, author, is_carousel) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    const info = stmt.run(title, content, topic || '', time || new Date().toISOString(), image || '', source || '', username, is_carousel ? 1 : 0);
    res.json({ success: true, id: info.lastInsertRowid, message: '发布成功' });
  } catch (error) {
    console.error('发布文章失败:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

// ---- 轮播文章：GET /api/carousel ----
app.get('/api/carousel', async (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM articles WHERE is_carousel = 1 ORDER BY id DESC LIMIT 5').all();
    res.json(rows);
  } catch (error) {
    console.error('获取轮播文章失败:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

// ---- 文章列表 ----
app.get('/api/articles', async (req, res) => {
  try {
    const articles = db.prepare('SELECT * FROM articles ORDER BY id DESC').all();
    res.json(articles);
  } catch (error) {
    console.error('获取文章列表失败:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

// ---- 批量设置轮播：POST /api/admin/carousel ----
app.post('/api/admin/carousel', async (req, res) => {
  try {
    const { articleIds, username } = req.body || {};
    if (!username) {
      return res.status(401).json({ success: false, message: '请先登录' });
    }
    const user = getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ success: false, message: '用户不存在，请重新登录' });
    }
    if (user.role !== 'superadmin' && user.role !== 'admin') {
      return res.status(403).json({ success: false, message: '无权设置轮播' });
    }
    if (!Array.isArray(articleIds)) {
      return res.status(400).json({ success: false, message: '参数不完整' });
    }
    // 先全部取消，再设置指定文章
    db.prepare('UPDATE articles SET is_carousel = 0').run();
    const stmt = db.prepare('UPDATE articles SET is_carousel = 1 WHERE id = ?');
    const tx = db.transaction(ids => {
      for (const id of ids) stmt.run(Number(id));
    });
    tx(articleIds.filter(id => Number.isFinite(Number(id))));
    res.json({ success: true, message: '轮播设置已更新' });
  } catch (error) {
    console.error('设置轮播失败:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

// ---- 单篇文章 ----
app.get('/api/articles/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const article = db.prepare('SELECT * FROM articles WHERE id = ?').get(id);
    if (!article) {
      return res.status(404).json({ success: false, message: '文章不存在' });
    }
    res.json(article);
  } catch (error) {
    console.error('获取文章失败:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

// ---- 更新文章 ----
app.put('/api/articles/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { title, content, topic, time, image, source, username, is_carousel } = req.body || {};
    if (!username) {
      return res.status(401).json({ success: false, message: '请先登录' });
    }
    const user = getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ success: false, message: '用户不存在，请重新登录' });
    }
    if (user.role === 'user') {
      return res.status(403).json({ success: false, message: '普通用户无权编辑文章' });
    }
    if (is_carousel !== undefined && user.role !== 'superadmin' && user.role !== 'admin') {
      return res.status(403).json({ success: false, message: '无权设置轮播' });
    }
    const existing = db.prepare('SELECT id, author FROM articles WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: '文章不存在' });
    }
    // 创作者只能编辑自己的文章
    if (user.role === 'creator' && existing.author !== username) {
      return res.status(403).json({ success: false, message: '无权编辑他人的文章' });
    }
    // 构建动态更新语句
    const updates = [];
    const values = [];
    if (title !== undefined) { updates.push('title = ?'); values.push(title); }
    if (content !== undefined) { updates.push('content = ?'); values.push(content); }
    if (topic !== undefined) { updates.push('topic = ?'); values.push(topic); }
    if (time !== undefined) { updates.push('time = ?'); values.push(time); }
    if (image !== undefined) { updates.push('image = ?'); values.push(image); }
    if (source !== undefined) { updates.push('source = ?'); values.push(source); }
    if (is_carousel !== undefined) { updates.push('is_carousel = ?'); values.push(is_carousel ? 1 : 0); }
    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: '没有提供任何更新字段' });
    }
    values.push(id);
    const stmt = db.prepare(`UPDATE articles SET ${updates.join(', ')} WHERE id = ?`);
    stmt.run(...values);
    res.json({ success: true, id, message: '更新成功' });
  } catch (error) {
    console.error('更新文章失败:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

// ---- 删除文章 ----
app.delete('/api/articles/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const username = req.query.username || (req.body && req.body.username) || '';
    if (!username) {
      return res.status(401).json({ success: false, message: '请先登录' });
    }
    const user = getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ success: false, message: '用户不存在，请重新登录' });
    }
    if (user.role === 'user') {
      return res.status(403).json({ success: false, message: '普通用户无权删除文章' });
    }
    const existing = db.prepare('SELECT id, author FROM articles WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: '文章不存在' });
    }
    // 创作者只能删除自己的文章
    if (user.role === 'creator' && existing.author !== username) {
      return res.status(403).json({ success: false, message: '无权删除他人的文章' });
    }
    // 由于外键 ON DELETE CASCADE，评论会自动删除
    db.prepare('DELETE FROM articles WHERE id = ?').run(id);
    res.json({ success: true, id, message: '删除成功' });
  } catch (error) {
    console.error('删除文章失败:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

// ---- 获取用户列表：GET /api/admin/users?username=xxx ----
app.get('/api/admin/users', async (req, res) => {
  try {
    const username = (req.query.username || '').trim();
    if (!username) {
      return res.status(401).json({ success: false, message: '请先登录' });
    }
    const user = getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ success: false, message: '用户不存在，请重新登录' });
    }
    if (user.role !== 'superadmin' && user.role !== 'admin') {
      return res.status(403).json({ success: false, message: '无权查看用户列表' });
    }
    const users = db.prepare('SELECT id, username, role FROM users ORDER BY id').all();
    res.json(users);
  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

// ---- 设置用户角色：POST /api/admin/set-role ----
app.post('/api/admin/set-role', async (req, res) => {
  try {
    const { username, target, role } = req.body || {};
    if (!username || !target || !role) {
      return res.status(400).json({ success: false, message: '参数不完整' });
    }
    const operator = getUserByUsername(username);
    if (!operator) {
      return res.status(401).json({ success: false, message: '用户不存在，请重新登录' });
    }
    if (operator.role !== 'superadmin' && operator.role !== 'admin') {
      return res.status(403).json({ success: false, message: '无权设置用户角色' });
    }
    // 不能修改自己的角色
    if (operator.username === target) {
      return res.status(400).json({ success: false, message: '不能修改自己的角色' });
    }
    const targetUser = getUserByUsername(target);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: '目标用户不存在' });
    }
    // 任何人都不能修改 superadmin
    if (targetUser.role === 'superadmin') {
      return res.status(403).json({ success: false, message: '不能修改最高管理员的角色' });
    }
    // 用户名为 admin 的账号受保护，等同于最高管理员
    if (targetUser.username === 'admin') {
      return res.status(403).json({ success: false, message: '不能修改最高管理员的角色' });
    }
    // superadmin 可设置 admin/creator/user；普通管理员只能设置 creator/user
    if (operator.role === 'superadmin') {
      if (!['admin', 'creator', 'user'].includes(role)) {
        return res.status(400).json({ success: false, message: '无效的角色' });
      }
    } else {
      if (!['creator', 'user'].includes(role)) {
        return res.status(403).json({ success: false, message: '普通管理员不能设置管理员角色' });
      }
    }
    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, targetUser.id);
    res.json({ success: true, message: '角色更新成功' });
  } catch (error) {
    console.error('设置角色失败:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

// ---- 获取文章评论 ----
app.get('/api/articles/:id/comments', async (req, res) => {
  try {
    const articleId = Number(req.params.id);
    const existing = db.prepare('SELECT id FROM articles WHERE id = ?').get(articleId);
    if (!existing) {
      return res.status(404).json({ success: false, message: '文章不存在' });
    }
    const comments = db.prepare('SELECT * FROM comments WHERE articleId = ? ORDER BY id ASC').all(articleId);
    res.json(comments);
  } catch (error) {
    console.error('获取评论失败:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

// ---- 发表评论 ----
app.post('/api/articles/:id/comments', async (req, res) => {
  try {
    const articleId = Number(req.params.id);
    const existing = db.prepare('SELECT id FROM articles WHERE id = ?').get(articleId);
    if (!existing) {
      return res.status(404).json({ success: false, message: '文章不存在' });
    }
    const { username, content, parent_id, reply_to_username } = req.body || {};
    if (!username || !content || !String(content).trim()) {
      return res.status(400).json({ success: false, message: '评论内容不能为空' });
    }
    // 若为回复，校验被回复评论属于同一篇文章
    let parentId = null;
    if (parent_id !== undefined && parent_id !== null && parent_id !== '') {
      parentId = Number(parent_id);
      if (!Number.isInteger(parentId)) {
        return res.status(400).json({ success: false, message: '回复目标无效' });
      }
      const parent = db.prepare('SELECT id, articleId FROM comments WHERE id = ?').get(parentId);
      if (!parent || parent.articleId !== articleId) {
        return res.status(400).json({ success: false, message: '回复目标不存在或不属于该文章' });
      }
    }
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    const time = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const stmt = db.prepare('INSERT INTO comments (articleId, username, content, time, parent_id, reply_to_username) VALUES (?, ?, ?, ?, ?, ?)');
    const info = stmt.run(articleId, username, String(content).trim(), time, parentId, reply_to_username || '');
    const newComment = db.prepare('SELECT * FROM comments WHERE id = ?').get(info.lastInsertRowid);
    res.json({ success: true, id: info.lastInsertRowid, comment: newComment, message: '评论成功' });
  } catch (error) {
    console.error('发表评论失败:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

// ---- 获取公告：GET /api/announcements ----
app.get('/api/announcements', async (req, res) => {
  try {
    const rows = db.prepare('SELECT id, content, updated_at FROM announcements WHERE is_active = 1 ORDER BY id ASC').all();
    res.json(rows);
  } catch (error) {
    console.error('获取公告失败:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

// ---- 新增公告：POST /api/admin/announcements ----
app.post('/api/admin/announcements', async (req, res) => {
  try {
    const { content, username } = req.body || {};
    if (!username) {
      return res.status(401).json({ success: false, message: '请先登录' });
    }
    const user = getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ success: false, message: '用户不存在，请重新登录' });
    }
    if (user.role !== 'superadmin' && user.role !== 'admin') {
      return res.status(403).json({ success: false, message: '无权管理公告' });
    }
    if (!content || !String(content).trim()) {
      return res.status(400).json({ success: false, message: '公告内容不能为空' });
    }
    const now = formatNow();
    const info = db.prepare('INSERT INTO announcements (content, is_active, updated_at) VALUES (?, 1, ?)').run(String(content).trim(), now);
    res.json({ success: true, id: info.lastInsertRowid, message: '公告已添加' });
  } catch (error) {
    console.error('新增公告失败:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

// ---- 更新公告（兼容旧版前端）：PUT /api/admin/announcements ----
// 旧版只支持单条公告，更新第一条激活公告；无公告时自动创建。
app.put('/api/admin/announcements', async (req, res) => {
  try {
    const { content, username } = req.body || {};
    if (!username) {
      return res.status(401).json({ success: false, message: '请先登录' });
    }
    const user = getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ success: false, message: '用户不存在，请重新登录' });
    }
    if (user.role !== 'superadmin' && user.role !== 'admin') {
      return res.status(403).json({ success: false, message: '无权管理公告' });
    }
    if (!content || !String(content).trim()) {
      return res.status(400).json({ success: false, message: '公告内容不能为空' });
    }
    const row = db.prepare('SELECT id FROM announcements WHERE is_active = 1 ORDER BY id ASC LIMIT 1').get();
    const now = formatNow();
    if (row) {
      db.prepare('UPDATE announcements SET content = ?, updated_at = ? WHERE id = ?').run(String(content).trim(), now, row.id);
    } else {
      db.prepare('INSERT INTO announcements (content, is_active, updated_at) VALUES (?, 1, ?)').run(String(content).trim(), now);
    }
    res.json({ success: true, message: '公告已更新' });
  } catch (error) {
    console.error('更新公告失败:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

// ---- 更新公告：PUT /api/admin/announcements/:id ----
app.put('/api/admin/announcements/:id', async (req, res) => {
  try {
    const { content, username } = req.body || {};
    if (!username) {
      return res.status(401).json({ success: false, message: '请先登录' });
    }
    const user = getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ success: false, message: '用户不存在，请重新登录' });
    }
    if (user.role !== 'superadmin' && user.role !== 'admin') {
      return res.status(403).json({ success: false, message: '无权管理公告' });
    }
    if (!content || !String(content).trim()) {
      return res.status(400).json({ success: false, message: '公告内容不能为空' });
    }
    const id = Number(req.params.id);
    const row = db.prepare('SELECT id FROM announcements WHERE id = ?').get(id);
    if (!row) {
      return res.status(404).json({ success: false, message: '公告不存在' });
    }
    db.prepare('UPDATE announcements SET content = ?, updated_at = ? WHERE id = ?').run(String(content).trim(), formatNow(), id);
    res.json({ success: true, id, message: '公告已更新' });
  } catch (error) {
    console.error('更新公告失败:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

// ---- 删除公告：DELETE /api/admin/announcements/:id ----
app.delete('/api/admin/announcements/:id', async (req, res) => {
  try {
    const username = req.query.username || (req.body && req.body.username) || '';
    if (!username) {
      return res.status(401).json({ success: false, message: '请先登录' });
    }
    const user = getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ success: false, message: '用户不存在，请重新登录' });
    }
    if (user.role !== 'superadmin' && user.role !== 'admin') {
      return res.status(403).json({ success: false, message: '无权管理公告' });
    }
    const id = Number(req.params.id);
    const row = db.prepare('SELECT id FROM announcements WHERE id = ?').get(id);
    if (!row) {
      return res.status(404).json({ success: false, message: '公告不存在' });
    }
    db.prepare('DELETE FROM announcements WHERE id = ?').run(id);
    res.json({ success: true, id, message: '公告已删除' });
  } catch (error) {
    console.error('删除公告失败:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

// ---- 图片上传：POST /api/upload-image ----
const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml'];
const EXT_MAP = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/gif': '.gif', 'image/webp': '.webp', 'image/svg+xml': '.svg' };

app.post('/api/upload-image', upload.single('image'), async (req, res) => {
  try {
    // 登录校验：请求头 x-username 携带用户名
    const username = (req.headers['x-username'] || '').trim();
    if (!username) {
      return res.status(401).json({ success: false, message: '请先登录' });
    }
    const user = getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ success: false, message: '用户不存在，请重新登录' });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: '未接收到图片文件' });
    }
    // 文件类型校验（后端二次保障）
    if (!ALLOWED_IMAGE_TYPES.includes(req.file.mimetype)) {
      return res.status(400).json({ success: false, message: '不支持的图片格式，请上传 PNG, JPEG, GIF, WEBP 或 SVG 格式的图片。' });
    }
    // 文件大小校验（后端二次保障）
    if (req.file.size > 5 * 1024 * 1024) {
      return res.status(400).json({ success: false, message: '图片大小不能超过 5MB。' });
    }
    if (!supabase) {
      return res.status(500).json({ success: false, message: '服务器未配置 Supabase，请联系管理员' });
    }
    // 唯一文件名：时间戳_随机数.扩展名
    const ext = EXT_MAP[req.file.mimetype] || '.img';
    const fileName = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}${ext}`;
    const filePath = `uploads/${fileName}`;

    const { error } = await supabase.storage.from(SUPABASE_BUCKET).upload(filePath, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: false
    });
    if (error) {
      console.error('Supabase 上传失败:', error);
      return res.status(500).json({ success: false, message: '图片上传失败：' + (error.message || '未知错误') });
    }
    const publicUrl = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(filePath).data.publicUrl;
    res.json({ success: true, url: publicUrl, message: '上传成功' });
  } catch (error) {
    console.error('上传图片失败:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

// ---- 404 兜底 ----
app.use((req, res) => {
  res.status(404).json({ success: false, message: '接口不存在' });
});

// ---- 错误处理 ----
app.use((err, req, res, next) => {
  // multer 文件大小限制
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: '图片大小不能超过 5MB。' });
    }
    return res.status(400).json({ success: false, message: '文件上传失败：' + err.message });
  }
  const status = err.status || err.statusCode || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({
    success: false,
    message: status === 400 ? '请求格式错误' : '服务器内部错误'
  });
});

app.listen(PORT, () => {
  console.log(`相思门户网后端服务已启动：http://localhost:${PORT}`);
});
