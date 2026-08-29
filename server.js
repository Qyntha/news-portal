const express = require('express');
const cors = require('cors');
const fs = require('fs/promises');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const USERS_FILE = path.join(__dirname, 'data', 'users.json');
const ARTICLES_FILE = path.join(__dirname, 'data', 'articles.json');

// 跨域支持
app.use(cors());

// JSON 请求体解析
app.use(express.json());

// ---- 数据文件读写工具 ----
async function readJson(file) {
  try {
    const raw = await fs.readFile(file, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

async function writeJson(file, data) {
  await fs.writeFile(file, JSON.stringify(data, null, 2), 'utf8');
}

// 自增 id：取现有最大 id + 1，空列表从 1 开始
function nextId(list) {
  return list.length ? Math.max(...list.map(item => item.id)) + 1 : 1;
}

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

  const users = await readJson(USERS_FILE);
  if (users.some(u => u.username === username)) {
    return res.json({ success: false, message: '用户名已存在' });
  }

  const user = { id: nextId(users), username, password };
  users.push(user);
  await writeJson(USERS_FILE, users);

  res.json({ success: true, message: '注册成功' });
});

// ---- 用户登录 ----
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ success: false, message: '用户名和密码不能为空' });
  }

  const users = await readJson(USERS_FILE);
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) {
    return res.json({ success: false, message: '用户名或密码错误' });
  }

  res.json({ success: true, username: user.username, message: '登录成功' });
});

// ---- 文章发布 ----
app.post('/api/articles', async (req, res) => {
  const { title, content, topic, time } = req.body || {};
  if (!title || !content) {
    return res.status(400).json({ success: false, message: '标题和内容不能为空' });
  }

  const articles = await readJson(ARTICLES_FILE);
  const article = {
    id: nextId(articles),
    title,
    content,
    topic: topic || '',
    time: time || new Date().toISOString()
  };
  articles.push(article);
  await writeJson(ARTICLES_FILE, articles);

  res.json({ success: true, id: article.id, message: '发布成功' });
});

// ---- 文章列表 ----
app.get('/api/articles', async (req, res) => {
  const articles = await readJson(ARTICLES_FILE);
  res.json(articles);
});

// ---- 单篇文章 ----
app.get('/api/articles/:id', async (req, res) => {
  const articles = await readJson(ARTICLES_FILE);
  const id = Number(req.params.id);
  const article = articles.find(a => a.id === id);
  if (!article) {
    return res.status(404).json({ success: false, message: '文章不存在' });
  }
  res.json(article);
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
