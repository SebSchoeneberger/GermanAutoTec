function DashboardCard({ title, icon, description, onClick }) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#141518] p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow flex sm:flex-col items-center sm:items-center gap-4 sm:gap-0 sm:text-center">
      <div className="text-brand-dark dark:text-brand-muted shrink-0 sm:mb-4 [&>svg]:w-8 [&>svg]:h-8 sm:[&>svg]:w-10 sm:[&>svg]:h-10">
        {icon}
      </div>
      <div className="flex-1 min-w-0 sm:flex-initial">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        <p className="mt-1 sm:mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{description}</p>
        <button
          type="button"
          onClick={onClick}
          disabled={!onClick}
          className="mt-3 sm:mt-4 px-4 py-2 sm:py-2.5 text-sm font-medium text-white bg-brand-dark hover:bg-[#2a3640] rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-brand-dark/50 focus:ring-offset-2 dark:focus:ring-offset-[#0a0a0b] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Open
        </button>
      </div>
    </div>
  );
}

export default DashboardCard;
