/**
 * Gallery: add images to src/assets/gallery (jpg, jpeg, png, webp).
 * List filenames below in the order you want them shown.
 */

const galleryGlob = import.meta.glob('../assets/gallery/*.{jpg,jpeg,png,webp}', {
  query: '?url',
  import: 'default',
  eager: true,
})

/** Display order: first in array = first in gallery. Add any new files here in the position you want. */
export const GALLERY_IMAGE_ORDER = [
  'w205.webp',
  '20231117_172647.webp',
  'IMG_20211226_141532.webp',
  'IMG_0789.webp',
  '20231121_175752.webp',
  'IMG_20211226_131510.webp',
]

export const INITIAL_COUNT = 6
export const LOAD_MORE_COUNT = 6

function buildGalleryImages() {
  const byName = new Map()
  for (const [path, src] of Object.entries(galleryGlob)) {
    const filename = path.replace(/^.*[/\\]/, '')
    byName.set(filename.toLowerCase(), { src, filename, alt: `German AutoTec - ${filename.replace(/\.[^.]+$/, '')}` })
  }
  const result = []
  for (const name of GALLERY_IMAGE_ORDER) {
    const key = name.toLowerCase()
    if (byName.has(key)) {
      result.push(byName.get(key))
      byName.delete(key)
    }
  }
  for (const item of byName.values()) result.push(item)
  return result
}

export const GALLERY_IMAGES = buildGalleryImages()
