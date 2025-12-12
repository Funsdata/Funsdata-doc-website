import { useMemo, useState } from 'react';
import Fuse from 'fuse.js';
import type { IFuseOptions } from 'fuse.js';
import type { SearchEntry } from '../types/docs';

const fuseOptions: IFuseOptions<SearchEntry> = {
  keys: ['title', 'headings', 'excerpt'],
  threshold: 0.35,
  minMatchCharLength: 2
};

type SearchModalProps = {
  entries: SearchEntry[];
  onClose: () => void;
  onSelect: (entry: SearchEntry) => void;
};

export const SearchModal = ({ entries, onClose, onSelect }: SearchModalProps) => {
  const [query, setQuery] = useState('');
  const fuse = useMemo(() => new Fuse(entries, fuseOptions), [entries]);

  const results = query.trim() ? fuse.search(query).slice(0, 8).map((result) => result.item) : entries.slice(0, 8);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 px-4 py-10">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center gap-3">
          <input
            autoFocus
            placeholder="搜索标题、段落、关键字…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base focus:border-primary-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-500 hover:border-slate-300"
          >
            Esc
          </button>
        </div>

        <div className="mt-6 max-h-96 overflow-y-auto">
          {results.length === 0 ? (
            <p className="text-sm text-slate-400">没有匹配的结果。</p>
          ) : (
            <ul className="space-y-2">
              {results.map((entry) => (
                <li key={entry.slug}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(entry);
                      onClose();
                    }}
                    className="w-full rounded-xl border border-transparent px-4 py-3 text-left hover:border-primary-100 hover:bg-primary-50"
                  >
                    <p className="text-sm font-semibold text-slate-800">{entry.title}</p>
                    <p className="text-xs text-slate-500">
                      {entry.excerpt}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};
