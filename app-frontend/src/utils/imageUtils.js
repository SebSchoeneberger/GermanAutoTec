/**
 * Build a Cloudinary delivery URL with on-the-fly transformations.
 *
 * Cloudinary stores the original and serves resized/optimised variants by
 * injecting a transformation string into the URL path, e.g.:
 *   .../image/upload/w_112,h_112,c_fill,f_auto,q_auto/v123/folder/file.jpg
 *
 * No extra storage, no schema changes — transformations are cached at the CDN
 * edge after the first request. f_auto delivers WebP/AVIF to browsers that
 * support them; q_auto picks the best quality/size balance per image (and
 * automatically switches to the more compressed eco mode when a browser sends
 * the Save-Data header, which is common on metered mobile connections).
 *
 * Only the cloud_name is embedded in the URL — no secrets are involved.
 *
 * @param {string} url   - Original Cloudinary URL stored in the database.
 * @param {object} opts
 * @param {number} [opts.width]
 * @param {number} [opts.height]
 * @param {'fill'|'limit'|'scale'} [opts.crop='limit']
 * @returns {string} Transformed URL, or the original URL if it can't be parsed.
 */
export const getCloudinaryUrl = (url, { width, height, crop = 'limit' } = {}) => {
    if (!url || !url.includes('/image/upload/')) return url;

    const parts = [];
    if (width)  parts.push(`w_${width}`);
    if (height) parts.push(`h_${height}`);
    if (parts.length) parts.push(`c_${crop}`);
    parts.push('f_auto', 'q_auto');

    return url.replace('/image/upload/', `/image/upload/${parts.join(',')}/`);
};

// ─── Pre-defined sizes ────────────────────────────────────────────────────────
// Centralised here so card, detail, and any future view stay in sync.

/** 112 × 112 px hard crop — legacy small thumb; prefer cardHeroUrl for list cards. */
export const thumbUrl = (url) => getCloudinaryUrl(url, { width: 112, height: 112, crop: 'fill' });

/** Wide card hero — 2:1 crop, ~560×280 logical px for sharp display on retina. */
export const cardHeroUrl = (url) => getCloudinaryUrl(url, { width: 560, height: 280, crop: 'fill' });

/** Max 900 px wide, never upscaled — sensible for the detail modal. */
export const detailUrl = (url) => getCloudinaryUrl(url, { width: 900 });

/** Larger modal / lightbox preview — max 1200 px wide. */
export const detailLargeUrl = (url) => getCloudinaryUrl(url, { width: 1200 });


// ─── Client-side image compression ───────────────────────────────────────────

const MAX_DIMENSION = 1600; // px — large enough for any detail view, small enough to be fast
const JPEG_QUALITY  = 0.82; // good visual quality with ~60–70 % size reduction vs original

/**
 * Resize and compress an image File before upload using the browser Canvas API.
 * Reduces large phone photos (3–8 MB) to roughly 200–500 KB, cutting upload
 * time significantly on slow connections.
 *
 * Returns a new File with the same name. Falls back to the original file
 * silently if canvas processing fails (e.g. unsupported format, memory limit).
 *
 * Note: canvas re-encoding strips EXIF metadata including orientation — photos
 * taken in portrait on some devices may lose rotation info. Acceptable for v1;
 * consider `browser-image-compression` if this becomes a reported issue.
 *
 * @param {File} file
 * @returns {Promise<File>}
 */
export const compressImage = (file) =>
    new Promise((resolve) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(objectUrl);

            let { width, height } = img;

            // Only scale down — never upscale
            if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
                const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
                width  = Math.round(width  * ratio);
                height = Math.round(height * ratio);
            }

            const canvas = document.createElement('canvas');
            canvas.width  = width;
            canvas.height = height;
            canvas.getContext('2d').drawImage(img, 0, 0, width, height);

            canvas.toBlob(
                (blob) => {
                    if (!blob) { resolve(file); return; }
                    resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }));
                },
                'image/jpeg',
                JPEG_QUALITY,
            );
        };

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            resolve(file); // fall back to original
        };

        img.src = objectUrl;
    });
