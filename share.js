// ============================================================
// 相思门户网 · 微信分享弹窗（共享脚本）
// 任意带 data-share 属性的元素点击后弹出分享弹窗。
// ============================================================

(function () {
  'use strict';

  function initShare() {
    if (document.getElementById('share-modal')) return;

    document.body.insertAdjacentHTML('beforeend', `
      <div id="share-modal" class="fixed inset-0 z-50 hidden items-center justify-center">
        <div class="absolute inset-0 bg-black/50" data-share-close></div>
        <div class="relative w-[360px] max-w-[90vw] mx-4 bg-white rounded-2xl shadow-2xl p-5">
          <button id="share-close" class="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition" aria-label="关闭">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
          <h3 class="text-lg font-bold text-slate-800 mb-2">分享到微信</h3>
          <p class="text-xs text-slate-500 mb-4">请使用微信扫描下方二维码，或复制链接分享给好友。</p>
          <div class="flex justify-center mb-4">
            <img id="share-qr" src="" alt="微信分享二维码" class="w-[150px] h-[150px] rounded-lg" />
          </div>
          <div id="share-link" class="bg-slate-50 rounded-lg px-3 py-2 text-xs text-slate-500 break-all mb-3"></div>
          <button id="share-copy" class="w-full py-2.5 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition">复制链接</button>
          <p id="share-copied" class="hidden mt-2 text-center text-xs text-green-600">已复制！</p>
        </div>
      </div>
    `);

    function openShare() {
      const modal = document.getElementById('share-modal');
      if (!modal) return;
      const url = window.location.href;
      const qr = document.getElementById('share-qr');
      const link = document.getElementById('share-link');
      const copied = document.getElementById('share-copied');
      if (qr) qr.src = 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=' + encodeURIComponent(url);
      if (link) link.textContent = url;
      if (copied) copied.classList.add('hidden');
      modal.classList.remove('hidden');
      modal.classList.add('flex');
      document.body.style.overflow = 'hidden';
    }

    function closeShare() {
      const modal = document.getElementById('share-modal');
      if (!modal) return;
      modal.classList.add('hidden');
      modal.classList.remove('flex');
      document.body.style.overflow = '';
    }

    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-share]')) {
        e.preventDefault();
        openShare();
        return;
      }
      if (e.target.closest('#share-close') || e.target.closest('[data-share-close]')) {
        closeShare();
      }
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeShare(); });

    document.getElementById('share-copy').addEventListener('click', async () => {
      const link = document.getElementById('share-link');
      const url = link ? link.textContent : window.location.href;
      try {
        await navigator.clipboard.writeText(url);
      } catch (err) {
        const ta = document.createElement('textarea');
        ta.value = url;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      const copied = document.getElementById('share-copied');
      if (copied) copied.classList.remove('hidden');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initShare);
  } else {
    initShare();
  }
})();
