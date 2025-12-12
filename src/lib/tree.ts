import type { TocDocNode, TocNode } from '../types/docs';

export const findFirstDoc = (nodes: TocNode[]): TocDocNode | null => {
  for (const node of nodes) {
    if (node.type === 'doc') {
      return node;
    }
    const child = findFirstDoc(node.children);
    if (child) {
      return child;
    }
  }
  return null;
};

export const findDocBySlug = (nodes: TocNode[], slug: string): TocDocNode | null => {
  for (const node of nodes) {
    if (node.type === 'doc' && node.slug === slug) {
      return node;
    }
    if (node.type === 'folder') {
      const child = findDocBySlug(node.children, slug);
      if (child) {
        return child;
      }
    }
  }
  return null;
};

export const flattenDocs = (nodes: TocNode[]): TocDocNode[] => {
  const docs: TocDocNode[] = [];
  for (const node of nodes) {
    if (node.type === 'doc') {
      docs.push(node);
    } else {
      docs.push(...flattenDocs(node.children));
    }
  }
  return docs;
};
