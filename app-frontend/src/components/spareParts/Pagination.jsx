const getPageNumbers = (current, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const left  = Math.max(2, current - 1);
  const right = Math.min(total - 1, current + 1);
  const pages = [1];

  if (left > 2) pages.push('...');
  for (let i = left; i <= right; i++) pages.push(i);
  if (right < total - 1) pages.push('...');
  pages.push(total);

  return pages;
};

const PageBtn = ({ onClick, disabled, active, children }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`min-w-[2.25rem] h-9 px-2 text-sm rounded-lg border transition
      disabled:opacity-40 disabled:cursor-not-allowed
      ${active
        ? 'bg-brand-dark text-white border-brand-dark dark:bg-white dark:text-brand-dark dark:border-white font-semibold'
        : 'border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 bg-white dark:bg-transparent'
      }`}
  >
    {children}
  </button>
);

const Pagination = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const pages = getPageNumbers(page, totalPages);

  return (
    <div className="flex justify-center items-center gap-1 mt-8 flex-wrap">
      <PageBtn onClick={() => onPageChange(page - 1)} disabled={page === 1}>← Prev</PageBtn>

      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`ellipsis-${i}`} className="px-1 text-gray-400 dark:text-gray-600 select-none">…</span>
        ) : (
          <PageBtn key={p} onClick={() => onPageChange(p)} active={p === page}>{p}</PageBtn>
        )
      )}

      <PageBtn onClick={() => onPageChange(page + 1)} disabled={page === totalPages}>Next →</PageBtn>
    </div>
  );
};

export default Pagination;
