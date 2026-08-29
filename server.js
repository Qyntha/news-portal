const express = require('express');
const cors = require('cors');
const db = require('./database.js');

const app = express();
const PORT = process.env.PORT || 3000;

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
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ success: false, message: '用户名和密码不能为空' });
  }
  try {
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existing) {
      return res.json({ success: false, message: '用户名已存在' });
    }
    const stmt = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)');
    const info = stmt.run(username, password);
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
    const user = db.prepare('SELECT username FROM users WHERE username = ? AND password = ?').get(username, password);
    if (!user) {
      return res.json({ success: false, message: '用户名或密码错误' });
    }
    res.json({ success: true, username: user.username, message: '登录成功' });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

// ---- 发布文章 ----
app.post('/api/articles', async (req, res) => {
  const { title, content, topic, time, image, source } = req.body || {};
  if (!title || !content) {
    return res.status(400).json({ success: false, message: '标题和内容不能为空' });
  }
  try {
    const contentStr = JSON.stringify(content);
    const stmt = db.prepare(
      'INSERT INTO articles (title, content, topic, time, image, source) VALUES (?, ?, ?, ?, ?, ?)'
    );
    const info = stmt.run(title, contentStr, topic || '', time || new Date().toISOString(), image || '', source || '');
    res.json({ success: true, id: info.lastInsertRowid, message: '发布成功' });
  } catch (error) {
    console.error('发布文章失败:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

// ---- 文章列表 ----
app.get('/api/articles', async (req, res) => {
  try {
    const articles = db.prepare('SELECT * FROM articles ORDER BY id DESC').all();
    // 将 content 从 JSON 字符串还原为数组
    const result = articles.map(a => ({
      ...a,
      content: JSON.parse(a.content)
    }));
    res.json(result);
  } catch (error) {
    console.error('获取文章列表失败:', error);
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
    article.content = JSON.parse(article.content);
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
    const { title, content, topic, time, image, source } = req.body || {};
    const existing = db.prepare('SELECT id FROM articles WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: '文章不存在' });
    }
    // 构建动态更新语句
    const updates = [];
    const values = [];
    if (title !== undefined) { updates.push('title = ?'); values.push(title); }
    if (content !== undefined) { updates.push('content = ?'); values.push(JSON.stringify(content)); }
    if (topic !== undefined) { updates.push('topic = ?'); values.push(topic); }
    if (time !== undefined) { updates.push('time = ?'); values.push(time); }
    if (image !== undefined) { updates.push('image = ?'); values.push(image); }
    if (source !== undefined) { updates.push('source = ?'); values.push(source); }
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
    const existing = db.prepare('SELECT id FROM articles WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: '文章不存在' });
    }
    // 由于外键 ON DELETE CASCADE，评论会自动删除
    db.prepare('DELETE FROM articles WHERE id = ?').run(id);
    res.json({ success: true, id, message: '删除成功' });
  } catch (error) {
    console.error('删除文章失败:', error);
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
    const comments = db.prepare('SELECT * FROM comments WHERE articleId = ? ORDER BY id DESC').all(articleId);
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
    const { username, content } = req.body || {};
    if (!username || !content || !String(content).trim()) {
      return res.status(400).json({ success: false, message: '评论内容不能为空' });
    }
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    const time = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const stmt = db.prepare('INSERT INTO comments (articleId, username, content, time) VALUES (?, ?, ?, ?)');
    const info = stmt.run(articleId, username, String(content).trim(), time);
    const newComment = db.prepare('SELECT * FROM comments WHERE id = ?').get(info.lastInsertRowid);
    res.json({ success: true, id: info.lastInsertRowid, comment: newComment, message: '评论成功' });
  } catch (error) {
    console.error('发表评论失败:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

// ---- 404 兜底 ----
app.use((req, res) => {
  res.status(404).json({ success: false, message: '接口不存在' });
});

// ---- 错误处理 ----
app.use((err, req, res, next) => {
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
