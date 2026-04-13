import { useState } from 'react';
import { toast } from 'react-toastify';
import { deleteUser } from '../../services/userApi';

const DeleteConfirmModal = ({ user, onClose, onSuccess }) => {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteUser(user._id);
      toast.success(`${user.firstName} removed successfully`);
      onSuccess();
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.message || e.response?.data?.error || 'Failed to delete user');
    } finally {
      setDeleting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 dark:bg-black/70 z-50 p-4">
      <div className="bg-white dark:bg-[#141518] text-gray-900 dark:text-gray-100 p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-white/10 max-w-sm w-full">
        {/* Icon */}
        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-900/20 mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>

        <h2 className="text-base font-bold text-center text-gray-900 dark:text-white mb-1">
          Remove employee?
        </h2>
        <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-6">
          <span className="font-semibold text-gray-700 dark:text-gray-200">{user.firstName} {user.lastName}</span> will be permanently removed and cannot log in anymore.
        </p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {deleting ? 'Removing…' : 'Remove'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
