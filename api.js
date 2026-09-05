// ============================================================
// 相思门户网 · 后端 API 封装
// 基于 fetch，所有函数均返回 Promise；
// response 非 2xx 时解析 JSON 并抛出错误信息。
// ============================================================

const API_BASE_URL = 'https://news-portal-production-039e.up.railway.app';

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
function register(username, password, captchaId, captchaText) {
  return postJSON('/api/register', { username, password, captchaId, captchaText });
}

// 获取注册验证码：GET /api/captcha
function getCaptcha() {
  return request('/api/captcha');
}

// 用户登录：POST /api/login
function login(username, password) {
  return postJSON('/api/login', { username, password });
}

// 获取全部文章：GET /api/articles
function getArticles() {
  return request('/api/articles');
}

// 获取轮播文章：GET /api/carousel
function getCarousel() {
  return request('/api/carousel');
}

// 获取单篇文章：GET /api/articles/:id
function getArticle(id) {
  return request(`/api/articles/${id}`);
}

// 获取文章评论：GET /api/articles/:id/comments
function getComments(articleId, username) {
  const q = username ? `?username=${encodeURIComponent(username)}` : '';
  return request(`/api/articles/${articleId}/comments${q}`);
}

// 发表评论/回复：POST /api/articles/:id/comments
function addComment(articleId, username, content, parentId, replyToUsername) {
  const body = { username, content };
  if (parentId !== undefined && parentId !== null) body.parent_id = parentId;
  if (replyToUsername) body.reply_to_username = replyToUsername;
  return postJSON(`/api/articles/${articleId}/comments`, body);
}

// 软删除评论：DELETE /api/comments/:id?username=xxx
function deleteComment(id, username) {
  return request(`/api/comments/${id}?username=${encodeURIComponent(username || '')}`, { method: 'DELETE' });
}

// 管理员评论列表：GET /api/admin/comments?username=xxx
function getAdminComments(username) {
  return request(`/api/admin/comments?username=${encodeURIComponent(username || '')}`);
}

// 恢复评论：PUT /api/admin/comments/:id/restore
function restoreComment(id, username) {
  return request(`/api/admin/comments/${id}/restore`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username })
  });
}

// 永久删除评论：DELETE /api/admin/comments/:id/permanent?username=xxx
function permanentDeleteComment(id, username) {
  return request(`/api/admin/comments/${id}/permanent?username=${encodeURIComponent(username || '')}`, { method: 'DELETE' });
}

// 发布文章：POST /api/articles
function createArticle(title, content, topic, time, image, source, username, is_carousel) {
  const body = { title, content, topic, time, image, source, username };
  if (is_carousel !== undefined) body.is_carousel = is_carousel ? 1 : 0;
  return postJSON('/api/articles', body);
}

// 更新文章：PUT /api/articles/:id
function updateArticle(id, data) {
  return request(`/api/articles/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}

// 删除文章：DELETE /api/articles/:id?username=xxx
function deleteArticle(id, username) {
  return request(`/api/articles/${id}?username=${encodeURIComponent(username || '')}`, { method: 'DELETE' });
}

// 获取用户列表：GET /api/admin/users?username=xxx
function getUsers(username) {
  return request(`/api/admin/users?username=${encodeURIComponent(username || '')}`);
}

// 设置用户角色：POST /api/admin/set-role
function setRole(username, target, role) {
  return postJSON('/api/admin/set-role', { username, target, role });
}

// 获取公告：GET /api/announcements
function getAnnouncements() {
  return request('/api/announcements');
}

// 新增公告：POST /api/admin/announcements
function createAnnouncement(content, username) {
  return postJSON('/api/admin/announcements', { content, username });
}

// 更新公告：PUT /api/admin/announcements/:id
function updateAnnouncement(id, content, username) {
  return request(`/api/admin/announcements/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, username })
  });
}

// 删除公告：DELETE /api/admin/announcements/:id?username=xxx
function deleteAnnouncement(id, username) {
  return request(`/api/admin/announcements/${id}?username=${encodeURIComponent(username || '')}`, { method: 'DELETE' });
}

// 上传图片：POST /api/upload-image（FormData，multipart）
function uploadImage(file, username) {
  const form = new FormData();
  form.append('image', file);
  return request('/api/upload-image', {
    method: 'POST',
    headers: { 'x-username': username || '' },
    body: form
  });
}

// 统一挂载到 window，便于页面脚本调用
if (typeof window !== 'undefined') {
  window.api = { register, getCaptcha, login, getArticles, getCarousel, getArticle, getComments, addComment, deleteComment, getAdminComments, restoreComment, permanentDeleteComment, createArticle, updateArticle, deleteArticle, getUsers, setRole, getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement, uploadImage };
}
