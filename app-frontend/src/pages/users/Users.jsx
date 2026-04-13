import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../hooks/useAuth';
import { getAllUsers } from '../../services/userApi';
import { getCloudinaryUrl } from '../../utils/imageUtils';
import { ROLE_LABELS, ROLE_COLORS, avatarColor, getInitials } from '../../utils/userUtils';
import CreateUserModal from '../../components/users/CreateUserModal';
import EditUserModal from '../../components/users/EditUserModal';
import DeleteConfirmModal from '../../components/users/DeleteConfirmModal';
import ResetPasswordModal from '../../components/users/ResetPasswordModal';
import EmployeeDetailsModal from '../../components/users/EmployeeDetailsModal';

const Users = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [resetTarget, setResetTarget] = useState(null);
  const [detailsTarget, setDetailsTarget] = useState(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await getAllUsers();
      setUsers(data || []);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role !== 'admin') {
      navigate('/dashboard', { replace: true });
      return;
    }
    loadUsers();
  }, [currentUser?.role, navigate]);

  return (
    <section className="py-2 pb-24 sm:pb-2">
      {/* Page header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-brand-dark dark:text-white">Employees</h1>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {loading ? '…' : `${users.length} employee${users.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-brand-dark hover:bg-[#2a3640] transition shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span className="hidden sm:inline">Add employee</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#141518] overflow-hidden divide-y divide-gray-100 dark:divide-white/5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="px-4 py-3 flex items-center gap-3 animate-pulse">
              <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-white/10 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-gray-200 dark:bg-white/10 rounded w-32" />
                <div className="h-3 bg-gray-100 dark:bg-white/5 rounded w-48" />
              </div>
            </div>
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-gray-500 dark:text-gray-400">No employees yet.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#141518] overflow-hidden divide-y divide-gray-100 dark:divide-white/5">
          {users.map((u) => (
            <div key={u._id} className="px-4 py-3 flex items-center gap-3">

              {/* Avatar with setup-pending dot */}
              <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-xl overflow-hidden">
                  {u.profilePicture ? (
                    <img
                      src={getCloudinaryUrl(u.profilePicture, { width: 80, height: 80, crop: 'fill' })}
                      alt={`${u.firstName} ${u.lastName}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center text-white font-bold text-sm ${avatarColor(u._id)}`}>
                      {getInitials(u)}
                    </div>
                  )}
                </div>
                {u.mustChangePassword && (
                  <span
                    className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-400 border-2 border-white dark:border-[#141518]"
                    title="Setup pending"
                  />
                )}
              </div>

              {/* Info — tappable to open details */}
              <button
                type="button"
                onClick={() => setDetailsTarget(u)}
                className="flex-1 min-w-0 text-left"
              >
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate leading-snug">
                  {u.firstName} {u.lastName}
                  {u._id === currentUser?._id && (
                    <span className="ml-1.5 text-xs font-normal text-gray-400 dark:text-gray-500">(you)</span>
                  )}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                  <span className={`inline-block px-1.5 py-px rounded-full text-[10px] font-semibold shrink-0 ${ROLE_COLORS[u.role] || ROLE_COLORS.user}`}>
                    {ROLE_LABELS[u.role] || u.role}
                  </span>
                  <span className="text-gray-300 dark:text-white/20 shrink-0">·</span>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{u.email}</p>
                </div>
              </button>

              {/* Actions — hide for self */}
              {u._id !== currentUser?._id && (
                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setResetTarget(u)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition"
                    aria-label="Reset password"
                    title="Reset password"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditTarget(u)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 transition"
                    aria-label="Edit"
                    title="Edit employee"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(u)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                    aria-label="Delete"
                    title="Remove employee"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <CreateUserModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={loadUsers}
      />
      <EditUserModal
        user={editTarget}
        onClose={() => setEditTarget(null)}
        onSuccess={loadUsers}
      />
      <DeleteConfirmModal
        user={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onSuccess={loadUsers}
      />
      <ResetPasswordModal
        user={resetTarget}
        onClose={() => setResetTarget(null)}
      />
      <EmployeeDetailsModal
        user={detailsTarget}
        onClose={() => setDetailsTarget(null)}
      />
    </section>
  );
};

export default Users;