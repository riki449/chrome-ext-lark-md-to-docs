// Background service worker.
// Toggles the content-script sidebar when the extension icon is clicked.

const LARK_DOMAIN = /larksuite\.com|feishu\.cn|lark\.suite\.com/;
const LARK_DOC_PATH = /\/(docx|wiki|docs)\//;

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;

  const url = tab.url || '';
  if (!LARK_DOMAIN.test(url) || !LARK_DOC_PATH.test(url)) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          // Remove existing toast
          document.getElementById('md2lark-toast')?.remove();
          const toast = document.createElement('div');
          toast.id = 'md2lark-toast';
          toast.innerHTML = `
            <style>
              #md2lark-toast{position:fixed;top:20px;right:20px;z-index:2147483647;background:linear-gradient(135deg,#6c5ce7 0%,#4facfe 100%);color:#fff;padding:16px 20px;border-radius:12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',sans-serif;font-size:14px;line-height:1.5;box-shadow:0 8px 32px rgba(108,92,231,.35);display:flex;align-items:center;gap:12px;animation:md2lark-slide .3s ease;max-width:380px}
              @keyframes md2lark-slide{from{opacity:0;transform:translateY(-12px)}to{opacity:1;transform:translateY(0)}}
              #md2lark-toast .t-icon{width:36px;height:36px;background:rgba(255,255,255,.2);border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
              #md2lark-toast .t-icon svg{width:18px;height:18px}
              #md2lark-toast .t-text{flex:1}
              #md2lark-toast .t-title{font-weight:700;font-size:14px;margin-bottom:3px}
              #md2lark-toast .t-sub{font-size:12px;opacity:.85}
              #md2lark-toast .t-close{background:rgba(255,255,255,.15);border:none;color:#fff;cursor:pointer;font-size:14px;padding:0;width:24px;height:24px;border-radius:6px;display:flex;align-items:center;justify-content:center;transition:background .2s;flex-shrink:0}
              #md2lark-toast .t-close:hover{background:rgba(255,255,255,.3)}
            </style>
            <div class="t-icon"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></div>
            <div class="t-text">
              <div class="t-title">Open a Lark document first</div>
              <div class="t-sub">Go to larksuite.com and open a doc, then click the extension again.</div>
            </div>
            <button class="t-close" onclick="this.closest('#md2lark-toast').remove()">✕</button>
          `;
          document.body.appendChild(toast);
          setTimeout(() => toast.remove(), 5000);
        },
      });
    } catch {
      // Can't inject on restricted pages (chrome://, etc.)
    }
    return;
  }

  try {
    await chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_SIDEBAR' });
  } catch {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content-script.js'],
      });
      setTimeout(() => {
        chrome.tabs.sendMessage(tab.id!, { type: 'TOGGLE_SIDEBAR' });
      }, 100);
    } catch (err) {
      console.error('MD2Lark:: Failed to inject content script:', err);
    }
  }
});
