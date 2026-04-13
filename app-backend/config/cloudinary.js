import { v2 as cloudinary } from 'cloudinary';


cloudinary.config({ secure: true });

/**
 * Upload a file buffer to Cloudinary.
 * Returns the full Cloudinary upload result which includes `secure_url` and `public_id`.
 *
 * The incoming transformation (c_limit, w/h 2000) caps the stored master to
 * 2000 × 2000 px without upscaling. This is a server-side safety net — the
 * primary size reduction happens client-side before upload (see compressImage
 * in imageUtils.js), but this ensures nothing oversized is ever stored even
 * if the client step is skipped or fails.
 */
export const uploadToCloudinary = (buffer) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: 'german-autotec/spare-parts',
                transformation: { width: 2000, height: 2000, crop: 'limit' },
            },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            },
        );
        stream.end(buffer);
    });
};

/**
 * Upload a user avatar buffer to Cloudinary.
 * Stored in a separate folder; hard-cropped to 400×400 square.
 */
export const uploadAvatarToCloudinary = (buffer) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: 'german-autotec/avatars',
                transformation: { width: 400, height: 400, crop: 'fill', gravity: 'face' },
            },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            },
        );
        stream.end(buffer);
    });
};

/**
 * Delete an asset from Cloudinary by its public_id.
 * Errors are intentionally NOT thrown — a failed delete must never block the main operation.
 */
export const safeDeleteFromCloudinary = async (publicId) => {
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (err) {
        console.error('Cloudinary delete error:', err.message);
    }
};
