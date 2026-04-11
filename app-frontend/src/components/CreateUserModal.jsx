import { useState } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { toast } from 'react-toastify';
import { getToken } from '../utils/tokenUtils';

const inputClass =
  'w-full px-3 py-2 border rounded-xl bg-white dark:bg-white/5 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 transition text-sm';
const normalBorder = 'border-gray-200 dark:border-white/10 focus:ring-brand-dark/40 dark:focus:ring-white/20';
const errorBorder  = 'border-red-400 dark:border-red-500 focus:ring-red-400/40 dark:focus:ring-red-500/40';

const fieldClass = (hasError) => `${inputClass} ${hasError ? errorBorder : normalBorder}`;

const FieldError = ({ msg }) =>
  msg ? <p className="mt-1.5 text-xs text-red-500 dark:text-red-400">{msg}</p> : null;

const CreateUserModal = ({ isOpen, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { role: 'user' } });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const token = getToken();
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/users`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(response.data.message);
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create user');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 dark:bg-black/70 z-50 p-4">
      <div className="bg-white dark:bg-[#141518] text-gray-900 dark:text-gray-100 p-5 sm:p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-white/10 max-w-md w-full max-h-[92vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Create New User</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First Name</label>
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last Name</label>
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
            <input
              type="password"
              className={fieldClass(!!errors.password)}
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 6, message: 'Must be at least 6 characters' },
              })}
            />
            <FieldError msg={errors.password?.message} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
            <select className={fieldClass(false)} {...register('role')}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="accountant">Accountant</option>
              <option value="mechanic">Mechanic</option>
              <option value="receptionist">Receptionist</option>
              <option value="workshop">Workshop display (QR tablet only)</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-dark hover:bg-[#2a3640] disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isLoading ? 'Creating...' : 'Create User'}
          </button>
        </form>
        <button type="button" onClick={onClose} className="mt-4 text-sm font-medium text-red-600 dark:text-red-400 hover:underline">
          Cancel
        </button>
      </div>
    </div>
  );
};

export default CreateUserModal;
