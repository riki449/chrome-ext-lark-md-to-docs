/**
 * Diagram detection and rendering: PlantUML + Mermaid.
 * Image mode: diagram code → PNG + original code below.
 * Code mode:  keep as syntax-highlighted code blocks.
 */

export function hasDiagrams(md: string): boolean {
  return /```(?:plantuml|puml|mermaid)\s*\n/i.test(md);
}

function textToHex(text: string): string {
  return Array.from(new TextEncoder().encode(text))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Unicode-safe base64url encoding for mermaid.ink URLs.
 * Standard btoa() only handles Latin1 and produces +/= which break URLs.
 * This encodes UTF-8 bytes → base64url (RFC 4648 §5).
 */
function unicodeBase64url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function decodeHTMLEntities(text: string): string {
  const el = document.createElement('textarea');
  el.innerHTML = text;
  return el.value;
}

export function renderDiagramsAsImages(html: string): string {
  let result = html;

  // PlantUML → PNG + original code
  result = result.replace(
    /<pre><code class="language-(?:plantuml|puml)">([\s\S]*?)<\/code><\/pre>/gi,
    (original, code) => {
      try {
        const decoded = decodeHTMLEntities(code.trim());
        const url = `https://www.plantuml.com/plantuml/png/~h${textToHex(decoded)}`;
        return [
          `<div class="diagram-block">`,
          `  <img src="${url}" alt="PlantUML Diagram" loading="lazy" />`,
          `</div>`,
          original, // keep original code block below
        ].join('\n');
      } catch (err: any) {
        console.error('MD2Lark:: Lỗi render PlantUML diagram:', err?.message, err);
        return original; // fallback: giữ code block gốc
      }
    },
  );

  // Mermaid → PNG + original code
  result = result.replace(
    /<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/gi,
    (original, code) => {
      try {
        const decoded = decodeHTMLEntities(code.trim());
        const url = `https://mermaid.ink/img/${unicodeBase64url(decoded)}?type=png`;
        return [
          `<div class="diagram-block">`,
          `  <img src="${url}" alt="Mermaid Diagram" loading="lazy" />`,
          `</div>`,
          original, // keep original code block below
        ].join('\n');
      } catch (err: any) {
        console.error('MD2Lark:: Lỗi render Mermaid diagram:', err?.message, err);
        return original; // fallback: giữ code block gốc
      }
    },
  );

  return result;
}
