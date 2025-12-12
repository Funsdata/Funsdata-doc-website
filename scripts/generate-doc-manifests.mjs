#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..');
const docsRoot = path.join(projectRoot, 'docs');
const cacheRoot = path.join(projectRoot, '.cache', 'docs');
const versionsConfigPath = path.join(docsRoot, 'versions.config.json');
const manifestRoot = path.join(projectRoot, 'public', 'manifest');
const rawOutputRoot = path.join(projectRoot, 'public', 'raw');

const docsMirrorRoot = process.env.DOCS_LOCAL_MIRROR ? path.resolve(projectRoot, process.env.DOCS_LOCAL_MIRROR) : null;
const githubToken = process.env.DOCS_GITHUB_TOKEN ?? process.env.GITHUB_TOKEN ?? null;

const headingPattern = /^#{1,6}\s+(.+)$/gm;
const textCleanupPattern = /[`*_>#\[\]!]/g;
const markdownExtensionPattern = /\.md$/i;

const githubHeaders = {
  'User-Agent': 'funsdata-docs-manifest',
  Accept: 'application/vnd.github+json'
};

if (githubToken) {
  githubHeaders.Authorization = `Bearer ${githubToken}`;
}

const remoteState = {
  tree: null
};

const trimSlashes = (value = '') => value.replace(/^\/+|\/+$/g, '');
const normalizeVersionPath = (value = '') => trimSlashes(value.replace(/\\/g, '/'));

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function readJson(filePath) {
  const buffer = await fs.readFile(filePath, 'utf8');
  return JSON.parse(buffer);
}

function toSlug(locale, versionId, relativeFilePath) {
  const withoutExt = relativeFilePath.replace(/\\/g, '/').replace(/\.md$/i, '');
  return `/${locale}/${versionId}/${withoutExt}`;
}

async function extractDocMeta(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  const headings = [];
  let match;
  while ((match = headingPattern.exec(raw)) !== null) {
    headings.push(match[1].trim());
  }
  const title = headings[0] || path.basename(filePath, path.extname(filePath));
  const stripped = raw
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(headingPattern, ' ')
    .replace(textCleanupPattern, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const excerpt = stripped.slice(0, 220);
  return { title, headings: headings.slice(1), excerpt, raw };
}

async function copyRawFile(sourcePath, relativePath) {
  const destinationPath = path.join(rawOutputRoot, relativePath);
  await ensureDir(path.dirname(destinationPath));
  await fs.copyFile(sourcePath, destinationPath);
}

async function fetchGithubJson(url) {
  const response = await fetch(url, { headers: githubHeaders });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(`GitHub API request failed (${response.status}): ${message}`);
  }
  return response.json();
}

async function loadRemoteTree(remote) {
  if (remoteState.tree) {
    return remoteState.tree;
  }
  const treeUrl = new URL(`https://api.github.com/repos/${remote.repoOwner}/${remote.repoName}/git/trees/${encodeURIComponent(remote.repoBranch)}`);
  treeUrl.searchParams.set('recursive', '1');
  const payload = await fetchGithubJson(treeUrl.href);
  if (!Array.isArray(payload.tree)) {
    throw new Error('Unexpected GitHub tree payload.');
  }
  remoteState.tree = payload.tree;
  return remoteState.tree;
}

async function downloadRawFile(remote, remoteFilePath, destinationPath) {
  const rawUrl = `https://raw.githubusercontent.com/${remote.repoOwner}/${remote.repoName}/${remote.repoBranch}/${remoteFilePath}`;
  const response = await fetch(rawUrl, { headers: githubHeaders, cache: 'no-store' });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Failed to download ${remoteFilePath}: ${response.status} ${message}`);
  }
  const content = await response.text();
  await ensureDir(path.dirname(destinationPath));
  await fs.writeFile(destinationPath, content, 'utf8');
}

async function mirrorRemoteVersion({ remote, versionPath, destination }) {
  const tree = await loadRemoteTree(remote);
  const remotePrefix = trimSlashes(path.posix.join(remote.baseDir ?? '', versionPath));
  const prefixWithSlash = remotePrefix ? `${remotePrefix}/` : '';
  const relevantFiles = tree.filter((entry) => entry.type === 'blob' && entry.path.startsWith(prefixWithSlash) && markdownExtensionPattern.test(entry.path));

  if (relevantFiles.length === 0) {
    throw new Error(`Remote path "${remotePrefix}" does not contain any Markdown files.`);
  }

  await fs.rm(destination, { recursive: true, force: true });
  await ensureDir(destination);

  for (const entry of relevantFiles) {
    const relativePath = prefixWithSlash ? entry.path.slice(prefixWithSlash.length) : entry.path;
    const localPath = path.join(destination, relativePath.split('/').join(path.sep));
    await downloadRawFile(remote, entry.path, localPath);
  }

  console.log(`↺ Mirrored ${relevantFiles.length} Markdown file(s) from ${remote.repoOwner}/${remote.repoName}:${remote.repoBranch}/${remotePrefix || '.'}`);
  return destination;
}

async function resolveVersionRoot({ locale, versionId, versionPath, remote }) {
  const normalizedPath = normalizeVersionPath(versionPath);
  const localCandidate = path.join(docsRoot, normalizedPath);
  if (await pathExists(localCandidate)) {
    return { absoluteRoot: localCandidate, source: 'project' };
  }

  if (docsMirrorRoot) {
    const mirrorCandidate = path.join(docsMirrorRoot, normalizedPath);
    if (await pathExists(mirrorCandidate)) {
      return { absoluteRoot: mirrorCandidate, source: 'mirror' };
    }
  }

  if (!remote) {
    throw new Error(`Missing docs for ${locale}/${versionId} at ${localCandidate}. Provide local Markdown files or configure a remote source.`);
  }

  const cacheDestination = path.join(cacheRoot, locale, versionId);
  await mirrorRemoteVersion({ remote, versionPath: normalizedPath, destination: cacheDestination });
  return { absoluteRoot: cacheDestination, source: 'remote' };
}

async function walkDocs({ locale, versionId, versionPath, absoluteRoot }) {
  const tocChildren = [];
  const searchEntries = [];
  let docCount = 0;

  async function buildNode(dirPath, relativeDir) {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const folders = entries.filter((entry) => entry.isDirectory()).sort((a, b) => a.name.localeCompare(b.name));
    const files = entries.filter((entry) => entry.isFile() && markdownExtensionPattern.test(entry.name)).sort((a, b) => a.name.localeCompare(b.name));

    const children = [];

    for (const folder of folders) {
      const childRelativeDir = path.join(relativeDir, folder.name);
      const node = await buildNode(path.join(dirPath, folder.name), childRelativeDir);
      if (node.children.length > 0) {
        children.push({
          type: 'folder',
          name: folder.name,
          title: folder.name,
          path: childRelativeDir.replace(/\\/g, '/'),
          children: node.children
        });
      }
    }

    for (const file of files) {
      const relativeFilePath = path.join(relativeDir, file.name);
      const absoluteFilePath = path.join(dirPath, file.name);
      const { title, headings, excerpt } = await extractDocMeta(absoluteFilePath);
      const slug = toSlug(locale, versionId, relativeFilePath);
      const normalizedPath = relativeFilePath.replace(/\\/g, '/');

      children.push({
        type: 'doc',
        name: file.name,
        title,
        slug,
        path: normalizedPath,
        headings
      });

      searchEntries.push({
        title,
        slug,
        path: normalizedPath,
        headings,
        excerpt
      });

      await copyRawFile(absoluteFilePath, path.join(locale, versionId, normalizedPath));
      docCount += 1;
    }

    return { children };
  }

  const node = await buildNode(absoluteRoot, '');
  tocChildren.push(...node.children);

  return { toc: tocChildren, searchEntries, docCount };
}

async function cleanOutputRoots() {
  await fs.rm(manifestRoot, { recursive: true, force: true });
  await fs.rm(rawOutputRoot, { recursive: true, force: true });
  await ensureDir(manifestRoot);
  await ensureDir(rawOutputRoot);
  await ensureDir(cacheRoot);
}

function normalizeConfigRemote(remote) {
  if (!remote) {
    return null;
  }
  const required = ['repoOwner', 'repoName', 'repoBranch'];
  for (const field of required) {
    if (!remote[field]) {
      throw new Error(`Remote config missing required field "${field}".`);
    }
  }
  return {
    repoOwner: remote.repoOwner,
    repoName: remote.repoName,
    repoBranch: remote.repoBranch,
    baseDir: remote.baseDir ?? ''
  };
}

async function main() {
  if (!(await pathExists(versionsConfigPath))) {
    throw new Error(`Cannot find ${versionsConfigPath}. Please create versions.config.json first.`);
  }

  await cleanOutputRoots();
  const config = await readJson(versionsConfigPath);
  const remote = normalizeConfigRemote(config.remote ?? null);
  const versionsSummary = [];

  for (const localeConfig of config.locales) {
    const localeSummary = {
      locale: localeConfig.locale,
      label: localeConfig.label,
      cdnBaseUrl: localeConfig.cdnBaseUrl ?? null,
      versions: []
    };

    for (const version of localeConfig.versions) {
      const normalizedPath = normalizeVersionPath(version.path);
      const { absoluteRoot } = await resolveVersionRoot({
        locale: localeConfig.locale,
        versionId: version.id,
        versionPath: normalizedPath,
        remote
      });

      const { toc, searchEntries, docCount } = await walkDocs({
        locale: localeConfig.locale,
        versionId: version.id,
        versionPath: normalizedPath,
        absoluteRoot
      });

      const tocFileName = `toc-${localeConfig.locale}-${version.id}.json`;
      const searchFileName = `search-${localeConfig.locale}-${version.id}.json`;

      await fs.writeFile(path.join(manifestRoot, tocFileName), JSON.stringify({
        locale: localeConfig.locale,
        version: version.id,
        generatedAt: new Date().toISOString(),
        tree: toc
      }, null, 2));

      await fs.writeFile(path.join(manifestRoot, searchFileName), JSON.stringify({
        locale: localeConfig.locale,
        version: version.id,
        generatedAt: new Date().toISOString(),
        entries: searchEntries
      }, null, 2));

      localeSummary.versions.push({
        id: version.id,
        label: version.label,
        path: normalizedPath,
        isLatest: Boolean(version.isLatest),
        tocFile: tocFileName,
        searchFile: searchFileName,
        docCount
      });
    }

    versionsSummary.push(localeSummary);
  }

  await fs.writeFile(path.join(manifestRoot, 'versions.json'), JSON.stringify({
    generatedAt: new Date().toISOString(),
    defaultLocale: config.defaultLocale,
    locales: versionsSummary
  }, null, 2));

  console.log(`✔ Generated manifests for ${versionsSummary.length} locale(s)`);
}

main().catch((error) => {
  console.error('Failed to generate manifests:', error);
  process.exit(1);
});
