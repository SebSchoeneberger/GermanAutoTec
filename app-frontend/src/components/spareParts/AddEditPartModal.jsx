import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'react-toastify';
import { createPart, updatePart } from '../../services/sparePartsApi';
import { CATEGORIES, OWNER_TYPES } from '../../utils/sparePartsUtils';
import { compressImage } from '../../utils/imageUtils';
import TagInput from '../TagInput';
import ButtonSpinner from './ButtonSpinner';

const EMPTY_FORM = {
  name: '',
  partNumber: '',
  brand: '',
  category: '',
  quantity: '',
  price: '',
  description: '',
  ownerType: 'Company',
  ownerName: '',
  compatibleEngines: [],
  compatibleTransmissions: [],
};

const normalInput = 'w-full px-3 py-2 border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-dark/40 dark:focus:ring-white/20 transition text-sm';
const errorInput  = 'w-full px-3 py-2 border border-red-400 dark:border-red-500 rounded-xl bg-white dark:bg-white/5 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-400/40 dark:focus:ring-red-500/40 transition text-sm';

const ic = (hasError) => hasError ? errorInput : normalInput;

const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp';

const AddEditPartModal = ({ isOpen, onClose, onSaved, part }) => {
  const isEditing = Boolean(part);
  const [isLoading, setIsLoading] = useState(false);

  // Image state lives outside RHF because it's a File object, not a form value
  const [imageFile, setImageFile]       = useState(null); // newly selected file
  const [removeImage, setRemoveImage]   = useState(false); // mark existing image for removal
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null); // blob URL — revoked on cleanup

  useEffect(() => {
    if (!imageFile) {
      setImagePreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: EMPTY_FORM });

  useEffect(() => {
    if (part) {
      reset({
        name:                    part.name                    ?? '',
        partNumber:              part.partNumber              ?? '',
        brand:                   part.brand                   ?? '',
        category:                part.category                ?? '',
        quantity:                part.quantity                ?? '',
        price:                   part.price                   ?? '',
        description:             part.description             ?? '',
        ownerType:               part.ownerType               ?? 'Company',
        ownerName:               part.ownerName               ?? '',
        compatibleEngines:       part.compatibleEngines       ?? [],
        compatibleTransmissions: part.compatibleTransmissions ?? [],
      });
    } else {
      reset(EMPTY_FORM);
    }
    // Reset image state whenever the modal opens or the part changes
    setImageFile(null);
    setRemoveImage(false);
  }, [part, isOpen, reset]);

  // Compress then store — camera, gallery, and replace flows all use this.
  const pickImage = async (file) => {
    const compressed = await compressImage(file);
    setImageFile(compressed);
    setRemoveImage(false);
  };

  /** Reset input so the same file can be chosen again; works with camera + gallery inputs. */
  const onFileChosen = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) pickImage(file);
  };

  const ownerType = watch('ownerType');
  const category  = watch('category');

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      // Build FormData so the image file can be sent alongside the text fields
      const formData = new FormData();

      formData.append('name',        data.name);
      formData.append('partNumber',  data.partNumber);
      formData.append('brand',       data.brand       || '');
      formData.append('category',    data.category    || '');
      formData.append('quantity',    Number(data.quantity));
      formData.append('description', data.description || '');
      formData.append('ownerType',   data.ownerType);
      formData.append('ownerName',   data.ownerType === 'Company' ? '' : data.ownerName);

      if (data.price !== '') formData.append('price', Number(data.price));

      // Arrays must be JSON-serialised — the backend parses them back
      formData.append('compatibleEngines',       JSON.stringify(data.compatibleEngines));
      formData.append('compatibleTransmissions', JSON.stringify(data.compatibleTransmissions));

      if (isEditing) {
        formData.append('action', 'edited');
        if (imageFile) {
          formData.append('image', imageFile);       // replace with new file
        } else if (removeImage) {
          formData.append('removeImage', 'true');    // signal backend to delete + clear
        }
        await updatePart(part._id, formData);
        toast.success('Part updated successfully');
      } else {
        if (imageFile) formData.append('image', imageFile);
        await createPart(formData);
        toast.success('Part added successfully');
      }

      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  // Decide what the photo section should display
  const showNewPreview     = Boolean(imageFile);
  const showExistingImage  = !imageFile && isEditing && part?.imageUrl && !removeImage;
  const showUploadArea     = !showNewPreview && !showExistingImage;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 dark:bg-black/70 z-50 p-4">
      <div className="bg-white dark:bg-[#141518] text-gray-900 dark:text-gray-100 p-5 sm:p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-white/10 w-full max-w-lg max-h-[92vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-5">{isEditing ? 'Edit Part' : 'Add New Part'}</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Part Name *" error={errors.name?.message}>
              <input type="text" placeholder="e.g. Air Filter"
                className={ic(!!errors.name)}
                {...register('name', { required: 'Part name is required' })} />
            </Field>
            <Field label="Part Number *" error={errors.partNumber?.message}>
              <input type="text" placeholder="e.g. AF-2024-M"
                className={ic(!!errors.partNumber)}
                {...register('partNumber', { required: 'Part number is required' })} />
            </Field>
            <Field label="Brand">
              <input type="text" placeholder="e.g. Bosch"
                className={ic(false)}
                {...register('brand')} />
            </Field>
            <Field label="Category">
              <select className={ic(false)} {...register('category')}>
                <option value="">— Select —</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Quantity *" error={errors.quantity?.message}>
              <input
                type="number"
                min={isEditing ? '0' : '1'}
                placeholder={isEditing ? '0' : '1'}
                className={ic(!!errors.quantity)}
                {...register('quantity', {
                  validate: (v) => {
                    const n = Number(v);
                    if (v === '' || isNaN(n)) return 'Quantity is required';
                    if (isEditing && n < 0)   return 'Quantity cannot be negative';
                    if (!isEditing && n < 1)  return 'Quantity must be at least 1';
                    return true;
                  },
                })}
              />
            </Field>
            <Field label="Price (ETB)">
              <input type="number" min="0" step="0.01" placeholder="0.00"
                className={ic(false)}
                {...register('price')} />
            </Field>
          </div>

          <Field label="Description">
            <textarea rows={3} placeholder="Optional notes about this part..."
              className={`${ic(false)} resize-none`}
              {...register('description')} />
          </Field>

          {/* Photo */}
          <div className="border-t border-gray-100 dark:border-white/5 pt-4 space-y-3">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Photo</p>

            {/* Preview of a newly selected file */}
            {showNewPreview && imagePreviewUrl && (
              <div className="relative rounded-xl overflow-hidden border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5 flex items-center justify-center min-h-[11rem] max-h-52">
                <img
                  src={imagePreviewUrl}
                  alt="Preview"
                  className="max-w-full max-h-52 w-auto h-auto object-contain"
                />
                <button
                  type="button"
                  onClick={() => setImageFile(null)}
                  title="Remove selected photo"
                  className="absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white hover:bg-black/70 transition"
                >
                  <XIcon />
                </button>
              </div>
            )}

            {/* Existing Cloudinary image (edit mode) */}
            {showExistingImage && (
              <div className="relative rounded-xl overflow-hidden">
                <img
                  src={part.imageUrl}
                  alt={part.name}
                  className="w-full h-44 object-cover"
                />
                <button
                  type="button"
                  onClick={() => setRemoveImage(true)}
                  title="Remove photo"
                  className="absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white hover:bg-black/70 transition"
                >
                  <XIcon />
                </button>
              </div>
            )}

            {/* Upload: capture hints OS camera on phones; on desktop both often use the file picker */}
            {showUploadArea && (
              <div className="rounded-xl border-2 border-dashed border-gray-200 dark:border-white/10 p-4 space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 transition hover:border-brand-dark/40 dark:hover:border-white/30 hover:bg-gray-50 dark:hover:bg-white/10">
                    <CameraIcon className="w-5 h-5 shrink-0 text-gray-500 dark:text-gray-400" />
                    Take photo
                    <input
                      type="file"
                      accept={IMAGE_ACCEPT}
                      capture="environment"
                      className="sr-only"
                      onChange={onFileChosen}
                    />
                  </label>
                  <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 transition hover:border-brand-dark/40 dark:hover:border-white/30 hover:bg-gray-50 dark:hover:bg-white/10">
                    <GalleryIcon className="w-5 h-5 shrink-0 text-gray-500 dark:text-gray-400" />
                    Choose from gallery
                    <input
                      type="file"
                      accept={IMAGE_ACCEPT}
                      className="sr-only"
                      onChange={onFileChosen}
                    />
                  </label>
                </div>
                <p className="text-center text-xs text-gray-400 dark:text-gray-500">JPG, PNG or WebP · max 5 MB</p>
              </div>
            )}

            {/* Action links below the previews — replace without clearing first */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
              {(showExistingImage || showNewPreview) && (
                <>
                  <label className="inline-flex items-center gap-1 font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer transition">
                    <CameraIcon className="w-3.5 h-3.5" />
                    Take photo
                    <input type="file" accept={IMAGE_ACCEPT} capture="environment" className="sr-only" onChange={onFileChosen} />
                  </label>
                  <label className="inline-flex items-center gap-1 font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer transition">
                    <GalleryIcon className="w-3.5 h-3.5" />
                    Gallery
                    <input type="file" accept={IMAGE_ACCEPT} className="sr-only" onChange={onFileChosen} />
                  </label>
                </>
              )}
              {/* Undo remove — shown when user clicked the X on an existing image */}
              {removeImage && (
                <button
                  type="button"
                  onClick={() => setRemoveImage(false)}
                  className="font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition"
                >
                  Keep existing photo
                </button>
              )}
            </div>
          </div>

          {/* Compatibility */}
          {(category === 'Engine' || category === 'Transmission') && (
            <div className="border-t border-gray-100 dark:border-white/5 pt-4 space-y-3">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Compatibility</p>
              {category === 'Engine' && (
                <Field label="Compatible Engines">
                  <Controller
                    name="compatibleEngines"
                    control={control}
                    render={({ field }) => (
                      <TagInput
                        values={field.value}
                        onChange={field.onChange}
                        placeholder="e.g. M271, M274, OM651…"
                      />
                    )}
                  />
                </Field>
              )}
              {category === 'Transmission' && (
                <Field label="Compatible Transmissions">
                  <Controller
                    name="compatibleTransmissions"
                    control={control}
                    render={({ field }) => (
                      <TagInput
                        values={field.value}
                        onChange={field.onChange}
                        placeholder="e.g. 722.6, 7G-Tronic…"
                      />
                    )}
                  />
                </Field>
              )}
            </div>
          )}

          {/* Ownership */}
          <div className="border-t border-gray-100 dark:border-white/5 pt-4 space-y-3">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Ownership</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Owner Type">
                <select className={ic(false)} {...register('ownerType')}>
                  {OWNER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              {ownerType !== 'Company' && (
                <Field label="Owner Name *" error={errors.ownerName?.message}>
                  <input type="text" placeholder="Full name"
                    className={ic(!!errors.ownerName)}
                    {...register('ownerName', { required: 'Owner name is required' })} />
                </Field>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={isLoading}
              className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-dark hover:bg-[#2a3640] disabled:opacity-50 disabled:cursor-not-allowed transition">
              {isLoading && <ButtonSpinner />}
              {isLoading ? (isEditing ? 'Saving…' : 'Adding…') : (isEditing ? 'Save Changes' : 'Add Part')}
            </button>
            <button type="button" onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Field = ({ label, error, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
    {children}
    {error && <p className="mt-1.5 text-xs text-red-500 dark:text-red-400">{error}</p>}
  </div>
);

const CameraIcon = ({ className = 'w-5 h-5' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M6.827 6.175A2.31 2.31 0 0 0 5.25 8.318v7.364A2.31 2.31 0 0 0 7.56 18h8.88a2.31 2.31 0 0 0 2.31-2.318V8.318A2.31 2.31 0 0 0 16.44 6h-2.884a2.31 2.31 0 0 1-1.73-.773l-.293-.293A2.31 2.31 0 0 0 9.803 4H8.25A2.31 2.31 0 0 0 6 6.318v.175Z" />
    <path d="M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
  </svg>
);

const GalleryIcon = ({ className = 'w-5 h-5' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3A1.5 1.5 0 0 0 1.5 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
  </svg>
);

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
  </svg>
);

export default AddEditPartModal;
