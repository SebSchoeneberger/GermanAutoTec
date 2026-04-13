import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useAuth } from '../../hooks/useAuth';
import { changePassword } from '../../services/userApi';

const inputClass =
  'w-full px-3 py-2.5 border rounded-xl bg-white dark:bg-white/5 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 transition text-sm';
const normalBorder = 'border-gray-200 dark:border-white/10 focus:ring-brand-dark/40 dark:focus:ring-white/20';
const errorBorder = 'border-red-400 dark:border-red-500 focus:ring-red-400/40';

const fieldClass = (hasError) => `${inputClass} ${hasError ? errorBorder : normalBorder}`;

const FieldError = ({ msg }) =>
  msg ? <p className="mt-1.5 text-xs text-red-500 dark:text-red-400">{msg}</p> : null;

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.97 9.97 0 012.51-4.03M6.53 6.53A9.97 9.97 0 0112 5c4.477 0 8.268 2.943 9.542 7a9.97 9.97 0 01-1.357 2.67M6.53 6.53L3 3m3.53 3.53l11.94 11.94M16.47 16.47L21 21" />
  </svg>
);

const SetPassword = () => {
  const { user, logout } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const newPassword = watch('newPassword');

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      // The current password is the temporary one the admin set
      await changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword });
      toast.success('Password set successfully. Welcome!');
      // Full reload so AuthContext re-fetches /users/me with mustChangePassword: false
      window.location.href = '/dashboard';
    } catch (e) {
      toast.error(e.response?.data?.message || e.response?.data?.error || 'Failed to set password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-8 px-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-dark dark:bg-white/10 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-brand-dark dark:text-white">
            Welcome, {user?.firstName}!
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Please set your personal password to continue.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#141518] p-6 shadow-sm mb-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Temporary password
              </label>
              <div className="relative">
                <input
                  type={showCurrentPw ? 'text' : 'password'}
                  className={fieldClass(!!errors.currentPassword)}
                  placeholder="Enter the temporary password"
                  {...register('currentPassword', { required: 'Temporary password is required' })}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPw((v) => !v)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  aria-label={showCurrentPw ? 'Hide password' : 'Show password'}
                >
                  {showCurrentPw ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              <FieldError msg={errors.currentPassword?.message} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                New password
              </label>
              <div className="relative">
                <input
                  type={showNewPw ? 'text' : 'password'}
                  className={fieldClass(!!errors.newPassword)}
                  placeholder="At least 6 characters"
                  {...register('newPassword', {
                    required: 'New password is required',
                    minLength: { value: 6, message: 'Must be at least 6 characters' },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw((v) => !v)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  aria-label={showNewPw ? 'Hide password' : 'Show password'}
                >
                  {showNewPw ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              <FieldError msg={errors.newPassword?.message} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirm new password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPw ? 'text' : 'password'}
                  className={fieldClass(!!errors.confirmPassword)}
                  placeholder="Repeat your new password"
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: (v) => v === newPassword || 'Passwords do not match',
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPw((v) => !v)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  aria-label={showConfirmPw ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPw ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              <FieldError msg={errors.confirmPassword?.message} />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-dark hover:bg-[#2a3640] disabled:opacity-50 disabled:cursor-not-allowed transition mt-2"
            >
              {submitting ? 'Setting password…' : 'Set password & continue'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 dark:text-gray-500">
          Wrong account?{' '}
          <button
            type="button"
            onClick={logout}
            className="text-gray-500 dark:text-gray-400 hover:text-brand-dark dark:hover:text-white underline transition"
          >
            Sign out
          </button>
        </p>
      </div>
    </div>
  );
};

export default SetPassword;