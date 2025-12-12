import type { TocDocNode } from '../types/docs';

type DocViewerProps = {
  documentNode?: TocDocNode | null;
  html?: string;
  origin?: string;
  isLoading: boolean;
  error?: string | null;
  onRetry: () => void;
};

export const DocViewer = ({ documentNode, html, origin, isLoading, error, onRetry }: DocViewerProps) => {
  if (isLoading) {
    return (
      <div className="flex min-h-96 items-center justify-center bg-white">
        <p className="text-sm text-slate-500">正在加载文档…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-96 flex-col items-center justify-center gap-3 bg-white p-10 text-center">
        <p className="text-base font-semibold text-rose-600">无法加载文档</p>
        <p className="text-sm text-slate-500">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-full bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-500"
        >
          重试
        </button>
      </div>
    );
  }

  if (!documentNode) {
    return (
      <div className="flex min-h-96 items-center justify-center bg-white">
        <p className="text-sm text-slate-500">请选择左侧的文章开始阅读。</p>
      </div>
    );
  }

  return (
    <article className="doc-viewer bg-white px-8 py-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-6">
        <div>
          <h2 className="text-3xl font-semibold text-slate-900">{documentNode.title}</h2>
        </div>
        {origin && (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">
            来源：{origin}
          </span>
        )}
      </div>

      <div className="prose prose-slate mt-6 max-w-none" dangerouslySetInnerHTML={{ __html: html ?? '' }} />
    </article>
  );
};
