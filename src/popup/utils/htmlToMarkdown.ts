import TurndownService from 'turndown';

/**
 * Convert HTML string to Markdown using Turndown.
 * Configured for Lark Docs HTML output.
 */
export function htmlToMarkdown(html: string): string {
  // Pre-clean: strip hidden/deactivated virtual blocks so Turndown doesn't skip content
  let cleaned = html
    // Remove data-bear-virtual-deactivated-child wrappers but keep their inner content
    .replace(/\s*data-bear-virtual-deactivated-child="[^"]*"/g, '')
    .replace(/\s*data-bear-virtual-deactivated-ignore="[^"]*"/g, '')
    .replace(/\s*data-bear-virtual-layout-ignore="[^"]*"/g, '');

  const td = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-',
    emDelimiter: '*',
    strongDelimiter: '**',
    hr: '---',
  });

  // ── Remove Lark UI elements ──
  td.remove((node) => {
    const el = node as HTMLElement;
    // Remove avatar images (small profile pictures)
    if (el.nodeName === 'IMG') {
      const src = el.getAttribute('src') || '';
      if (src.includes('static-resource') && src.includes('default-face')) return true;
      if (src.includes('avatar')) return true;
    }
    // Remove buttons like "Add Icon", "Add Cover"
    if (el.getAttribute('data-testid')?.includes('icon-button')) return true;
    if (el.getAttribute('data-testid')?.includes('cover-button')) return true;
    // Remove metadata elements (author, date)
    if (el.classList?.contains('doc-meta-info')) return true;
    if (el.classList?.contains('docx-meta')) return true;
    // Remove Lark's "Code block" label overlay
    if (el.classList?.contains('code-block-header')) return true;
    if (el.textContent === 'Code block') {
      const style = el.getAttribute('style') || '';
      if (style.includes('position') || el.classList?.contains('label')) return true;
    }
    return false;
  });

  // Strikethrough
  td.addRule('strikethrough', {
    filter: ['del', 's'],
    replacement: (content) => `~~${content}~~`,
  });

  // Checkbox (task lists)
  td.addRule('checkbox', {
    filter: (node) => {
      return node.nodeName === 'INPUT' && (node as HTMLInputElement).type === 'checkbox';
    },
    replacement: (_content, node) => {
      return (node as HTMLInputElement).checked ? '[x] ' : '[ ] ';
    },
  });

  // Lark code blocks — extract language and content
  td.addRule('larkCodeBlock', {
    filter: (node) => {
      return (
        node.nodeName === 'DIV' &&
        (node.classList?.contains('code-block') ||
         node.getAttribute('data-block-type') === 'code' ||
         node.classList?.contains('ne-code-block'))
      );
    },
    replacement: (_content, node) => {
      const el = node as HTMLElement;
      // Try to find language
      const lang =
        el.getAttribute('data-language') ||
        el.querySelector('[data-language]')?.getAttribute('data-language') ||
        el.querySelector('.code-block-language')?.textContent?.trim() ||
        '';
      // Get code text from lines
      const codeLines = el.querySelectorAll('[data-slate-node="text"], .code-line, .ne-code-line');
      let code = '';
      if (codeLines.length > 0) {
        code = Array.from(codeLines).map(l => l.textContent || '').join('\n');
      } else {
        // Fallback: get all text content, excluding the header
        const header = el.querySelector('.code-block-header, .code-block-label');
        if (header) header.remove();
        code = el.textContent?.replace(/^\n+|\n+$/g, '') || '';
      }
      return `\n\`\`\`${lang}\n${code}\n\`\`\`\n`;
    },
  });

  // Lark inline code
  td.addRule('larkInlineCode', {
    filter: (node) => {
      return node.nodeName === 'CODE' || 
        (node.nodeName === 'SPAN' && (node as HTMLElement).style?.fontFamily?.includes('monospace'));
    },
    replacement: (content) => `\`${content}\``,
  });

  // Images — preserve src and alt, skip tiny icons/avatars
  td.addRule('image', {
    filter: 'img',
    replacement: (_content, node) => {
      const el = node as HTMLImageElement;
      const alt = el.alt || '';
      const src = el.src || '';
      // Skip tiny images (likely icons/avatars)
      const width = parseInt(el.getAttribute('width') || '999');
      const height = parseInt(el.getAttribute('height') || '999');
      if (width <= 32 && height <= 32) return '';
      if (src.includes('default-face') || src.includes('avatar')) return '';
      return src ? `![${alt}](${src})` : '';
    },
  });

  // Lark horizontal rule
  td.addRule('larkHr', {
    filter: (node) => {
      return (
        node.nodeName === 'DIV' &&
        ((node as HTMLElement).getAttribute('data-block-type') === 'divider' ||
         (node as HTMLElement).classList?.contains('divider-block'))
      );
    },
    replacement: () => '\n---\n',
  });

  let result = td.turndown(cleaned);

  // Post-clean
  result = result
    // Remove "Add Icon" / "Add Cover" text that might slip through
    .replace(/^Add Icon\s*/gm, '')
    .replace(/^Add Cover\s*/gm, '')
    // Remove standalone "Code block" labels
    .replace(/^Code block\s*$/gm, '')
    // Remove "Plain Text" "Wrap" "Copy" toolbar text from code blocks
    .replace(/^(Plain Text|Wrap|Copy)\s*$/gm, '')
    // Clean up excessive blank lines
    .replace(/\n{4,}/g, '\n\n\n')
    // Remove zero-width chars
    .replace(/[\u200B\u200C\u200D\uFEFF\u202C]/g, '')
    .trim();

  return result;
}
