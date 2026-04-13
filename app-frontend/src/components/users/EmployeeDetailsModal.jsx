import { getCloudinaryUrl } from '../../utils/imageUtils';
import { ROLE_LABELS, ROLE_COLORS, avatarColor, getInitials } from '../../utils/userUtils';

const InfoRow = ({ label, value }) =>
  value ? (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-gray-100 dark:border-white/5 last:border-0">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 shrink-0 pt-0.5">{label}</p>
      <p className="text-sm font-medium text-gray-900 dark:text-white text-right">{value}</p>
    </div>
  ) : null;

const EmployeeDetailsModal = ({ user, onClose }) => {
  if (!user) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 dark:bg-black/70 z-50 p-4">
      <div className="bg-white dark:bg-[#141518] text-gray-900 dark:text-gray-100 rounded-2xl shadow-xl border border-gray-200 dark:border-white/10 max-w-sm w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">Employee details</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 transition"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Avatar + name */}
        <div className="flex flex-col items-center pb-5 px-5">
          <div className="w-20 h-20 rounded-2xl overflow-hidden mb-3 shrink-0">
            {user.profilePicture ? (
              <img
                src={getCloudinaryUrl(user.profilePicture, { width: 160, height: 160, crop: 'fill' })}
                alt={`${user.firstName} ${user.lastName}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className={`w-full h-full flex items-center justify-center text-white font-bold text-2xl ${avatarColor(user._id)}`}>
                {getInitials(user)}
              </div>
            )}
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {user.firstName} {user.lastName}
          </h3>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap justify-center">
            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${ROLE_COLORS[user.role] || ROLE_COLORS.user}`}>
              {ROLE_LABELS[user.role] || user.role}
            </span>
            {user.mustChangePassword && (
              <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                Setup pending
              </span>
            )}
          </div>
        </div>

        {/* Info rows */}
        <div className="px-5 pb-5 border-t border-gray-100 dark:border-white/5 pt-4">
          <InfoRow label="Email" value={user.email} />
          <InfoRow label="Phone" value={user.phone} />
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetailsModal;
