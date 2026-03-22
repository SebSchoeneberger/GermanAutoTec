import multer from 'multer';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const multerInstance = multer({
    // Keep files in memory — we stream them straight to Cloudinary, no disk needed
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_SIZE_BYTES },
    fileFilter: (_req, file, cb) => {
        if (ALLOWED_TYPES.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only JPG, PNG, and WebP images are allowed'));
        }
    },
});

/**
 * Middleware that optionally reads a single `image` field from a multipart request.
 * JSON requests (sell / restock) are passed through untouched.
 * Multer errors are forwarded to the Express error handler.
 */
export const uploadImage = (req, res, next) => {
    multerInstance.single('image')(req, res, (err) => {
        if (err) return next(err);
        next();
    });
};
