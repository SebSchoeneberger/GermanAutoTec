/**
 * Removable chips for active search / filters — sits under the toolbar.
 */
const ActiveFilterPills = ({ pills, onClearAll }) => {
  if (!pills.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-100/80 dark:border-white/5">
      <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">Active</span>
      {pills.map((p) => (
        <button
          key={p.key}
          type="button"
          onClick={p.onRemove}
          className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full text-xs font-medium bg-brand-dark/10 dark:bg-white/10 text-brand-dark dark:text-gray-200 border border-brand-dark/15 dark:border-white/10 hover:bg-brand-dark/15 dark:hover:bg-white/15 transition"
        >
          <span className="max-w-[180px] sm:max-w-[240px] truncate">{p.label}</span>
          <span className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white" aria-hidden>×</span>
        </button>
      ))}
      <button
        type="button"
        onClick={onClearAll}
        className="text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition ml-1"
      >
        Clear all
      </button>
    </div>
  );
};

export default ActiveFilterPills;
