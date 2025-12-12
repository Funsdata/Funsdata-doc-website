import type { TocDocNode, TocNode } from '../types/docs';

type SidebarProps = {
  tree: TocNode[];
  selectedSlug?: string;
  onSelect: (node: TocDocNode) => void;
};

const Node = ({ node, depth, selectedSlug, onSelect }: { node: TocNode; depth: number; selectedSlug?: string; onSelect: (node: TocDocNode) => void }) => {
  if (node.type === 'folder') {
    return (
      <div className="space-y-1">
        <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
          {node.title}
        </p>
        <div className="pl-2">
          {node.children.map((child) => (
            <Node key={child.type === 'doc' ? child.slug : child.path} node={child} depth={depth + 1} selectedSlug={selectedSlug} onSelect={onSelect} />
          ))}
        </div>
      </div>
    );
  }

  const isActive = node.slug === selectedSlug;

  return (
    <button
      type="button"
      onClick={() => onSelect(node)}
      className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
        isActive
          ? 'bg-primary-50 font-semibold text-primary-700'
          : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      {node.title}
    </button>
  );
};

export const Sidebar = ({ tree, selectedSlug, onSelect }: SidebarProps) => (
  <nav className="sidebar-scrollbar h-full overflow-y-auto pr-2">
    {tree.length === 0 && (
      <p className="text-sm text-slate-400">当前版本暂无文档。</p>
    )}
    {tree.map((node) => (
      <Node key={node.type === 'doc' ? node.slug : node.path} node={node} depth={0} selectedSlug={selectedSlug} onSelect={onSelect} />
    ))}
  </nav>
);
