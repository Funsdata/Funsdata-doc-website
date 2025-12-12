import { useState, useRef, useEffect } from 'react';
import type { LocaleConfig } from '../types/docs';

const i18n = {
  zh: {
    title: 'Funsdata BI 文档中心',
    search: '搜索文档',
    searchShort: '搜索'
  },
  en: {
    title: 'Funsdata BI Docs',
    search: 'Search Docs',
    searchShort: 'Search'
  }
};

const localeLabels: Record<string, string> = {
  zh: '简体中文',
  en: 'English'
};

const GlobeIcon = () => (
  <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
  </svg>
);

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
  const [isLocaleOpen, setIsLocaleOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const activeLocale = locales.find((locale) => locale.locale === currentLocale) ?? locales[0];
  const t = i18n[currentLocale as keyof typeof i18n] ?? i18n.zh;

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsLocaleOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLocaleSelect = (locale: string) => {
    onLocaleChange(locale);
    setIsLocaleOpen(false);
  };

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
      <div>
        <h1 className="text-xl uppercase font-semibold text-slate-900">{t.title}</h1>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-primary-500 hover:text-primary-600"
          onClick={onOpenSearch}
        >
          <span className="hidden sm:inline">{t.search}</span>
          <span className="inline sm:hidden">{t.searchShort}</span>
          <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">⌘K</span>
        </button>

        {/* 自定义语言选择器 */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsLocaleOpen(!isLocaleOpen)}
            className="inline-flex w-[140px] items-center justify-between gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
          >
            <GlobeIcon />
            <span className="flex-1 text-left">{localeLabels[activeLocale?.locale ?? 'zh']}</span>
            <svg
              className={`h-4 w-4 text-slate-400 transition-transform ${isLocaleOpen ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isLocaleOpen && (
            <div className="absolute right-0 top-full z-50 mt-1 w-[140px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
              {locales.map((locale) => (
                <button
                  key={locale.locale}
                  type="button"
                  onClick={() => handleLocaleSelect(locale.locale)}
                  className={`flex w-full items-center justify-between px-3 py-2.5 text-left text-sm transition hover:bg-slate-50 ${
                    locale.locale === currentLocale
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-slate-700'
                  }`}
                >
                  <span>{localeLabels[locale.locale]}</span>
                  {locale.locale === currentLocale && (
                    <svg className="h-4 w-4 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
