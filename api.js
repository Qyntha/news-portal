// ============================================================
// 相思门户网 · 后端 API 封装
// 基于 fetch，所有函数均返回 Promise；
// response 非 2xx 时解析 JSON 并抛出错误信息。
// ============================================================

const API_BASE_URL = 'http://localhost:3000';

// 统一请求处理：ok 时返回解析后的 data，失败时抛错
async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(API_BASE_URL + path, options);
  } catch (err) {
    throw new Error('无法连接服务器，请确认后端服务已启动');
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message = (data && data.message) || `请求失败（HTTP ${res.status}）`;
    throw new Error(message);
  }
  return data;
}

// POST JSON 请求体
function postJSON(path, body) {
  return request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

// 用户注册：POST /api/register
function register(username, password) {
  return postJSON('/api/register', { username, password });
}

// 用户登录：POST /api/login
function login(username, password) {
  return postJSON('/api/login', { username, password });
}

// 获取全部文章：GET /api/articles
function getArticles() {
  return request('/api/articles');
}

// 获取单篇文章：GET /api/articles/:id
function getArticle(id) {
  return request(`/api/articles/${id}`);
}

// 发布文章：POST /api/articles
function createArticle(title, content, topic, time) {
  return postJSON('/api/articles', { title, content, topic, time });
}

// 统一挂载到 window，便于页面脚本调用
if (typeof window !== 'undefined') {
  window.api = { register, login, getArticles, getArticle, createArticle };
}
