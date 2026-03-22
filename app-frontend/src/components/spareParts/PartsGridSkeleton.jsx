/** Placeholder cards while the parts list is loading — matches the image-on-top card layout. */
const SkeletonCard = () => (
  <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#141518] shadow-sm overflow-hidden animate-pulse">
    <div className="aspect-[2/1] bg-gray-200 dark:bg-white/10" />
    <div className="p-5 flex flex-col gap-3">
      <div className="flex justify-between gap-2">
        <div className="flex-1 space-y-2 min-w-0">
          <div className="h-4 bg-gray-200 dark:bg-white/10 rounded w-3/4" />
          <div className="h-3 bg-gray-100 dark:bg-white/5 rounded w-1/2" />
        </div>
        <div className="h-5 w-14 bg-gray-100 dark:bg-white/5 rounded-full shrink-0" />
      </div>
      <div className="h-3 bg-gray-100 dark:bg-white/5 rounded w-2/3" />
      <div className="flex justify-between pt-3 mt-auto border-t border-gray-100 dark:border-white/5">
        <div className="h-5 w-16 bg-gray-100 dark:bg-white/5 rounded-full" />
        <div className="h-6 w-14 bg-gray-100 dark:bg-white/5 rounded" />
      </div>
    </div>
  </div>
);

const PartsGridSkeleton = ({ count = 8 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    {Array.from({ length: count }, (_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

export default PartsGridSkeleton;
