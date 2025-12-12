import type { DocHeading } from '../types/docs';

type TocPanelProps = {
  headings: DocHeading[];
  locale?: string;
};

const indentClass = (level: number) => {
  if (level <= 2) return 'pl-0';
  if (level === 3) return 'pl-4';
  if (level === 4) return 'pl-8';
  return 'pl-10';
};

const i18n = {
  zh: { title: '本页目录', empty: '此文档暂无标题。' },
  en: { title: 'On This Page', empty: 'No headings in this document.' }
};

export const TocPanel = ({ headings, locale = 'zh' }: TocPanelProps) => {
  const t = i18n[locale as keyof typeof i18n] ?? i18n.zh;

  return (
    <aside className="toc-scrollbar sticky top-0 min-h-[calc(100vh-4.5rem)] max-h-[calc(100vh-4.5rem)] overflow-y-auto bg-white px-4 py-4 text-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t.title}</p>
      {headings.length === 0 ? (
        <p className="mt-4 text-xs text-slate-400">{t.empty}</p>
      ) : (
        <ul className="mt-4 space-y-1">
          {headings.map((heading) => (
            <li key={heading.id} className={indentClass(heading.level)}>
              <a
                href={`#${heading.id}`}
                className="block rounded px-2 py-1 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
              >
                {heading.title}
              </a>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
};
