import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { updatePart } from '../../services/sparePartsApi';
import ButtonSpinner from './ButtonSpinner';

const RestockPartModal = ({ isOpen, onClose, onSaved, part }) => {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const onSubmit = async ({ qty }) => {
    const amount = Number(qty);
    setIsLoading(true);
    try {
      await updatePart(part._id, { quantity: part.quantity + amount });
      toast.success(`Restocked ${amount} unit${amount > 1 ? 's' : ''}`);
      onSaved();
      onClose();
      reset();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !part) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 dark:bg-black/70 z-50 p-4">
      <div className="bg-white dark:bg-[#141518] text-gray-900 dark:text-gray-100 p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-white/10 w-full max-w-sm">
        <h2 className="text-xl font-bold mb-1">Restock Part</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
          <span className="font-medium text-gray-700 dark:text-gray-300">{part.name}</span>
          &nbsp;·&nbsp;{part.quantity} currently in stock
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Units to add
            </label>
            <input
              type="number"
              autoFocus
              placeholder="e.g. 10"
              className={`w-full px-3 py-2 border rounded-xl bg-white dark:bg-white/5 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 transition text-sm ${errors.qty ? 'border-red-400 dark:border-red-500 focus:ring-red-400/40 dark:focus:ring-red-500/40' : 'border-gray-200 dark:border-white/10 focus:ring-brand-dark/40 dark:focus:ring-white/20'}`}
              {...register('qty', {
                required: 'Quantity is required',
                min: { value: 1, message: 'Must be at least 1' },
              })}
            />
            {errors.qty && <p className="mt-1.5 text-xs text-red-500 dark:text-red-400">{errors.qty.message}</p>}
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-dark hover:bg-[#2a3640] disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isLoading && <ButtonSpinner />}
              {isLoading ? 'Saving…' : 'Add Stock'}
            </button>
            <button
              type="button"
              onClick={() => { onClose(); reset(); }}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RestockPartModal;
