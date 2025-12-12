const fallback = (value: string | undefined, defaultValue = '') => {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }
  return defaultValue;
};

export const docsConfig = {
  repoOwner: fallback(import.meta.env.VITE_DOCS_REPO_OWNER),
  repoName: fallback(import.meta.env.VITE_DOCS_REPO_NAME),
  repoBranch: fallback(import.meta.env.VITE_DOCS_REPO_BRANCH, 'main'),
  globalCdnBaseUrl: fallback(import.meta.env.VITE_DOCS_CDN_BASE_URL),
  localFallbackBaseUrl: fallback(import.meta.env.VITE_DOCS_LOCAL_BASE_URL, '/raw'),
  requestTimeoutMs: Number(import.meta.env.VITE_DOCS_REQUEST_TIMEOUT ?? 8000)
};

export const manifestEndpoints = {
  versions: '/manifest/versions.json'
};
