// ============================================================
// 相思门户网 · 共享登录/注册状态逻辑
// 所有页面统一接入：注入登录/注册弹窗，管理登录态与创作者平台入口。
// 依赖：api.js（window.api）、data.js（可选）
// ============================================================

(function () {
  'use strict';

  function initAuth() {

  // ---- 注入弹窗样式（各页面未统一包含 .auth-tab 样式） ----
  if (!document.getElementById('auth-style')) {
    const style = document.createElement('style');
    style.id = 'auth-style';
    style.textContent = `
      .auth-tab { color: #64748b; transition: background .2s, color .2s; }
      .auth-tab.active-tab { background: #1e3a8a; color: #fff; }
    `;
    document.head.appendChild(style);
  }

  // ---- 注入登录/注册弹窗（若页面未提供） ----
  if (!document.getElementById('auth-modal')) {
    document.body.insertAdjacentHTML('beforeend', `
      <div id="auth-modal" class="fixed inset-0 z-50 hidden items-center justify-center">
        <div class="absolute inset-0 bg-black/50" data-close-modal></div>
        <div class="relative w-full max-w-[420px] mx-4 bg-white rounded-2xl shadow-2xl p-8">
          <button id="auth-close" class="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition" aria-label="关闭">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>

          <h3 class="text-xl font-bold text-slate-800 mb-5">用户中心</h3>
          <div class="flex gap-2 p-1 bg-slate-100 rounded-full mb-6">
            <button id="tab-login" class="auth-tab active-tab flex-1 py-2 rounded-full text-sm font-semibold">登录</button>
            <button id="tab-register" class="auth-tab flex-1 py-2 rounded-full text-sm font-semibold">注册</button>
          </div>

          <form id="login-form" class="space-y-4" novalidate>
            <div>
              <label for="login-username" class="block text-sm text-slate-600 mb-1.5">用户名</label>
              <input id="login-username" type="text" autocomplete="username" placeholder="请输入用户名（不少于 3 个字符）"
                     class="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-200 transition" />
            </div>
            <div>
              <label for="login-password" class="block text-sm text-slate-600 mb-1.5">密码</label>
              <input id="login-password" type="password" autocomplete="current-password" placeholder="请输入密码（不少于 6 个字符）"
                     class="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-200 transition" />
            </div>
            <p id="login-error" class="text-xs text-red-500 min-h-[18px] leading-relaxed"></p>
            <button type="submit" class="w-full py-2.5 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition">登 录</button>
          </form>

          <form id="register-form" class="space-y-4 hidden" novalidate>
            <div>
              <label for="register-username" class="block text-sm text-slate-600 mb-1.5">用户名</label>
              <input id="register-username" type="text" autocomplete="username" placeholder="请输入用户名（不少于 3 个字符）"
                     class="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-200 transition" />
            </div>
            <div>
              <label for="register-password" class="block text-sm text-slate-600 mb-1.5">密码</label>
              <input id="register-password" type="password" autocomplete="new-password" placeholder="请输入密码（不少于 6 个字符）"
                     class="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-200 transition" />
            </div>
            <div>
              <label for="register-confirm" class="block text-sm text-slate-600 mb-1.5">确认密码</label>
              <input id="register-confirm" type="password" autocomplete="new-password" placeholder="请再次输入密码"
                     class="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-200 transition" />
            </div>
            <div>
              <label for="register-role" class="block text-sm text-slate-600 mb-1.5">注册身份</label>
              <select id="register-role"
                      class="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-200 transition bg-white">
                <option value="user">普通用户（只读）</option>
                <option value="creator">创作者（可发布文章）</option>
              </select>
            </div>
            <p id="register-error" class="text-xs text-red-500 min-h-[18px] leading-relaxed"></p>
            <button type="submit" class="w-full py-2.5 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition">注 册</button>
          </form>
        </div>
      </div>
    `);
  }

  const authModal = document.getElementById('auth-modal');
  const authArea = document.getElementById('auth-area');
  const authClose = document.getElementById('auth-close');
  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const loginErrorEl = document.getElementById('login-error');
  const registerErrorEl = document.getElementById('register-error');

  if (!authModal) return;

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function switchAuthTab(tab) {
    const isLogin = tab === 'login';
    if (tabLogin) tabLogin.classList.toggle('active-tab', isLogin);
    if (tabRegister) tabRegister.classList.toggle('active-tab', !isLogin);
    if (loginForm) loginForm.classList.toggle('hidden', !isLogin);
    if (registerForm) registerForm.classList.toggle('hidden', isLogin);
    if (loginErrorEl) loginErrorEl.textContent = '';
    if (registerErrorEl) registerErrorEl.textContent = '';
  }

  function openAuthModal(tab) {
    switchAuthTab(tab === 'register' ? 'register' : 'login');
    authModal.classList.remove('hidden');
    authModal.classList.add('flex');
    document.body.style.overflow = 'hidden';
  }

  function closeAuthModal() {
    authModal.classList.add('hidden');
    authModal.classList.remove('flex');
    document.body.style.overflow = '';
  }

  function updateAuthUI() {
    if (!authArea) return;
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const username = localStorage.getItem('username') || '';
    if (isLoggedIn) {
      const role = localStorage.getItem('role') || '';
      const creatorLink = role !== 'user'
        ? `<a href="admin.html" class="px-4 py-2 rounded-full text-sm font-semibold text-brand-600 border border-brand-600 hover:bg-brand-50 transition">创作者平台</a>`
        : '';
      authArea.innerHTML = `
        ${creatorLink}
        <span class="text-sm font-semibold text-slate-700">${escapeHtml(username)}</span>
        <button id="logout-btn" class="px-4 py-2 rounded-full text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 transition">退出</button>
      `;
      const logoutBtn = document.getElementById('logout-btn');
      if (logoutBtn) logoutBtn.addEventListener('click', logout);
    } else {
      authArea.innerHTML = `
        <button id="login-btn" data-auth="login" class="px-6 py-2 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-accent to-orange-500 hover:opacity-90 transition shadow-sm">登录</button>
      `;
    }
    document.dispatchEvent(new CustomEvent('authchange'));
  }

  function logout() {
    localStorage.removeItem('username');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('role');
    updateAuthUI();
  }

  // ---- 弹窗控制 ----
  if (authClose) authClose.addEventListener('click', closeAuthModal);
  document.querySelectorAll('[data-close-modal]').forEach(el => el.addEventListener('click', closeAuthModal));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAuthModal(); });
  if (tabLogin) tabLogin.addEventListener('click', () => switchAuthTab('login'));
  if (tabRegister) tabRegister.addEventListener('click', () => switchAuthTab('register'));

  // ---- 通用触发（事件委托：静态/动态添加的 data-auth 按钮均可打开弹窗） ----
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-auth]');
    if (!trigger) return;
    e.preventDefault();
    openAuthModal(trigger.dataset.auth === 'register' ? 'register' : 'login');
  });

  // ---- 登录提交 ----
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (loginErrorEl) loginErrorEl.textContent = '';
      const username = document.getElementById('login-username').value.trim();
      const password = document.getElementById('login-password').value;
      if (username.length < 3) { if (loginErrorEl) loginErrorEl.textContent = '用户名不少于 3 个字符'; return; }
      if (password.length < 6) { if (loginErrorEl) loginErrorEl.textContent = '密码不少于 6 个字符'; return; }
      try {
        const data = await api.login(username, password);
        if (data && data.success) {
          localStorage.setItem('username', data.username || username);
          localStorage.setItem('isLoggedIn', 'true');
          localStorage.setItem('role', data.role || 'user');
          loginForm.reset();
          updateAuthUI();
          closeAuthModal();
        } else {
          if (loginErrorEl) loginErrorEl.textContent = (data && data.message) || '登录失败，请稍后重试';
        }
      } catch (err) {
        if (loginErrorEl) loginErrorEl.textContent = err.message || '登录失败，请稍后重试';
      }
    });
  }

  // ---- 注册提交 ----
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (registerErrorEl) registerErrorEl.textContent = '';
      const username = document.getElementById('register-username').value.trim();
      const password = document.getElementById('register-password').value;
      const confirmPassword = document.getElementById('register-confirm').value;
      const roleEl = document.getElementById('register-role');
      const role = roleEl ? roleEl.value : 'user';
      if (username.length < 3) { if (registerErrorEl) registerErrorEl.textContent = '用户名不少于 3 个字符'; return; }
      if (password.length < 6) { if (registerErrorEl) registerErrorEl.textContent = '密码不少于 6 个字符'; return; }
      if (password !== confirmPassword) { if (registerErrorEl) registerErrorEl.textContent = '两次输入的密码不一致'; return; }
      try {
        const data = await api.register(username, password, role);
        if (data && data.success) {
          // 注册成功后自动登录
          const loginData = await api.login(username, password);
          if (loginData && loginData.success) {
            localStorage.setItem('username', loginData.username || username);
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('role', loginData.role || 'user');
            registerForm.reset();
            updateAuthUI();
            closeAuthModal();
          } else {
            switchAuthTab('login');
            const loginUser = document.getElementById('login-username');
            if (loginUser) loginUser.value = username;
            if (loginErrorEl) loginErrorEl.textContent = (loginData && loginData.message) || '注册成功，请手动登录';
          }
        } else {
          if (registerErrorEl) registerErrorEl.textContent = (data && data.message) || '注册失败，请稍后重试';
        }
      } catch (err) {
        if (registerErrorEl) registerErrorEl.textContent = err.message || '注册失败，请稍后重试';
      }
    });
  }

  // ---- 页面加载时恢复登录状态 ----
  updateAuthUI();
  } // end initAuth

  // 等 DOM 就绪后再执行（auth.js 可能位于 <head> 中）
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuth);
  } else {
    initAuth();
  }
})();
