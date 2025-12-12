import type { LocaleConfig } from '../types/docs';

type HeaderProps = {
  locales: LocaleConfig[];
  currentLocale?: string;
  onLocaleChange: (locale: string) => void;
  onOpenSearch: () => void;
};

export const Header = ({
  locales,
  currentLocale,
  onLocaleChange,
  onOpenSearch
}: HeaderProps) => {
  const activeLocale = locales.find((locale) => locale.locale === currentLocale) ?? locales[0];

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
      <div>
        <p className="text-xs uppercase tracking-widest text-slate-400">Funsdata</p>
        <h1 className="text-xl font-semibold text-slate-900">知识库与帮助中心</h1>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-primary-500 hover:text-primary-600"
          onClick={onOpenSearch}
        >
          <span className="hidden sm:inline">搜索文档</span>
          <span className="inline sm:hidden">搜索</span>
          <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">⌘K</span>
        </button>

        <select
          className="rounded border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none"
          value={activeLocale?.locale ?? ''}
          onChange={(event) => onLocaleChange(event.target.value)}
        >
          {locales.map((locale) => (
            <option key={locale.locale} value={locale.locale}>
              {locale.label}
            </option>
          ))}
        </select>
      </div>
    </header>
  );
};
