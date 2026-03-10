import { useCallback, useMemo, useRef, useState } from 'react';
import { DiagramMode, InputMode, Status } from '../types';
import { hasDiagrams, renderDiagramsAsImages } from '../utils/diagrams';
// import { htmlToMarkdown } from '../utils/htmlToMarkdown'; // TODO: re-enable for export feature
import { embedExternalImages } from '../utils/imageEmbed';
import { parseMarkdown } from '../utils/markdown';


export function useConverter() {
  const [status, setStatus] = useState<Status>('idle');
  const [fileName, setFileName] = useState('');
  const [mdContent, setMdContent] = useState('');
  const [rawHtml, setRawHtml] = useState('');
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [mode, setMode] = useState<InputMode>('file');
  const [diagramMode, setDiagramMode] = useState<DiagramMode>('image');
  const [insertMethod, setInsertMethod] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const previewHtmlRef = useRef('');

  const hasDiagramBlocks = useMemo(() => hasDiagrams(mdContent), [mdContent]);

  const htmlPreview = useMemo(() => {
    if (!rawHtml) return '';
    try {
      let result = rawHtml;
      if (hasDiagramBlocks && diagramMode === 'image') {
        result = renderDiagramsAsImages(rawHtml);
      }
      previewHtmlRef.current = result;
      return result;
    } catch (err: any) {
      console.error('MD2Lark:: Lỗi render diagram preview:', err?.message, err);
      previewHtmlRef.current = rawHtml;
      return rawHtml;
    }
  }, [rawHtml, diagramMode, hasDiagramBlocks]);

  const stats = useMemo(() => ({
    lines: mdContent.split('\n').length,
    words: mdContent.split(/\s+/).filter(Boolean).length,
    chars: mdContent.length,
  }), [mdContent]);

  const processMarkdown = useCallback((text: string) => {
    try {
      const html = parseMarkdown(text);
      setMdContent(text);
      setRawHtml(html);
      // Store immediately in ref for callers that need instant access
      const diagrams = hasDiagrams(text);
      previewHtmlRef.current = diagrams && diagramMode === 'image'
        ? renderDiagramsAsImages(html)
        : html;
    } catch (err: any) {
      console.error('MD2Lark:: Lỗi parse markdown:', err?.message, err);
      setError('Failed to parse markdown: ' + (err?.message || 'Unknown error'));
      setStatus('error');
    }
  }, [diagramMode]);

  const handleFile = useCallback((file: File) => {
    if (!/\.(md|markdown|txt)$/i.test(file.name)) {
      setError('Please select a .md or .markdown file');
      setStatus('error');
      return;
    }
    setStatus('loading');
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      processMarkdown(e.target?.result as string);
      setStatus('ready');
    };
    reader.onerror = () => {
      setError('Failed to read file');
      setStatus('error');
    };
    reader.readAsText(file);
  }, [processMarkdown]);

  const handlePaste = useCallback((text: string, name = 'pasted-content.md') => {
    if (!text.trim()) return;
    setFileName(name);
    processMarkdown(text);
    setStatus('ready');
  }, [processMarkdown]);

  const prepareHtml = async (title?: string) => {
    let htmlToInsert = rawHtml;
    if (hasDiagramBlocks && diagramMode === 'image') {
      htmlToInsert = renderDiagramsAsImages(rawHtml);
    }

    // Embed external images as data URIs (Lark can't load external URLs)
    setProgress('Downloading images...');
    htmlToInsert = await embedExternalImages(htmlToInsert, (current, total) => {
      setProgress(`Downloading images (${current}/${total})...`);
    });

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error('No active tab found');

    const url = tab.url || '';
    const isLarkDomain = /larksuite\.com|feishu\.cn|lark\.suite\.com/.test(url);
    const isDocPage = /\/(docx|wiki|docs)\//.test(url);
    if (!isLarkDomain || !isDocPage) {
      throw new Error('Please open a Lark document first.\n\nOpen a doc or wiki page on larksuite.com, then try again.');
    }

    if (title) {
      // First check if the doc already has a title
      setProgress('Setting title...');
      const titleCheckResults = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        world: 'MAIN',
        func: checkDocTitle,
      });
      const docHasTitle = titleCheckResults?.[0]?.result === true;

      if (!docHasTitle) {
        // Doc is empty → set title AND strip first H1 from content
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          world: 'MAIN',
          func: setDocTitle,
          args: [title],
        });
        htmlToInsert = htmlToInsert.replace(/^\s*<h1[^>]*>.*?<\/h1>\s*/i, '');
      }
      // If doc already has a title → keep H1 in content, don't set title
    }

    return { htmlToInsert, tab };
  };

  const convert = async (title?: string) => {
    if (!rawHtml) return;
    setStatus('converting');
    setProgress('Preparing...');

    try {
      const { htmlToInsert, tab } = await prepareHtml(title);

      setProgress('Inserting into document...');
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id! },
        world: 'MAIN',
        func: injectAndPaste,
        args: [htmlToInsert],
      });

      const result = results?.[0]?.result;
      if (result?.success) {
        setInsertMethod(result.method);
        setStatus('success');
      } else {
        throw new Error(result?.error || 'Failed to insert content');
      }
    } catch (err: any) {
      console.error('MD2Lark:: Lỗi convert:', err?.name, err?.message, '\nStack:', err?.stack);
      setError(err?.message || 'Failed to insert.');
      setStatus('error');
    } finally {
      setProgress('');
    }
  };

  const reset = () => {
    setStatus('idle');
    setFileName('');
    setMdContent('');
    setRawHtml('');
    setError('');
    setProgress('');
    setInsertMethod('');
    if (fileRef.current) fileRef.current.value = '';
  };

  // TODO: re-enable export feature
  // /** Export current Lark Doc content as a Markdown file */
  // const exportToMd = async () => {
  //   setStatus('converting');
  //   setProgress('Extracting content...');
  //   try {
  //     const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  //     if (!tab?.id) throw new Error('No active tab found');
  //     const url = tab.url || '';
  //     const isLarkDomain = /larksuite\.com|feishu\.cn|lark\.suite\.com/.test(url);
  //     const isDocPage = /\/(docx|wiki|docs)\//.test(url);
  //     if (!isLarkDomain || !isDocPage) {
  //       throw new Error('Please open a Lark document first.');
  //     }
  //     const results = await chrome.scripting.executeScript({
  //       target: { tabId: tab.id },
  //       world: 'MAIN',
  //       func: extractEditorContent,
  //     });
  //     const result = results?.[0]?.result;
  //     if (!result?.html) {
  //       throw new Error('Could not extract content from the document.');
  //     }
  //     setProgress('Converting to Markdown...');
  //     const md = htmlToMarkdown(result.html);
  //     if (!md.trim()) {
  //       throw new Error('Document appears to be empty.');
  //     }
  //     const docTitle = (result.title || 'untitled')
  //       .replace(/[\u0000-\u001F\u007F-\u009F\u00AD\u200B-\u200F\u2028-\u202F\u2060-\u206F\uFEFF\uFFF9-\uFFFC]/g, '')
  //       .replace(/[/\\?%*:|"<>]/g, '-')
  //       .replace(/^[\s\-_.]+/, '')
  //       .trim() || 'untitled';
  //     const filename = `${docTitle}.md`;
  //     const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  //     const blobUrl = URL.createObjectURL(blob);
  //     const a = document.createElement('a');
  //     a.href = blobUrl;
  //     a.download = filename;
  //     a.click();
  //     URL.revokeObjectURL(blobUrl);
  //     setFileName(filename);
  //     setInsertMethod('download');
  //     setStatus('success');
  //   } catch (err: any) {
  //     console.error('MD2Lark:: Export error:', err);
  //     setError(err?.message || 'Failed to export.');
  //     setStatus('error');
  //   } finally {
  //     setProgress('');
  //   }
  // };

  return {
    status, fileName, htmlPreview, error, progress, mdContent,
    isDragging, mode, fileRef, insertMethod, diagramMode, stats,
    previewHtmlRef,
    setIsDragging, setMode, setDiagramMode,
    handleFile, handlePaste, convert, reset, /* exportToMd, */
  };
}

// ---------------------------------------------------------------------------
// Functions injected into Lark tab context via chrome.scripting.executeScript
// ---------------------------------------------------------------------------

/** Extract editor HTML and document title from Lark page */
async function extractEditorContent(): Promise<{ html: string; title: string; debug?: string } | null> {
  try {
    const editor =
      document.querySelector<HTMLElement>('[data-slate-editor="true"]') ||
      document.querySelector<HTMLElement>('.ne-editor-wrap [contenteditable="true"]') ||
      document.querySelector<HTMLElement>('.doc-content [contenteditable="true"]') ||
      document.querySelector<HTMLElement>('[contenteditable="true"]');

    if (!editor) return null;

    const delay = (ms: number) => new Promise<void>(r => setTimeout(r, ms));
    let html = '';
    let method = '';

    // ── Strategy 1: beforeprint trick ──
    // Many virtual-scroll apps disable virtualization for printing.
    // Fire beforeprint → Lark renders ALL blocks → grab innerHTML → afterprint.
    const baseLen = editor.innerHTML.length;
    window.dispatchEvent(new Event('beforeprint'));
    await delay(500);
    html = editor.innerHTML;
    window.dispatchEvent(new Event('afterprint'));

    if (html.length > baseLen * 1.5) {
      // beforeprint worked — got significantly more content
      method = 'beforeprint';
    } else {
      // ── Strategy 2: fast scroll ──
      // Lark removes blocks from DOM entirely when out of viewport.
      // Quick scroll to force them to render, collect at each step.
      method = 'scroll';

      // Find scrollable parent
      let scrollEl: HTMLElement | null = null;
      let parent: HTMLElement | null = editor.parentElement;
      while (parent) {
        if (parent.scrollHeight > parent.clientHeight + 50) {
          const s = window.getComputedStyle(parent);
          if (s.overflowY === 'auto' || s.overflowY === 'scroll' || s.overflow === 'auto' || s.overflow === 'scroll') {
            scrollEl = parent;
            break;
          }
        }
        parent = parent.parentElement;
      }
      // Fallback: try document scrolling element
      if (!scrollEl) {
        scrollEl = document.scrollingElement as HTMLElement || document.documentElement;
      }

      const savedScroll = scrollEl.scrollTop;
      const totalHeight = scrollEl.scrollHeight;
      const step = scrollEl.clientHeight || 800;
      const blockMap = new Map<string, string>();

      function collectBlocks() {
        // Get all rendered children from the editor wrapper
        const wrapper = editor!.children[0] || editor!;
        const children = wrapper.children;
        for (let i = 0; i < children.length; i++) {
          const child = children[i] as HTMLElement;
          if (child.hasAttribute('data-bear-virtual-deactivated-child')) continue;
          const id = child.getAttribute('data-block-id') || child.getAttribute('id') || `b${i}-${child.textContent?.slice(0, 20)}`;
          if (!blockMap.has(id)) {
            blockMap.set(id, child.outerHTML);
          }
        }
      }

      // Fast scroll through entire document
      scrollEl.scrollTop = 0;
      await delay(80);
      collectBlocks();

      for (let pos = step; pos <= totalHeight; pos += step) {
        scrollEl.scrollTop = pos;
        await delay(80);
        collectBlocks();
      }
      scrollEl.scrollTop = totalHeight;
      await delay(80);
      collectBlocks();

      // Restore scroll
      scrollEl.scrollTop = savedScroll;

      if (blockMap.size > 0) {
        html = Array.from(blockMap.values()).join('\n');
        method = `scroll(${blockMap.size} blocks)`;
      } else {
        // Final fallback
        html = editor.innerHTML;
        method = 'innerHTML-fallback';
      }
    }

    const debug = `method=${method}, htmlLen=${html.length}`;

    // Get title
    const titleSelectors = [
      '.doc-title [contenteditable="true"]',
      '.title-content [contenteditable="true"]',
      '[data-placeholder="Title"]',
      '[data-placeholder="Enter title here"]',
      '.suite-title-input',
    ];
    let titleEl: HTMLElement | null = null;
    for (const sel of titleSelectors) {
      titleEl = document.querySelector<HTMLElement>(sel);
      if (titleEl) break;
    }

    const rawTitle = titleEl?.textContent || document.title || '';
    const cleanTitle = rawTitle
      .replace(/[\u0000-\u001F\u007F-\u009F\u00AD\u200B-\u200F\u2028-\u202F\u2060-\u206F\uFEFF\uFFF9-\uFFFC]/g, '')
      .replace(/ - Lark Docs$/, '')
      .replace(/^\d+\.\s*/, '')
      .trim();

    return { html, title: cleanTitle, debug };
  } catch {
    return null;
  }
}

/** Copy HTML to clipboard as fallback when paste injection fails */
function copyToClipboard(html: string): boolean {
  try {
    const htmlBlob = new Blob([html], { type: 'text/html' });
    const textBlob = new Blob([html.replace(/<[^>]*>/g, '')], { type: 'text/plain' });
    navigator.clipboard.write([new ClipboardItem({ 'text/html': htmlBlob, 'text/plain': textBlob })]);
    return true;
  } catch {
    return false;
  }
}

/** Inject HTML into Lark editor by simulating a paste event */
async function injectAndPaste(html: string): Promise<{ success: boolean; method: string; error?: string }> {
  try {
    const editor =
      document.querySelector<HTMLElement>('[data-slate-editor="true"]') ||
      document.querySelector<HTMLElement>('.ne-editor-wrap [contenteditable="true"]') ||
      document.querySelector<HTMLElement>('.doc-content [contenteditable="true"]') ||
      document.querySelector<HTMLElement>('[contenteditable="true"]');

    if (!editor) {
      return copyToClipboard(html)
        ? { success: true, method: 'clipboard' }
        : { success: false, method: '', error: 'No editor found and clipboard failed' };
    }

    // Always move cursor to the end of the document before pasting
    editor.focus();

    // ── Step 1: Scroll the scroll container to absolute bottom ──
    // Lark uses virtual rendering — blocks outside the viewport may NOT exist
    // in the DOM. We must scroll to the bottom first so the last blocks render.
    const scrollContainer =
      editor.closest('.bear-web-docx-page-scroller') ||
      editor.closest('.docx-page-scroller') ||
      editor.closest('[class*="scroll"]') ||
      editor.parentElement;

    if (scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }

    // Wait for virtual renderer to materialize the last blocks
    await new Promise(r => setTimeout(r, 200));

    // ── Step 2: Find the ACTUAL last block (now rendered in DOM) ──
    const directBlocks = editor.querySelectorAll(':scope > [data-slate-node="element"]');
    const lastBlock = (directBlocks.length > 0
      ? directBlocks[directBlocks.length - 1]
      : editor.lastElementChild || editor) as HTMLElement;

    // Make sure it's visible
    lastBlock.scrollIntoView({ block: 'end' });
    await new Promise(r => setTimeout(r, 50));

    // ── Step 3: Simulate click at the very end of the last block ──
    const rect = lastBlock.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      const evtInit: MouseEventInit = {
        bubbles: true, cancelable: true, view: window,
        clientX: rect.right - 5,
        clientY: rect.bottom - 3,
      };
      lastBlock.dispatchEvent(new MouseEvent('mousedown', evtInit));
      lastBlock.dispatchEvent(new MouseEvent('mouseup', evtInit));
      lastBlock.dispatchEvent(new MouseEvent('click', evtInit));
    }

    await new Promise(r => setTimeout(r, 50));

    // ── Step 4: Use Selection.modify to ensure cursor is at doc end ──
    const sel = window.getSelection();
    if (sel) {
      try {
        (sel as any).modify('move', 'forward', 'documentboundary');
      } catch {
        sel.selectAllChildren(editor);
        sel.collapseToEnd();
      }
      document.dispatchEvent(new Event('selectionchange'));
    }

    // Wait for Slate to sync its internal selection model
    await new Promise(r => setTimeout(r, 150));

    // ── Step 5: Handle empty vs non-empty doc ──
    const rawText = (editor.textContent || '').replace(/[\u200B\u200C\u200D\uFEFF\u202C]/g, '').trim();
    const hasContent = rawText.length > 0;

    if (hasContent) {
      // Doc has content → press Enter to create a new block before pasting
      editor.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Enter', code: 'Enter', keyCode: 13,
        bubbles: true, cancelable: true,
      }));
      editor.dispatchEvent(new InputEvent('beforeinput', {
        inputType: 'insertParagraph', bubbles: true, cancelable: true,
      }));
      await new Promise(r => setTimeout(r, 100));
    } else {
      // Doc is empty → select the empty default paragraph so paste REPLACES it
      const emptysel = window.getSelection();
      if (emptysel) {
        emptysel.selectAllChildren(editor);
      }
      await new Promise(r => setTimeout(r, 50));
    }

    const clipboardData = new DataTransfer();
    clipboardData.setData('text/html', html);
    clipboardData.setData('text/plain', html.replace(/<[^>]*>/g, ''));

    editor.dispatchEvent(new ClipboardEvent('paste', {
      bubbles: true,
      cancelable: true,
      clipboardData,
    }));

    // After paste, scroll the inserted content into view
    setTimeout(() => {
      try {
        const postSel = window.getSelection();
        if (postSel && postSel.rangeCount > 0) {
          const node = postSel.getRangeAt(0).startContainer;
          const el = node.nodeType === Node.ELEMENT_NODE ? node as HTMLElement : (node as Node).parentElement;
          el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } catch { /* ignore */ }
    }, 200);

    return { success: true, method: 'paste' };
  } catch (err: any) {
    return copyToClipboard(html)
      ? { success: true, method: 'clipboard' }
      : { success: false, method: '', error: err.message };
  }
}

/** Check if the Lark doc already has a non-empty title */
function checkDocTitle(): boolean {
  const selectors = [
    '.doc-title [contenteditable="true"]',
    '.title-content [contenteditable="true"]',
    '[data-placeholder="Title"]',
    '[data-placeholder="Enter title here"]',
    '.suite-title-input',
    '.title-input [contenteditable="true"]',
    '[data-testid="doc-title"] [contenteditable="true"]',
    '.wiki-title [contenteditable="true"]',
  ];

  let titleEl: HTMLElement | null = null;
  for (const sel of selectors) {
    titleEl = document.querySelector<HTMLElement>(sel);
    if (titleEl) break;
  }

  if (!titleEl) {
    // Fallback: first contenteditable that is NOT the main editor
    const allEditables = document.querySelectorAll<HTMLElement>('[contenteditable="true"]');
    for (const el of allEditables) {
      if (el.getAttribute('data-slate-editor') === 'true') continue;
      const rect = el.getBoundingClientRect();
      if (rect.top < 200 && rect.height < 100) {
        titleEl = el;
        break;
      }
    }
  }

  if (!titleEl) return false;

  const text = (titleEl.textContent || '').replace(/[\u200B\u200C\u200D\uFEFF\u202C]/g, '').trim();
  return text.length > 0;
}

/** Set the Lark document title (caller must check emptiness first via checkDocTitle) */
function setDocTitle(title: string) {
  const selectors = [
    '.doc-title [contenteditable="true"]',
    '.title-content [contenteditable="true"]',
    '[data-placeholder="Title"]',
    '[data-placeholder="Enter title here"]',
    '.suite-title-input',
    '.title-input [contenteditable="true"]',
    '[data-testid="doc-title"] [contenteditable="true"]',
    '.wiki-title [contenteditable="true"]',
  ];

  let titleEl: HTMLElement | null = null;
  for (const s of selectors) {
    titleEl = document.querySelector<HTMLElement>(s);
    if (titleEl) break;
  }

  if (!titleEl) {
    const allEditables = document.querySelectorAll<HTMLElement>('[contenteditable="true"]');
    for (const el of allEditables) {
      if (el.getAttribute('data-slate-editor') === 'true') continue;
      const rect = el.getBoundingClientRect();
      if (rect.top < 200 && rect.height < 100) {
        titleEl = el;
        break;
      }
    }
  }

  if (!titleEl) return;

  titleEl.focus();
  const sel = window.getSelection();
  if (sel) {
    sel.selectAllChildren(titleEl);
  }
  document.execCommand('selectAll', false);
  document.execCommand('insertText', false, title);
}

