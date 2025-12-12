#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..', '..');
const docsRoot = path.join(projectRoot, 'docs');
const versionsConfigPath = path.join(docsRoot, 'versions.config.json');
const manifestRoot = path.join(__dirname, '..', 'public', 'manifest');
const rawOutputRoot = path.join(__dirname, '..', 'public', 'raw');

const headingPattern = /^#{1,6}\s+(.+)$/gm;
const textCleanupPattern = /[`*_>#\[\]!]/g;

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
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

async function walkDocs({ locale, versionId, versionPath }) {
  const absoluteVersionRoot = path.join(docsRoot, versionPath);
  const stack = [{ fullPath: absoluteVersionRoot, relativeDir: '' }];
  const tocChildren = [];
  const searchEntries = [];
  let docCount = 0;

  async function buildNode(dirPath, relativeDir) {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const folders = entries.filter((entry) => entry.isDirectory()).sort((a, b) => a.name.localeCompare(b.name));
    const files = entries.filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.md')).sort((a, b) => a.name.localeCompare(b.name));

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

  const node = await buildNode(absoluteVersionRoot, '');
  tocChildren.push(...node.children);

  return { toc: tocChildren, searchEntries, docCount };
}

async function cleanOutputRoots() {
  await fs.rm(manifestRoot, { recursive: true, force: true });
  await fs.rm(rawOutputRoot, { recursive: true, force: true });
  await ensureDir(manifestRoot);
  await ensureDir(rawOutputRoot);
}

async function main() {
  await cleanOutputRoots();
  const config = await readJson(versionsConfigPath);
  const versionsSummary = [];

  for (const localeConfig of config.locales) {
    const localeSummary = {
      locale: localeConfig.locale,
      label: localeConfig.label,
      cdnBaseUrl: localeConfig.cdnBaseUrl ?? null,
      versions: []
    };
    for (const version of localeConfig.versions) {
      const { toc, searchEntries, docCount } = await walkDocs({
        locale: localeConfig.locale,
        versionId: version.id,
        versionPath: version.path
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
        path: version.path,
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
