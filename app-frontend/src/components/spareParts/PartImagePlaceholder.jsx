/** Outline cube — matches Heroicons-style 3D box */
const CubeIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.25} stroke="currentColor" className={className} aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5v9l9 5.25m0-9v9" />
  </svg>
);

/** Grey 2:1 strip for list cards when no photo — same footprint as the image hero. */
export const PartImagePlaceholderCard = () => (
  <div
    className="aspect-[2/1] relative bg-gray-100 dark:bg-white/[0.06] border-b border-gray-100/80 dark:border-white/5 flex items-center justify-center pointer-events-none"
    aria-hidden
  >
    <CubeIcon className="w-11 h-11 sm:w-12 sm:h-12 text-gray-300 dark:text-gray-600" />
  </div>
);

/** Same visual language in the detail modal */
export const PartImagePlaceholderDetail = () => (
  <div className="px-4 sm:px-5 pt-4">
    <div
      className="w-full rounded-xl border border-gray-100 dark:border-white/10 bg-gray-100 dark:bg-white/[0.06] flex items-center justify-center aspect-[2/1] max-h-[min(60vh,28rem)] min-h-[8rem]"
      aria-hidden
    >
      <CubeIcon className="w-14 h-14 sm:w-16 sm:h-16 text-gray-300 dark:text-gray-600" />
    </div>
    <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-1.5">No photo</p>
  </div>
);
