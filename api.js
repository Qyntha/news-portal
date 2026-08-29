// ============================================================
// 相思门户网 · 后端 API 封装
// 基于 fetch，所有函数均返回 Promise；
// response 非 2xx 时解析 JSON 并抛出错误信息。
// ============================================================

const API_BASE_URL = 'news-portal-production-039e.up.railway.app';

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

// 获取文章评论：GET /api/articles/:id/comments
function getComments(articleId) {
  return request(`/api/articles/${articleId}/comments`);
}

// 发表评论：POST /api/articles/:id/comments
function addComment(articleId, username, content) {
  return postJSON(`/api/articles/${articleId}/comments`, { username, content });
}

// 发布文章：POST /api/articles
function createArticle(title, content, topic, time, image, source) {
  return postJSON('/api/articles', { title, content, topic, time, image, source });
}

// 更新文章：PUT /api/articles/:id
function updateArticle(id, data) {
  return request(`/api/articles/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}

// 删除文章：DELETE /api/articles/:id
function deleteArticle(id) {
  return request(`/api/articles/${id}`, { method: 'DELETE' });
}

// 统一挂载到 window，便于页面脚本调用
if (typeof window !== 'undefined') {
  window.api = { register, login, getArticles, getArticle, getComments, addComment, createArticle, updateArticle, deleteArticle };
}
