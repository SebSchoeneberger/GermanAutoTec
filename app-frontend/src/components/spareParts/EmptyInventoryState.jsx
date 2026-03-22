/**
 * Shown when the inventory is completely empty (no filters) — encourages managers to add the first part.
 */
const EmptyInventoryState = ({ onAddPart }) => (
  <div className="text-center py-20 px-4 rounded-2xl border border-dashed border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02]">
    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-dark/10 dark:bg-white/10 text-brand-dark dark:text-white mb-4">
      <BoxIcon className="w-7 h-7" />
    </div>
    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Your inventory is empty</h2>
    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
      Add your first spare part to start tracking stock, photos, and compatibility.
    </p>
    <button
      type="button"
      onClick={onAddPart}
      className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-brand-dark hover:bg-[#2a3640] rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-brand-dark/50 focus:ring-offset-2 dark:focus:ring-offset-[#0a0a0b]"
    >
      <span className="text-base leading-none">+</span>
      Add your first part
    </button>
  </div>
);

const BoxIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5v9l9 5.25M3 7.5l9 5.25m0-9v9" />
  </svg>
);

export default EmptyInventoryState;
