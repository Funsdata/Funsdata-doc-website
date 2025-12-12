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

/**
 * 检查 URL 是否为相对路径
 */
const isRelativeUrl = (url: string): boolean => {
  if (!url) return false;
  // 绝对 URL（http://, https://, //, data:, blob:）
  if (/^(https?:)?\/\/|^data:|^blob:/i.test(url)) return false;
  // 锚点链接
  if (url.startsWith('#')) return false;
  return true;
};

/**
 * 解析相对路径为绝对路径
 */
const resolveRelativeUrl = (relativeUrl: string, baseUrl: string, docPath: string): string => {
  if (!isRelativeUrl(relativeUrl)) return relativeUrl;

  // 获取文档所在目录路径
  const docDir = docPath.replace(/\/[^/]*$/, '');

  // 处理 ./ 和 ../ 路径
  let resolvedPath: string;
  if (relativeUrl.startsWith('./')) {
    resolvedPath = `${docDir}/${relativeUrl.slice(2)}`;
  } else if (relativeUrl.startsWith('../')) {
    // 处理上级目录
    const parts = docDir.split('/').filter(Boolean);
    let url = relativeUrl;
    while (url.startsWith('../') && parts.length > 0) {
      parts.pop();
      url = url.slice(3);
    }
    resolvedPath = parts.length > 0 ? `${parts.join('/')}/${url}` : url;
  } else {
    // 相对于当前目录
    resolvedPath = `${docDir}/${relativeUrl}`;
  }

  // 规范化路径（移除多余的斜杠）
  resolvedPath = resolvedPath.replace(/\/+/g, '/').replace(/^\//, '');

  return `${baseUrl.replace(/\/$/, '')}/${resolvedPath}`;
};

/**
 * 转换 HTML 中的资源路径为 CDN 绝对路径
 */
const transformResourceUrls = (html: string, baseUrl: string, docPath: string): string => {
  if (!baseUrl) return html;

  // 转换图片 src
  let transformed = html.replace(
    /<img\s+([^>]*?)src=["']([^"']+)["']([^>]*)>/gi,
    (_match, before, src, after) => {
      const resolved = resolveRelativeUrl(src, baseUrl, docPath);
      return `<img ${before}src="${resolved}"${after}>`;
    }
  );

  // 转换视频 src
  transformed = transformed.replace(
    /<video\s+([^>]*?)src=["']([^"']+)["']([^>]*)>/gi,
    (_match, before, src, after) => {
      const resolved = resolveRelativeUrl(src, baseUrl, docPath);
      return `<video ${before}src="${resolved}"${after}>`;
    }
  );

  // 转换 source 标签的 src（用于 video/audio）
  transformed = transformed.replace(
    /<source\s+([^>]*?)src=["']([^"']+)["']([^>]*)>/gi,
    (_match, before, src, after) => {
      const resolved = resolveRelativeUrl(src, baseUrl, docPath);
      return `<source ${before}src="${resolved}"${after}>`;
    }
  );

  // 转换音频 src
  transformed = transformed.replace(
    /<audio\s+([^>]*?)src=["']([^"']+)["']([^>]*)>/gi,
    (_match, before, src, after) => {
      const resolved = resolveRelativeUrl(src, baseUrl, docPath);
      return `<audio ${before}src="${resolved}"${after}>`;
    }
  );

  // 转换下载链接（常见的文件类型）
  transformed = transformed.replace(
    /<a\s+([^>]*?)href=["']([^"']+\.(zip|pdf|docx?|xlsx?|pptx?|rar|7z|tar\.gz|tgz))["']([^>]*)>/gi,
    (_match, before, href, _ext, after) => {
      const resolved = resolveRelativeUrl(href, baseUrl, docPath);
      return `<a ${before}href="${resolved}"${after}>`;
    }
  );

  return transformed;
};

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

export type RenderOptions = {
  /** CDN 基础 URL，用于转换相对路径资源 */
  baseUrl?: string;
  /** 当前文档的相对路径（如 "getting-started.md" 或 "guides/install.md"） */
  docPath?: string;
};

export const renderMarkdown = (markdown: string, options: RenderOptions = {}) => {
  const headings: DocHeading[] = [];
  const md = createMarkdownRenderer().use(anchor, {
    slugify,
    permalink: anchor.permalink.linkInsideHeader({
      placement: 'after',
      symbol: '#',
      class: 'header-anchor',
      ariaHidden: true
    }),
    callback(token, info) {
      const level = Number(token.tag?.replace('h', '')) || 2;
      headings.push({ id: info.slug, title: info.title, level });
    }
  });

  let html = md.render(markdown);

  // 转换资源路径为 CDN 绝对路径
  if (options.baseUrl && options.docPath) {
    html = transformResourceUrls(html, options.baseUrl, options.docPath);
  }

  const sanitized = DOMPurify.sanitize(html, {
    ADD_TAGS: ['video', 'audio', 'source'],
    ADD_ATTR: ['controls', 'autoplay', 'muted', 'loop', 'poster', 'preload', 'playsinline']
  });

  return { html: sanitized, headings };
};
