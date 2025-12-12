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

export type LocaleConfig = {
  locale: string;
  label: string;
  cdnBaseUrl?: string | null;
  path: string;
  tocFile: string;
  searchFile: string;
  docCount: number;
};

export type DocsManifest = {
  generatedAt: string;
  defaultLocale: string;
  locales: LocaleConfig[];
};

export type DocHeading = {
  id: string;
  title: string;
  level: number;
};
