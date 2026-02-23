/**
 * Skeleton shaped like the About section, shown while lazy-loaded sections load.
 */
export default function SectionSkeleton() {
  return (
    <div
      className="py-12 sm:py-16 lg:py-20 bg-gray-50 dark:bg-white/[0.02] overflow-hidden"
      aria-hidden
    >
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Section header – matches About "About us" / "Expertise you can trust" */}
        <div className="text-center max-w-3xl mx-auto mb-12 lg:mb-14">
          <div className="h-3 w-20 mx-auto rounded-full bg-gray-200 dark:bg-white/10 animate-pulse" />
          <div className="h-9 sm:h-10 lg:h-12 w-56 sm:w-64 mx-auto mt-3 rounded-lg bg-gray-200 dark:bg-white/10 animate-pulse" />
          <div className="h-5 w-full max-w-md mx-auto mt-4 rounded bg-gray-200/80 dark:bg-white/5 animate-pulse" />
        </div>

        {/* Two-column block – image left, text + pills right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 lg:gap-x-20 gap-y-8 lg:gap-y-10 items-start">
          <div className="w-full max-w-lg mx-auto lg:mx-0 lg:max-w-none">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden ring-1 ring-gray-200/50 dark:ring-white/10 bg-gray-200 dark:bg-white/10 animate-pulse" />
          </div>
          <div className="space-y-5 text-center lg:text-left">
            <div className="h-4 w-full rounded bg-gray-200/80 dark:bg-white/5 animate-pulse" />
            <div className="h-4 w-full rounded bg-gray-200/80 dark:bg-white/5 animate-pulse" />
            <div className="h-4 w-[90%] rounded bg-gray-200/80 dark:bg-white/5 animate-pulse" />
            <div className="h-4 w-full rounded bg-gray-200/80 dark:bg-white/5 animate-pulse" />
            <div className="h-4 w-4/5 rounded bg-gray-200/80 dark:bg-white/5 animate-pulse" />
            <div className="flex flex-wrap gap-3 justify-center lg:justify-start pt-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-9 w-28 rounded-full bg-gray-200 dark:bg-white/10 animate-pulse"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Founders subsection – heading + 3 portrait cards */}
        <div className="mt-16 lg:mt-20">
          <div className="text-center lg:text-left mb-8 lg:mb-10">
            <div className="h-8 w-32 mx-auto lg:mx-0 rounded-lg bg-gray-200 dark:bg-white/10 animate-pulse" />
            <div className="h-5 w-full max-w-xl mt-3 rounded bg-gray-200/80 dark:bg-white/5 animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-2xl overflow-hidden bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 shadow-lg shadow-gray-200/50 dark:shadow-none"
              >
                <div className="aspect-[4/5] bg-gray-200 dark:bg-white/10 animate-pulse" />
                <div className="p-5 sm:p-6 flex flex-col">
                  <div className="h-6 w-2/3 rounded bg-gray-200 dark:bg-white/10 animate-pulse" />
                  <div className="h-4 w-1/2 mt-2 rounded bg-gray-100 dark:bg-white/5 animate-pulse" />
                  <div className="mt-3 space-y-2">
                    <div className="h-3 w-full rounded bg-gray-100 dark:bg-white/5 animate-pulse" />
                    <div className="h-3 w-full rounded bg-gray-100 dark:bg-white/5 animate-pulse" />
                    <div className="h-3 w-4/5 rounded bg-gray-100 dark:bg-white/5 animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
