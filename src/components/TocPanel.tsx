import type { DocHeading } from '../types/docs';

type TocPanelProps = {
  headings: DocHeading[];
};

const indentClass = (level: number) => {
  if (level <= 2) return 'pl-0';
  if (level === 3) return 'pl-4';
  if (level === 4) return 'pl-8';
  return 'pl-10';
};

export const TocPanel = ({ headings }: TocPanelProps) => (
  <aside className="toc-scrollbar h-full overflow-y-auto rounded-2xl border border-slate-200 bg-white px-5 py-6 text-sm">
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">本页目录</p>
    {headings.length === 0 ? (
      <p className="mt-4 text-xs text-slate-400">此文档暂无标题。</p>
    ) : (
      <ul className="mt-4 space-y-2">
        {headings.map((heading) => (
          <li key={heading.id} className={indentClass(heading.level)}>
            <a
              href={`#${heading.id}`}
              className="block rounded px-2 py-1 text-slate-600 hover:bg-slate-100"
            >
              {heading.title}
            </a>
          </li>
        ))}
      </ul>
    )}
  </aside>
);
