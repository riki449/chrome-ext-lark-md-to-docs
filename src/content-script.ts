// Content script: injected into Lark pages.
// Creates a sidebar (iframe loading the popup).

(() => {
  if ((window as any).__md2lark_loaded) return;
  (window as any).__md2lark_loaded = true;

  const SIDEBAR_WIDTH = 400;

  let sidebarContainer: HTMLDivElement | null = null;
  let styleEl: HTMLStyleElement | null = null;
  let isOpen = false;

  // ─── Messaging ────────────────────────────────────────────────────────

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'TOGGLE_SIDEBAR') toggleSidebar();
  });

  window.addEventListener('message', (e) => {
    if (e.data?.source !== 'md2lark') return;
    if (e.data.type === 'CLOSE_SIDEBAR') closeSidebar();
  });

  // ─── Styles ───────────────────────────────────────────────────────────

  function injectStyles() {
    if (document.getElementById('md2lark-styles')) return;
    styleEl = document.createElement('style');
    styleEl.id = 'md2lark-styles';
    styleEl.textContent = `
      body.md2lark-sidebar-open {
        margin-right: ${SIDEBAR_WIDTH}px !important;
        transition: margin-right .3s cubic-bezier(.4,0,.2,1) !important;
      }
      body { transition: margin-right .3s cubic-bezier(.4,0,.2,1) !important; }
      #md2lark-sidebar {
        position: fixed; top: 0; right: 0;
        width: ${SIDEBAR_WIDTH}px; height: 100vh;
        z-index: 2147483647;
        transform: translateX(100%);
        transition: transform .3s cubic-bezier(.4,0,.2,1);
      }
      #md2lark-sidebar.open {
        transform: translateX(0);
        box-shadow: -8px 0 30px rgba(0,0,0,.08);
      }
      #md2lark-sidebar iframe {
        width: 100%; height: 100%; border: none; background: #f5f6f8;
      }
    `;
    document.head.appendChild(styleEl);
  }

  // ─── Sidebar ──────────────────────────────────────────────────────────

  function toggleSidebar() {
    isOpen ? closeSidebar() : openSidebar();
  }

  function openSidebar() {
    injectStyles();
    if (sidebarContainer) {
      sidebarContainer.classList.add('open');
      document.body.classList.add('md2lark-sidebar-open');
      isOpen = true;
      return;
    }

    sidebarContainer = document.createElement('div');
    sidebarContainer.id = 'md2lark-sidebar';

    const iframe = document.createElement('iframe');
    iframe.src = chrome.runtime.getURL('popup/index.html');
    iframe.allow = 'clipboard-write';
    sidebarContainer.appendChild(iframe);
    document.body.appendChild(sidebarContainer);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        sidebarContainer?.classList.add('open');
        document.body.classList.add('md2lark-sidebar-open');
      });
    });
    isOpen = true;
  }

  function closeSidebar() {
    if (!sidebarContainer) return;
    sidebarContainer.classList.remove('open');
    document.body.classList.remove('md2lark-sidebar-open');
    isOpen = false;
    setTimeout(() => {
      sidebarContainer?.remove();
      sidebarContainer = null;
      styleEl?.remove();
      styleEl = null;
    }, 320);
  }
})();
