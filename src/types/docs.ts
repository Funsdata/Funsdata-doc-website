export type TocDocNode = {
  type: 'doc';
  name: string;
  title: string;
  slug: string;
  path: string;
  headings: string[];
};

export type TocFolderNode = {
  type: 'folder';
  name: string;
  title: string;
  path: string;
  children: TocNode[];
};

export type TocNode = TocDocNode | TocFolderNode;

export type SearchEntry = {
  title: string;
  slug: string;
  path: string;
  headings: string[];
  excerpt: string;
};

export type VersionsManifest = {
  generatedAt: string;
  defaultLocale: string;
  locales: Array<{
    locale: string;
    label: string;
    cdnBaseUrl?: string | null;
    versions: Array<{
      id: string;
      label: string;
      path: string;
      isLatest: boolean;
      tocFile: string;
      searchFile: string;
      docCount: number;
    }>;
  }>;
};

export type DocHeading = {
  id: string;
  title: string;
  level: number;
};

export type LoadedDoc = {
  slug: string;
  markdown: string;
  html: string;
  headings: DocHeading[];
  origin: string;
};
