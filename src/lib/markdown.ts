import MarkdownIt from 'markdown-it';
import anchor from 'markdown-it-anchor';
import container from 'markdown-it-container';
import footnote from 'markdown-it-footnote';
import taskLists from 'markdown-it-task-lists';
import hljs from 'highlight.js';
import DOMPurify from 'dompurify';
import type { DocHeading } from '../types/docs';

const slugify = (str: string) =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');

const createMarkdownRenderer = () =>
  new MarkdownIt({
    html: true,
    linkify: true,
    highlight(code, lang) {
      if (lang && hljs.getLanguage(lang)) {
        return `<pre class="hljs"><code>${hljs.highlight(code, { language: lang }).value}</code></pre>`;
      }
      return `<pre class="hljs"><code>${MarkdownIt().utils.escapeHtml(code)}</code></pre>`;
    }
  })
    .use(taskLists, { label: true, enabled: true })
    .use(container, 'info')
    .use(container, 'warning')
    .use(container, 'tip')
    .use(footnote);

export const renderMarkdown = (markdown: string) => {
  const headings: DocHeading[] = [];
  const md = createMarkdownRenderer().use(anchor, {
    slugify,
    permalink: anchor.permalink.ariaHidden({ placement: 'before' }),
    callback(token, info) {
      const level = Number(token.tag?.replace('h', '')) || 2;
      headings.push({ id: info.slug, title: info.title, level });
    }
  });

  const html = md.render(markdown);
  const sanitized = DOMPurify.sanitize(html);

  return { html: sanitized, headings };
};
