import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import RecentActivity from '../components/RecentActivity';

const ActivityPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (user && !['admin', 'manager'].includes(user.role)) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  if (!['admin', 'manager'].includes(user?.role)) return null;

  return (
    <section className="py-2">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-brand-dark dark:text-white">Activity Log</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 truncate">
            All spare parts inventory changes
          </p>
        </div>
        <button
          type="button"
          onClick={() => setRefreshKey((k) => k + 1)}
          className="shrink-0 flex items-center gap-2 px-3 sm:px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition"
        >
          <RefreshIcon /> <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#141518] p-3 sm:p-4 shadow-sm">
        <RecentActivity refreshKey={refreshKey} limit={25} />
      </div>
    </section>
  );
};

const RefreshIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.433a.75.75 0 0 0 0-1.5H3.989a.75.75 0 0 0-.75.75v4.242a.75.75 0 0 0 1.5 0v-2.43l.31.31a7 7 0 0 0 11.712-3.138.75.75 0 0 0-1.449-.39Zm1.23-3.723a.75.75 0 0 0 .219-.53V2.929a.75.75 0 0 0-1.5 0V5.36l-.31-.31A7 7 0 0 0 3.239 8.188a.75.75 0 1 0 1.448.389A5.5 5.5 0 0 1 13.89 6.11l.311.31h-2.432a.75.75 0 0 0 0 1.5h4.243a.75.75 0 0 0 .53-.219Z" clipRule="evenodd" />
  </svg>
);

export default ActivityPage;
