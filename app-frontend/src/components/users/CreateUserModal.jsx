import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { createUser } from '../../services/userApi';

const inputClass =
  'w-full px-3 py-2 border rounded-xl bg-white dark:bg-white/5 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 transition text-sm';
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

const CreateUserModal = ({ isOpen, onClose, onSuccess }) => {
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { role: 'mechanic' } });

  useEffect(() => {
    if (!isOpen) reset({ role: 'mechanic' });
  }, [isOpen, reset]);

  const onSubmit = async (data) => {
    try {
      await createUser(data);
      toast.success('Employee created successfully');
      onSuccess?.();
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.message || e.response?.data?.error || 'Failed to create employee');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 dark:bg-black/70 z-50 p-4">
      <div className="bg-white dark:bg-[#141518] text-gray-900 dark:text-gray-100 p-5 sm:p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-white/10 max-w-md w-full max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Add employee</h2>
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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First name</label>
            <input
              type="text"
              className={fieldClass(!!errors.firstName)}
              {...register('firstName', {
                required: 'First name is required',
                minLength: { value: 2, message: 'Must be at least 2 characters' },
              })}
            />
            <FieldError msg={errors.firstName?.message} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last name</label>
            <input
              type="text"
              className={fieldClass(!!errors.lastName)}
              {...register('lastName', { required: 'Last name is required' })}
            />
            <FieldError msg={errors.lastName?.message} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input
              type="email"
              className={fieldClass(!!errors.email)}
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Enter a valid email address',
                },
              })}
            />
            <FieldError msg={errors.email?.message} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Temporary password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                className={fieldClass(!!errors.password)}
                placeholder="Employee will change this on first login"
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 6, message: 'Must be at least 6 characters' },
                })}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            <FieldError msg={errors.password?.message} />
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              Share this with the employee — they&apos;ll be prompted to change it.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
            <select className={fieldClass(false)} {...register('role')}>
              <option value="mechanic">Mechanic</option>
              <option value="manager">Manager</option>
              <option value="accountant">Accountant</option>
              <option value="receptionist">Receptionist</option>
              <option value="workshop">Workshop display (QR tablet only)</option>
              <option value="user">User</option>
            </select>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-dark hover:bg-[#2a3640] disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isSubmitting ? 'Creating…' : 'Create employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUserModal;
