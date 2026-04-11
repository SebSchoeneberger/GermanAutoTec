import { useState, useEffect } from 'react';
import { getActivity } from '../../services/sparePartsApi';
import { ACTIVITY_STYLES } from '../../utils/sparePartsUtils';

const DEFAULT_LIMIT = 20;

const formatTimeAgo = (dateStr) => {
  const diff  = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);

  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7)   return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
};

const buildDescription = (activity) => {
  const { action, partName, quantityChanged, performedByName } = activity;
  const by = performedByName ? ` by ${performedByName}` : '';

  if (action === 'sold')      return `${Math.abs(quantityChanged)} × "${partName}" sold${by}`;
  if (action === 'restocked') return `${Math.abs(quantityChanged)} × "${partName}" restocked${by}`;
  if (action === 'created')   return `"${partName}" added to inventory${by}`;
  if (action === 'edited')    return `"${partName}" updated${by}`;
  if (action === 'deleted')   return `"${partName}" removed from inventory${by}`;
  return partName;
};

const RecentActivity = ({ refreshKey = 0, limit = DEFAULT_LIMIT }) => {
  const [activities, setActivities] = useState([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [isLoading, setIsLoading]   = useState(true);

  useEffect(() => {
    setPage(1);
  }, [refreshKey]);

  useEffect(() => {
    const fetch = async () => {
      setIsLoading(true);
      try {
        const res = await getActivity({ page, limit });
        setActivities(res.data.data);
        setTotal(res.data.total);
      } catch {
        // silently fail — activity log is non-critical
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, [page, limit, refreshKey]);

  const totalPages = Math.ceil(total / limit);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-6 h-6 border-4 border-brand-dark/20 border-t-brand-dark dark:border-white/10 dark:border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (activities.length === 0) {
    return <p className="text-sm text-gray-400 dark:text-gray-500 py-10 text-center">No activity yet</p>;
  }

  return (
    <div>
      <ul className="space-y-1">
        {activities.map((activity) => {
          const style = ACTIVITY_STYLES[activity.action] ?? ACTIVITY_STYLES.edited;
          return (
            <li
              key={activity._id}
              className="flex items-start gap-2 sm:gap-3 px-2 sm:px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${style.dot}`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-snug">
                  <span className="font-medium text-gray-900 dark:text-white">{style.label}</span>
                  {' — '}
                  {buildDescription(activity)}
                </p>
                <span className="text-xs text-gray-400 dark:text-gray-500 sm:hidden mt-0.5 block">
                  {formatTimeAgo(activity.createdAt)}
                </span>
              </div>
              <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0 mt-0.5 hidden sm:block">
                {formatTimeAgo(activity.createdAt)}
              </span>
            </li>
          );
        })}
      </ul>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-white/5">
          <button
            type="button"
            onClick={() => setPage((p) => p - 1)}
            disabled={page === 1}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            ← Newer
          </button>
          <span className="text-xs text-gray-400 dark:text-gray-500">{page} / {totalPages}</span>
          <button
            type="button"
            onClick={() => setPage((p) => p + 1)}
            disabled={page === totalPages}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Older →
          </button>
        </div>
      )}
    </div>
  );
};

export default RecentActivity;
