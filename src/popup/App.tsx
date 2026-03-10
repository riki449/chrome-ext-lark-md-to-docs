import { useEffect, useRef, useState } from 'react';
import { AboutPanel } from './components/AboutPanel';
import { DropZone } from './components/DropZone';
import { Header } from './components/Header';
import { PasteZone } from './components/PasteZone';
import { StatusView } from './components/StatusView';
import { useConverter } from './hooks/useConverter';
import { useTheme } from './hooks/useTheme';
import { useI18n } from './i18n';
import './index.css';

export default function App() {
  const { theme, setTheme } = useTheme();
  const { t } = useI18n();
  const [useFirstLineTitle, setUseFirstLineTitle] = useState(() =>
    localStorage.getItem('md2lark_first_line_title') !== 'false',
  );
  const pasteRef = useRef<HTMLTextAreaElement>(null);
  const [showAbout, setShowAbout] = useState(false);
  const {
    status, fileName, htmlPreview, error, progress, insertMethod, mdContent,
    isDragging, mode, fileRef, stats, diagramMode, previewHtmlRef,
    setIsDragging, setMode, setDiagramMode,
    handleFile, handlePaste, convert, reset, /* exportToMd, */
  } = useConverter();

  // Sync mdContent into paste textarea (e.g. after file upload)
  useEffect(() => {
    if (pasteRef.current) pasteRef.current.value = mdContent;
  }, [mdContent]);

  const handleFirstLineTitleChange = (v: boolean) => {
    setUseFirstLineTitle(v);
    localStorage.setItem('md2lark_first_line_title', String(v));
  };

  const extractTitle = (): string | undefined => {
    if (!useFirstLineTitle || !mdContent) return undefined;
    const match = mdContent.match(/^#\s+(.+)/m);
    return match?.[1]?.trim();
  };

  /** Auto-load paste content if in paste mode and not yet loaded */
  const ensureLoaded = (): boolean => {
    if (status === 'ready') return true;
    if (mode === 'paste') {
      const text = pasteRef.current?.value;
      if (text?.trim()) {
        handlePaste(text, t('paste.fileName'));
        return true;
      }
    }
    return false;
  };

  const handlePreview = async () => {
    if (!ensureLoaded()) return;
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      world: 'MAIN',
      func: showPreviewOverlay,
      args: [previewHtmlRef.current, fileName, `${stats.lines}L · ${stats.words}W`, theme],
    });
  };

  const handleConvert = () => {
    if (!ensureLoaded()) return;
    convert(extractTitle());
  };



  const isReady = status === 'ready';
  const showMain = status === 'idle' || isReady;

  return (
    <div className="app">
      <Header
        theme={theme} onThemeChange={setTheme}
        diagramMode={diagramMode}
        onDiagramModeChange={setDiagramMode}
        useFirstLineTitle={useFirstLineTitle}
        onUseFirstLineTitleChange={handleFirstLineTitleChange}
        onShowAbout={() => setShowAbout(true)}
      />

      {showMain && (
        <>
          <div className={`mode-toggle ${mode === 'paste' ? 'paste-active' : ''}`}>
            <button className={`mode-btn ${mode === 'file' ? 'active' : ''}`} onClick={() => setMode('file')}>
              <i className="fa-solid fa-upload" /> {t('mode.upload')}
            </button>
            <button className={`mode-btn ${mode === 'paste' ? 'active' : ''}`} onClick={() => setMode('paste')}>
              <i className="fa-regular fa-clipboard" /> {t('mode.paste')}
            </button>
          </div>

          <div className="mode-panels">
            <div className={`mode-panel ${mode === 'file' ? 'panel-active' : 'panel-hidden'}`}>
              <DropZone
                isDragging={isDragging}
                fileRef={fileRef}
                onDragStateChange={setIsDragging}
                onFile={handleFile}
              />
            </div>
            <div className={`mode-panel ${mode === 'paste' ? 'panel-active' : 'panel-hidden'}`}>
              <PasteZone textRef={pasteRef} onContent={(text) => handlePaste(text, t('paste.fileName'))} />
            </div>
          </div>

          <div className={`ready-info ${isReady ? 'ready-info-active' : 'ready-info-ghost'}`}>
            <i className={`fa-regular ${isReady ? 'fa-circle-check' : 'fa-file'} ready-check`} />
            <span className="ready-name" title={isReady ? fileName : ''}>{isReady ? fileName : t('ready.ghost')}</span>
            {isReady && (
              <div className="ready-actions">
                <button className="ready-action-btn ready-preview" onClick={handlePreview} title={t('btn.preview')}>
                  <i className="fa-solid fa-eye" />
                </button>
                <button className="ready-action-btn ready-trash" onClick={reset} title={t('btn.clear')}>
                  <i className="fa-regular fa-trash-can" />
                </button>
              </div>
            )}
          </div>

          <div className="action-bar">
            <button className="btn btn-p action-btn" onClick={handleConvert}>
              <i className="fa-solid fa-paper-plane" /> {t('btn.convert')}
            </button>
            {/* <button className="btn btn-outline action-btn" onClick={exportToMd}>
              <i className="fa-solid fa-download" /> {t('btn.export')}
            </button> */}
          </div>
        </>
      )}

      {(status === 'loading' || status === 'converting' || status === 'success' || status === 'error') && (
        <StatusView
          status={status}
          fileName={fileName}
          error={error}
          progress={progress}
          insertMethod={insertMethod}
          onReset={reset}
        />
      )}

      <AboutPanel open={showAbout} onToggle={setShowAbout} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Injected into the active tab to show a full-screen preview overlay
// ---------------------------------------------------------------------------
function showPreviewOverlay(html: string, name: string, statsText: string, themeMode: string) {
  // Remove existing overlay if any
  document.getElementById('md2lark-preview-overlay')?.remove();

  // Resolve actual theme: if 'system', detect from OS preference
  let resolvedTheme = themeMode;
  if (resolvedTheme === 'system') {
    resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  const isDark = resolvedTheme === 'dark';

  const overlay = document.createElement('div');
  overlay.id = 'md2lark-preview-overlay';
  if (isDark) overlay.setAttribute('data-theme', 'dark');
  overlay.innerHTML = `
    <style>
      #md2lark-preview-overlay{--pv-bg:#fff;--pv-bg2:#fafbfc;--pv-bg3:#f5f6f8;--pv-border:#e2e4ea;--pv-t1:#1e2330;--pv-t2:#5c6270;--pv-t3:#8e95a3;--pv-accent:#6c5ce7;--pv-accent-light:rgba(108,92,231,.07);--pv-input:#eef0f4;--pv-err:#e74c3c;position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.6);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',sans-serif;animation:md2lark-fadeIn .25s ease}
      #md2lark-preview-overlay[data-theme="dark"]{--pv-bg:#1c1d27;--pv-bg2:#22232f;--pv-bg3:#272836;--pv-border:#2c2d3a;--pv-t1:#e8eaf0;--pv-t2:#9ca3b0;--pv-t3:#636b7a;--pv-accent:#a29bfe;--pv-accent-light:rgba(162,155,254,.08);--pv-input:#1a1b25;--pv-err:#ff7675}
      @keyframes md2lark-fadeIn{from{opacity:0}to{opacity:1}}
      #md2lark-preview-modal{width:90vw;height:90vh;max-width:1100px;background:var(--pv-bg);border-radius:16px;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 25px 60px rgba(0,0,0,.3)}
      #md2lark-preview-modal .pv-header{display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-bottom:1px solid var(--pv-border);background:var(--pv-bg2);flex-shrink:0}
      #md2lark-preview-modal .pv-info{display:flex;align-items:center;gap:10px;min-width:0;flex:1}
      #md2lark-preview-modal .pv-icon{font-size:16px;color:var(--pv-accent)}
      #md2lark-preview-modal .pv-name{font-size:15px;font-weight:700;color:var(--pv-t1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      #md2lark-preview-modal .pv-stats{font-size:12px;color:var(--pv-t3);background:var(--pv-input);padding:3px 10px;border-radius:6px;white-space:nowrap}
      #md2lark-preview-modal .pv-close{width:36px;height:36px;border-radius:10px;border:1px solid var(--pv-border);background:var(--pv-bg);cursor:pointer;font-size:18px;color:var(--pv-t3);display:flex;align-items:center;justify-content:center;transition:all .2s;flex-shrink:0;margin-left:12px}
      #md2lark-preview-modal .pv-close:hover{color:var(--pv-err);border-color:var(--pv-err);background:rgba(231,76,60,.06)}
      #md2lark-preview-modal .pv-body{padding:32px 40px;overflow-y:auto;flex:1;font-size:15px;line-height:1.8;color:var(--pv-t2)}
      #md2lark-preview-modal .pv-body h1{font-size:28px;font-weight:800;color:var(--pv-t1);margin:20px 0 10px;line-height:1.25;letter-spacing:-.3px}
      #md2lark-preview-modal .pv-body h2{font-size:22px;font-weight:700;color:var(--pv-t1);margin:18px 0 8px;line-height:1.3}
      #md2lark-preview-modal .pv-body h3{font-size:18px;font-weight:700;color:var(--pv-t1);margin:14px 0 6px}
      #md2lark-preview-modal .pv-body h4,#md2lark-preview-modal .pv-body h5,#md2lark-preview-modal .pv-body h6{font-size:15px;font-weight:600;color:var(--pv-t1);margin:10px 0 4px}
      #md2lark-preview-modal .pv-body p{margin:8px 0}
      #md2lark-preview-modal .pv-body ul,#md2lark-preview-modal .pv-body ol{padding-left:24px;margin:8px 0}
      #md2lark-preview-modal .pv-body li{margin:4px 0}
      #md2lark-preview-modal .pv-body code{background:var(--pv-accent-light);color:var(--pv-accent);padding:2px 6px;border-radius:5px;font-size:13px;font-family:'SF Mono','Fira Code','Consolas',monospace}
      #md2lark-preview-modal .pv-body pre{background:var(--pv-bg3);border:1px solid var(--pv-border);border-radius:10px;padding:16px;margin:12px 0;overflow-x:auto}
      #md2lark-preview-modal .pv-body pre code{background:transparent;color:var(--pv-t1);padding:0}
      #md2lark-preview-modal .pv-body blockquote{border-left:3px solid var(--pv-accent);padding:8px 16px;margin:12px 0;color:var(--pv-t2);background:var(--pv-accent-light);border-radius:0 8px 8px 0}
      #md2lark-preview-modal .pv-body hr{border:none;border-top:1px solid var(--pv-border);margin:16px 0}
      #md2lark-preview-modal .pv-body a{color:var(--pv-accent);text-decoration:none;font-weight:500}
      #md2lark-preview-modal .pv-body a:hover{text-decoration:underline}
      #md2lark-preview-modal .pv-body table{width:100%;border-collapse:collapse;margin:12px 0;font-size:14px}
      #md2lark-preview-modal .pv-body th,#md2lark-preview-modal .pv-body td{border:1px solid var(--pv-border);padding:10px 12px;text-align:left}
      #md2lark-preview-modal .pv-body th{background:var(--pv-input);font-weight:700;color:var(--pv-t1);font-size:13px;text-transform:uppercase;letter-spacing:.3px}
      #md2lark-preview-modal .pv-body img{max-width:100%;border-radius:8px;margin:10px 0}
      #md2lark-preview-modal .pv-body strong{color:var(--pv-t1);font-weight:600}
      .diagram-block{margin:10px 0;text-align:center;background:var(--pv-bg2);border:1px solid var(--pv-border);border-radius:10px;padding:14px;overflow-x:auto}
      .diagram-block img{max-width:100%;height:auto}
      #md2lark-preview-modal .pv-body::-webkit-scrollbar{width:5px}
      #md2lark-preview-modal .pv-body::-webkit-scrollbar-track{background:transparent}
      #md2lark-preview-modal .pv-body::-webkit-scrollbar-thumb{background:var(--pv-border);border-radius:10px}
    </style>
    <div id="md2lark-preview-modal">
      <div class="pv-header">
        <div class="pv-info">
          <svg class="pv-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          <span class="pv-name">${name}</span>
          <span class="pv-stats">${statsText}</span>
        </div>
        <button class="pv-close" id="md2lark-preview-close">✕</button>
      </div>
      <div class="pv-body">${html}</div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Close handlers
  document.getElementById('md2lark-preview-close')!.addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
  document.addEventListener('keydown', function esc(e) {
    if (e.key === 'Escape') {
      overlay.remove();
      document.removeEventListener('keydown', esc);
    }
  });
}
