import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { deletePart } from '../../services/sparePartsApi';
import { CATEGORY_COLORS, getStockStatus, OWNER_TYPE_COLORS, formatETB } from '../../utils/sparePartsUtils';
import { detailUrl, detailLargeUrl } from '../../utils/imageUtils';
import CopyPartNumberButton from './CopyPartNumberButton';
import ButtonSpinner from './ButtonSpinner';
import { PartImagePlaceholderDetail } from './PartImagePlaceholder';

const SparePartDetailModal = ({ isOpen, onClose, part, canManage, onEdit, onSell, onRestock, onDeleted }) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [imageLightbox, setImageLightbox] = useState(false);

  useEffect(() => {
    if (!isOpen) setImageLightbox(false);
  }, [isOpen]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deletePart(part._id);
      toast.success(`"${part.name}" deleted`);
      onDeleted();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete part');
    } finally {
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  };

  const handleClose = () => {
    setConfirmDelete(false);
    onClose();
  };

  if (!isOpen || !part) return null;

  const stock = getStockStatus(part.quantity);
  const categoryColor = CATEGORY_COLORS[part.category] ?? CATEGORY_COLORS.Other;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/50 dark:bg-black/70 z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="bg-white dark:bg-[#141518] text-gray-900 dark:text-gray-100 rounded-2xl shadow-xl border border-gray-200 dark:border-white/10 w-full max-w-md max-h-[92vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100 dark:border-white/5">
          <div className="flex items-center gap-2">
            {part.category && (
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${categoryColor}`}>
                {part.category}
              </span>
            )}
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${stock.className}`}>
              {stock.label}
            </span>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Photo or grey placeholder */}
        {part.imageUrl ? (
          <div className="px-4 sm:px-5 pt-4">
            <button
              type="button"
              onClick={() => setImageLightbox(true)}
              className="w-full rounded-xl border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5 flex items-center justify-center min-h-[11rem] max-h-[min(60vh,28rem)] p-2 cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-brand-dark/40 dark:focus:ring-white/30 transition hover:bg-gray-100/80 dark:hover:bg-white/[0.07]"
            >
              <img
                src={detailUrl(part.imageUrl)}
                alt={part.name}
                className="max-w-full max-h-[min(58vh,26rem)] w-auto h-auto object-contain rounded-lg pointer-events-none"
                loading="lazy"
                decoding="async"
              />
            </button>
            <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-0.5">Tap to enlarge</p>

            {imageLightbox && (
              <div
                role="presentation"
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4"
                onClick={() => setImageLightbox(false)}
              >
                <button
                  type="button"
                  onClick={() => setImageLightbox(false)}
                  className="absolute top-4 right-4 z-[101] p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition"
                  aria-label="Close full screen image"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6">
                    <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                  </svg>
                </button>
                <img
                  src={detailLargeUrl(part.imageUrl)}
                  alt=""
                  className="max-w-full max-h-[90vh] w-auto h-auto object-contain"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
          </div>
        ) : (
          <PartImagePlaceholderDetail />
        )}

        {/* Body */}
        <div className="p-4 sm:p-5 space-y-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{part.name}</h2>
            <div className="mt-1 flex items-center gap-1 flex-wrap">
              <span className="font-mono text-sm text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-white/5 inline-block px-2 py-0.5 rounded-md">
                {part.partNumber}
              </span>
              <CopyPartNumberButton partNumber={part.partNumber} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <InfoBlock label="Quantity">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{part.quantity}</span>
              <span className="text-sm text-gray-400 dark:text-gray-500 ml-1">pcs</span>
            </InfoBlock>
            <InfoBlock label="Unit Price">
              {part.price != null
                ? <span className="text-2xl font-bold text-gray-900 dark:text-white">{formatETB(part.price)}</span>
                : <span className="text-sm text-gray-400 dark:text-gray-500">—</span>
              }
            </InfoBlock>
          </div>

          {part.brand && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium text-gray-500 dark:text-gray-500">Brand</span>
              <span className="text-gray-900 dark:text-white font-medium">{part.brand}</span>
            </div>
          )}

          {part.ownerType && part.ownerType !== 'Company' && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-500">Owner</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${OWNER_TYPE_COLORS[part.ownerType] ?? ''}`}>
                {part.ownerType}
              </span>
              {part.ownerName && (
                <span className="text-sm text-gray-900 dark:text-white font-medium">{part.ownerName}</span>
              )}
            </div>
          )}

          {part.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed border-t border-gray-100 dark:border-white/5 pt-3">
              {part.description}
            </p>
          )}

          {(part.compatibleEngines?.length > 0 || part.compatibleTransmissions?.length > 0) && (
            <div className="border-t border-gray-100 dark:border-white/5 pt-3 space-y-2">
              {part.compatibleEngines?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mb-1.5">Compatible Engines</p>
                  <div className="flex flex-wrap gap-1.5">
                    {part.compatibleEngines.map((e) => (
                      <span key={e} className="text-xs font-medium px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                        {e}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {part.compatibleTransmissions?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mb-1.5">Compatible Transmissions</p>
                  <div className="flex flex-wrap gap-1.5">
                    {part.compatibleTransmissions.map((t) => (
                      <span key={t} className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        {canManage && (
          <div className="p-4 sm:p-5 border-t border-gray-100 dark:border-white/5 space-y-3">
            {confirmDelete ? (
              <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 p-3">
                <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-3">
                  Delete &ldquo;{part.name}&rdquo;? This cannot be undone.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex-1 inline-flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition"
                  >
                    {isDeleting && <ButtonSpinner />}
                    {isDeleting ? 'Deleting…' : 'Yes, delete'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="flex-1 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-1.5 sm:gap-2">
                <ActionBtn onClick={onRestock} color="green" title="Restock">
                  <PlusIcon /> <span className="hidden xs:inline">Restock</span>
                </ActionBtn>
                <ActionBtn onClick={onSell} color="blue" disabled={part.quantity === 0} title="Sell">
                  <MinusIcon /> <span className="hidden xs:inline">Sell</span>
                </ActionBtn>
                <ActionBtn onClick={onEdit} color="gray" title="Edit">
                  <EditIcon /> <span className="hidden xs:inline">Edit</span>
                </ActionBtn>
                <button
                  type="button"
                  title="Delete"
                  onClick={() => setConfirmDelete(true)}
                  className="p-2 rounded-xl text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition shrink-0"
                >
                  <TrashIcon />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const InfoBlock = ({ label, children }) => (
  <div className="rounded-xl bg-gray-50 dark:bg-white/5 px-4 py-3">
    <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mb-1">{label}</p>
    <div className="flex items-baseline">{children}</div>
  </div>
);

const ActionBtn = ({ onClick, color, disabled, title, children }) => {
  const colors = {
    green: 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30',
    blue:  'text-blue-700  dark:text-blue-400  bg-blue-50  dark:bg-blue-900/20  hover:bg-blue-100  dark:hover:bg-blue-900/30',
    gray:  'text-gray-600  dark:text-gray-400  bg-gray-100 dark:bg-white/5      hover:bg-gray-200  dark:hover:bg-white/10',
  };
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed ${colors[color]}`}
    >
      {children}
    </button>
  );
};

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
    <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
  </svg>
);

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
  </svg>
);

const MinusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path fillRule="evenodd" d="M4 10a.75.75 0 0 1 .75-.75h10.5a.75.75 0 0 1 0 1.5H4.75A.75.75 0 0 1 4 10Z" clipRule="evenodd" />
  </svg>
);

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
    <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 3.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
  </svg>
);

export default SparePartDetailModal;
