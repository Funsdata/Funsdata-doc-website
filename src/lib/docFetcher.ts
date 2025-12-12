import { docsConfig, buildJsDelivrUrl, buildGitHubRawUrl } from '../config/docs';

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const unique = <T,>(values: T[]): T[] => Array.from(new Set(values));

export type FetchDocParams = {
  localePath: string;
  relativePath: string;
  localeCdnBase?: string | null;
};

/**
 * 构建文档资源 URL 列表（按优先级排序）
 *
 * 优先级顺序：
 * 1. 阿里云 CDN（如配置）
 * 2. 语言级别 CDN（如配置）
 * 3. jsDelivr CDN（GitHub 代理，无 rate limit）
 * 4. GitHub Raw（备用）
 */
const buildDocSources = ({
  localePath,
  relativePath,
  localeCdnBase
}: FetchDocParams) => {
  const normalizedRelative = relativePath.replace(/\\/g, '/');
  const normalizedLocalePath = localePath.replace(/\\/g, '/').replace(/^\//, '');
  const docPathFromRoot = `${normalizedLocalePath.replace(/\/$/, '')}/${normalizedRelative}`;
  const sources: string[] = [];

  // 1. 阿里云 CDN（主要源）
  if (docsConfig.cdnBaseUrl) {
    sources.push(`${trimTrailingSlash(docsConfig.cdnBaseUrl)}/${docPathFromRoot}`);
  }

  // 2. 语言级别 CDN
  if (localeCdnBase) {
    sources.push(`${trimTrailingSlash(localeCdnBase)}/${docPathFromRoot}`);
  }

  // 3. jsDelivr CDN（GitHub 代理，无 rate limit，推荐）
  if (docsConfig.useJsDelivr && docsConfig.repoOwner && docsConfig.repoName) {
    sources.push(buildJsDelivrUrl(docPathFromRoot));
  }

  // 4. GitHub Raw（备用，有 rate limit）
  if (docsConfig.repoOwner && docsConfig.repoName) {
    sources.push(buildGitHubRawUrl(docPathFromRoot));
  }

  return unique(sources);
};

/**
 * 获取文档内容的基础 URL（用于解析相对路径资源）
 */
export const getDocBaseUrl = (params: Omit<FetchDocParams, 'relativePath'>): string => {
  const normalizedLocalePath = params.localePath.replace(/\\/g, '/').replace(/^\//, '').replace(/\/$/, '');

  // 优先使用阿里云 CDN
  if (docsConfig.cdnBaseUrl) {
    return `${trimTrailingSlash(docsConfig.cdnBaseUrl)}/${normalizedLocalePath}`;
  }

  // 其次使用语言级别 CDN
  if (params.localeCdnBase) {
    return `${trimTrailingSlash(params.localeCdnBase)}/${normalizedLocalePath}`;
  }

  // 使用 jsDelivr
  if (docsConfig.useJsDelivr && docsConfig.repoOwner && docsConfig.repoName) {
    return `https://cdn.jsdelivr.net/gh/${docsConfig.repoOwner}/${docsConfig.repoName}@${docsConfig.repoBranch}/${normalizedLocalePath}`;
  }

  // 备用：GitHub Raw
  return `https://raw.githubusercontent.com/${docsConfig.repoOwner}/${docsConfig.repoName}/${docsConfig.repoBranch}/${normalizedLocalePath}`;
};

export async function fetchDocMarkdown(params: FetchDocParams): Promise<{ markdown: string }> {
  const sources = buildDocSources(params);
  const timeoutMs = docsConfig.requestTimeoutMs;

  if (sources.length === 0) {
    throw new Error('No document sources configured. Please set VITE_DOCS_CDN_BASE_URL or GitHub repo settings.');
  }

  for (const url of sources) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const response = await fetch(url, {
        signal: controller.signal,
        cache: 'no-cache'
      });
      clearTimeout(timer);
      if (!response.ok) {
        continue;
      }
      const markdown = await response.text();
      return { markdown };
    } catch (error) {
      console.warn(`[docs] failed to fetch ${url}`, error);
    }
  }

  throw new Error(`Unable to fetch document ${params.relativePath}`);
}
