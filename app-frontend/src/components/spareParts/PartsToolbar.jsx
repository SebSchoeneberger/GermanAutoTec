import { CATEGORIES, SORT_OPTIONS } from '../../utils/sparePartsUtils';

const SearchIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
  </svg>
);

const selectClass =
  'px-3 py-2 border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-dark/40 dark:focus:ring-white/20 transition text-sm';

const inputClass =
  'w-full pl-10 pr-9 py-2 border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-dark/40 dark:focus:ring-white/20 transition text-sm';

/**
 * Search, category, sort, and optional engine/transmission filters for the spare parts list.
 */
const PartsToolbar = ({
  searchInput,
  onSearchChange,
  onClearSearch,
  category,
  onCategoryChange,
  selectedSortIndex,
  onSortChange,
  compatEngine,
  compatTransmission,
  onCompatEngineChange,
  onCompatTransmissionChange,
  onClearCompatFilters,
  engineOptions,
  transmissionOptions,
}) => {
  return (
    <>
      {/* Search bar */}
      <div className="relative mb-3">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by name, part number, or brand…"
          className={inputClass}
        />
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        {searchInput && (
          <button
            type="button"
            onClick={onClearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-sm"
          >
            ✕
          </button>
        )}
      </div>

      {/* All filters + sort in one row — 2-col grid on mobile, inline on sm+ */}
      <div className="grid grid-cols-2 sm:flex gap-3 items-center">
        <select value={category} onChange={onCategoryChange} className={`${selectClass} w-full sm:w-auto`}>
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select value={selectedSortIndex >= 0 ? selectedSortIndex : 0} onChange={onSortChange} className={`${selectClass} w-full sm:w-auto`}>
          {SORT_OPTIONS.map((opt, i) => (
            <option key={i} value={i}>{opt.label}</option>
          ))}
        </select>

        {engineOptions.length > 0 && (
          <select value={compatEngine} onChange={onCompatEngineChange} className={`${selectClass} w-full sm:w-auto`}>
            <option value="">All Engines</option>
            {engineOptions.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        )}

        {transmissionOptions.length > 0 && (
          <select value={compatTransmission} onChange={onCompatTransmissionChange} className={`${selectClass} w-full sm:w-auto`}>
            <option value="">All Transmissions</option>
            {transmissionOptions.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        )}

        {(compatEngine || compatTransmission) && (
          <button
            type="button"
            onClick={onClearCompatFilters}
            className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition col-span-2 sm:col-span-1"
          >
            Clear ✕
          </button>
        )}
      </div>
    </>
  );
};

export default PartsToolbar;
