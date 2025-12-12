import { docsConfig } from '../config/docs';

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const ensureLeadingSlash = (value: string) => (value.startsWith('/') ? value : `/${value}`);

const unique = <T,>(values: T[]): T[] => Array.from(new Set(values));

export type FetchDocParams = {
  locale: string;
  versionId: string;
  versionPath: string;
  relativePath: string;
  localeCdnBase?: string | null;
};

const buildDocSources = ({
  locale,
  versionId,
  versionPath,
  relativePath,
  localeCdnBase
}: FetchDocParams) => {
  const normalizedRelative = relativePath.replace(/\\/g, '/');
  const normalizedVersionPath = versionPath.replace(/\\/g, '/').replace(/^\//, '');
  const docPathFromRoot = `${normalizedVersionPath.replace(/\/$/, '')}/${normalizedRelative}`;
  const cdnCandidates: string[] = [];

  if (docsConfig.globalCdnBaseUrl) {
    cdnCandidates.push(
      `${trimTrailingSlash(docsConfig.globalCdnBaseUrl)}/${docPathFromRoot}`
    );
  }

  if (localeCdnBase) {
    cdnCandidates.push(`${trimTrailingSlash(localeCdnBase)}/${docPathFromRoot}`);
  }

  const gitHubBase =
    docsConfig.repoOwner && docsConfig.repoName
      ? `https://raw.githubusercontent.com/${docsConfig.repoOwner}/${docsConfig.repoName}/${docsConfig.repoBranch}`
      : null;

  const gitHubUrl = gitHubBase ? `${gitHubBase}/docs/${docPathFromRoot}` : null;

  const localFallback = `${trimTrailingSlash(docsConfig.localFallbackBaseUrl)}${ensureLeadingSlash(
    `${locale}/${versionId}/${normalizedRelative}`
  )}`;

  return unique([
    ...cdnCandidates,
    ...(gitHubUrl ? [gitHubUrl] : []),
    localFallback
  ]);
};

export async function fetchDocMarkdown(params: FetchDocParams): Promise<{ markdown: string; origin: string }> {
  const sources = buildDocSources(params);
  const timeoutMs = docsConfig.requestTimeoutMs;

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
      return { markdown, origin: url };
    } catch (error) {
      console.warn(`[docs] failed to fetch ${url}`, error);
    }
  }

  throw new Error(`Unable to fetch document ${params.relativePath}`);
}
