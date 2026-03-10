import { marked } from 'marked';

export const parseMarkdown = (text: string): string =>
  marked.parse(text, { gfm: true, breaks: true }) as string;
