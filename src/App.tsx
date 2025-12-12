import { useEffect, useMemo, useState } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DocViewer } from './components/DocViewer';
import { TocPanel } from './components/TocPanel';
import { SearchModal } from './components/SearchModal';
import { manifestEndpoints } from './config/docs';
import type { DocHeading, DocsManifest, LocaleConfig, SearchEntry, TocDocNode, TocNode } from './types/docs';
import { findDocBySlug, findFirstDoc } from './lib/tree';
import { fetchDocMarkdown, getDocBaseUrl } from './lib/docFetcher';
import { renderMarkdown } from './lib/markdown';
import { useKeyboardShortcut } from './hooks/useKeyboardShortcut';

function App() {
  const [manifest, setManifest] = useState<DocsManifest | null>(null);
  const [toc, setToc] = useState<TocNode[]>([]);
  const [searchEntries, setSearchEntries] = useState<SearchEntry[]>([]);
  const [currentLocale, setCurrentLocale] = useState<string>();
  const [selectedSlug, setSelectedSlug] = useState<string>();
  const [docHtml, setDocHtml] = useState('');
  const [docHeadings, setDocHeadings] = useState<DocHeading[]>([]);
  const [docLoading, setDocLoading] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);
  const [docReloadKey, setDocReloadKey] = useState(0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [manifestError, setManifestError] = useState<string | null>(null);

  useKeyboardShortcut(['mod', 'k'], () => setIsSearchOpen(true));
  useKeyboardShortcut(['escape'], () => setIsSearchOpen(false));

  // 加载 manifest
  useEffect(() => {
    const loadManifest = async () => {
      try {
        setManifestError(null);
        const response = await fetch(manifestEndpoints.manifest, { cache: 'no-cache' });
        if (!response.ok) {
          throw new Error('无法加载文档清单');
        }
        const data = (await response.json()) as DocsManifest;
        setManifest(data);
      } catch (error) {
        setManifestError(error instanceof Error ? error.message : '加载文档信息失败');
      }
    };

    loadManifest();
  }, []);

  // 设置默认语言
  useEffect(() => {
    if (!manifest || currentLocale) {
      return;
    }
    const defaultLocale =
      manifest.locales.find((item) => item.locale === manifest.defaultLocale) ?? manifest.locales[0];
    if (defaultLocale) {
      setCurrentLocale(defaultLocale.locale);
    }
  }, [manifest, currentLocale]);

  // 获取当前语言配置
  const currentLocaleConfig: LocaleConfig | undefined = useMemo(() => {
    if (!manifest || !currentLocale) return undefined;
    return manifest.locales.find((item) => item.locale === currentLocale);
  }, [manifest, currentLocale]);

  // 加载 TOC 和搜索索引
  useEffect(() => {
    const loadLocaleData = async () => {
      if (!currentLocaleConfig) {
        return;
      }

      try {
        setManifestError(null);
        const [tocResponse, searchResponse] = await Promise.all([
          fetch(`/manifest/${currentLocaleConfig.tocFile}`, { cache: 'no-cache' }),
          fetch(`/manifest/${currentLocaleConfig.searchFile}`, { cache: 'no-cache' })
        ]);

        if (!tocResponse.ok || !searchResponse.ok) {
          throw new Error('无法加载目录或搜索索引');
        }

        const tocJson = await tocResponse.json();
        const searchJson = await searchResponse.json();
        setToc(tocJson.tree as TocNode[]);
        setSearchEntries(searchJson.entries as SearchEntry[]);
        setManifestError(null);
      } catch (error) {
        setManifestError(error instanceof Error ? error.message : '加载目录失败');
      }
    };

    loadLocaleData();
  }, [currentLocaleConfig]);

  // 自动选择第一个文档
  useEffect(() => {
    if (toc.length === 0) {
      setSelectedSlug(undefined);
      return;
    }
    setSelectedSlug((previousSlug) => {
      if (previousSlug) {
        const existing = findDocBySlug(toc, previousSlug);
        if (existing) {
          return previousSlug;
        }
      }
      return findFirstDoc(toc)?.slug;
    });
  }, [toc]);

  // 加载文档内容
  useEffect(() => {
    const fetchDocument = async () => {
      if (!currentLocaleConfig || !selectedSlug) {
        return;
      }
      const node = findDocBySlug(toc, selectedSlug);
      if (!node) {
        return;
      }

      try {
        setDocLoading(true);
        setDocError(null);
        const fetchParams = {
          localePath: currentLocaleConfig.path,
          relativePath: node.path,
          localeCdnBase: currentLocaleConfig.cdnBaseUrl ?? undefined
        };
        const { markdown } = await fetchDocMarkdown(fetchParams);
        const baseUrl = getDocBaseUrl(fetchParams);
        const rendered = renderMarkdown(markdown, {
          baseUrl,
          docPath: node.path
        });
        setDocHtml(rendered.html);
        setDocHeadings(rendered.headings);
      } catch (error) {
        setDocError(error instanceof Error ? error.message : '文档加载失败');
      } finally {
        setDocLoading(false);
      }
    };

    fetchDocument();
  }, [currentLocaleConfig, selectedSlug, docReloadKey, toc]);

  const selectedDocNode: TocDocNode | null = useMemo(() => {
    if (!selectedSlug) return null;
    return findDocBySlug(toc, selectedSlug);
  }, [toc, selectedSlug]);

  const localeList = manifest?.locales ?? [];

  const handleRetry = () => setDocReloadKey((value) => value + 1);

  return (
    <div className="flex h-full flex-col bg-slate-50 text-slate-900">
      <Header
        locales={localeList}
        currentLocale={currentLocale}
        onLocaleChange={setCurrentLocale}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {manifestError && (
        <div className="bg-rose-50 px-6 py-3 text-sm text-rose-600">{manifestError}</div>
      )}

      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 items-start lg:grid-cols-[260px_minmax(0,1fr)_220px]">
          <div className="sticky top-0 min-h-[calc(100vh-4.5rem)] max-h-[calc(100vh-4.5rem)] overflow-y-auto border-r border-slate-200 bg-white px-4 py-4">
            <Sidebar tree={toc} selectedSlug={selectedSlug} onSelect={(node) => setSelectedSlug(node.slug)} />
          </div>

          <DocViewer
            documentNode={selectedDocNode}
            html={docHtml}
            isLoading={docLoading}
            error={docError}
            onRetry={handleRetry}
          />

          <TocPanel headings={docHeadings} locale={currentLocale} />
        </div>
      </div>

      {isSearchOpen && (
        <SearchModal
          entries={searchEntries}
          locale={currentLocale}
          onClose={() => setIsSearchOpen(false)}
          onSelect={(entry) => setSelectedSlug(entry.slug)}
        />
      )}
    </div>
  );
}

export default App;
