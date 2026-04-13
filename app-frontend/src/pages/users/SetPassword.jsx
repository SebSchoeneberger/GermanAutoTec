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

const SetPassword = () => {
  const { user, logout } = useAuth();
  const [submitting, setSubmitting] = useState(false);

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
              <input
                type="password"
                className={fieldClass(!!errors.currentPassword)}
                placeholder="Enter the temporary password"
                {...register('currentPassword', { required: 'Temporary password is required' })}
              />
              <FieldError msg={errors.currentPassword?.message} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                New password
              </label>
              <input
                type="password"
                className={fieldClass(!!errors.newPassword)}
                placeholder="At least 6 characters"
                {...register('newPassword', {
                  required: 'New password is required',
                  minLength: { value: 6, message: 'Must be at least 6 characters' },
                })}
              />
              <FieldError msg={errors.newPassword?.message} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirm new password
              </label>
              <input
                type="password"
                className={fieldClass(!!errors.confirmPassword)}
                placeholder="Repeat your new password"
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (v) => v === newPassword || 'Passwords do not match',
                })}
              />
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