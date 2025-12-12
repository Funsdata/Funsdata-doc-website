const fallback = (value: string | undefined, defaultValue = '') => {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }
  return defaultValue;
};

export const docsConfig = {
  /** 阿里云 CDN 基础 URL（主要内容源） */
  cdnBaseUrl: fallback(import.meta.env.VITE_DOCS_CDN_BASE_URL),

  /** GitHub 仓库配置（备用源） */
  repoOwner: fallback(import.meta.env.VITE_DOCS_REPO_OWNER, 'Funsdata'),
  repoName: fallback(import.meta.env.VITE_DOCS_REPO_NAME, 'FunsdataBI-doc'),
  repoBranch: fallback(import.meta.env.VITE_DOCS_REPO_BRANCH, 'master'),

  /** jsDelivr CDN（GitHub 的 CDN 代理，无 rate limit） */
  useJsDelivr: import.meta.env.VITE_DOCS_USE_JSDELIVR !== 'false',

  /** 请求超时时间 */
  requestTimeoutMs: Number(import.meta.env.VITE_DOCS_REQUEST_TIMEOUT ?? 8000)
};

/** 构建 jsDelivr CDN URL */
export const buildJsDelivrUrl = (filePath: string): string => {
  const { repoOwner, repoName, repoBranch } = docsConfig;
  const normalizedPath = filePath.replace(/^\/+/, '');
  return `https://cdn.jsdelivr.net/gh/${repoOwner}/${repoName}@${repoBranch}/${normalizedPath}`;
};

/** 构建 GitHub Raw URL */
export const buildGitHubRawUrl = (filePath: string): string => {
  const { repoOwner, repoName, repoBranch } = docsConfig;
  const normalizedPath = filePath.replace(/^\/+/, '');
  return `https://raw.githubusercontent.com/${repoOwner}/${repoName}/${repoBranch}/${normalizedPath}`;
};

export const manifestEndpoints = {
  manifest: '/manifest/manifest.json'
};
