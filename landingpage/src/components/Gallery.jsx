import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { FadeInUp } from './ScrollReveal'
import { GALLERY_IMAGES, INITIAL_COUNT, LOAD_MORE_COUNT } from '../constants/gallery'

export default function Gallery() {
  const { t } = useTranslation()
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT)
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const [loaded, setLoaded] = useState(() => new Set())
  const sectionRef = useRef(null)

  const visible = GALLERY_IMAGES.slice(0, visibleCount)
  const markLoaded = useCallback((src) => {
    setLoaded((prev) => new Set(prev).add(src))
  }, [])
  const hasMore = visibleCount < GALLERY_IMAGES.length

  const goPrev = useCallback(() => {
    setLightboxIndex((i) => (i === null ? null : (i - 1 + GALLERY_IMAGES.length) % GALLERY_IMAGES.length))
  }, [])
  const goNext = useCallback(() => {
    setLightboxIndex((i) => (i === null ? null : (i + 1) % GALLERY_IMAGES.length))
  }, [])
  const close = useCallback(() => setLightboxIndex(null), [])

  useEffect(() => {
    if (lightboxIndex === null) return
    const onKey = (e) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [lightboxIndex, close, goPrev, goNext])

  return (
    <section
      ref={sectionRef}
      id="gallery"
      className="relative py-12 sm:py-16 lg:py-20 overflow-hidden bg-gradient-to-b from-white via-gray-50/50 to-gray-100/80 dark:from-[#0a0a0b] dark:via-[#0a0a0b] dark:to-[#0d0f12]"
      aria-labelledby="gallery-heading"
    >
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute -top-40 -right-40 w-[480px] h-[480px] rounded-full bg-[#1C262D]/[0.07] dark:bg-[#1C262D]/15 blur-[100px]" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[320px] rounded-full bg-[#1C262D]/[0.04] dark:bg-[#1C262D]/10 blur-[80px]" />
        <div className="absolute top-1/2 -left-32 w-64 h-64 rounded-full bg-gray-200/40 dark:bg-white/[0.02] blur-[60px]" />
      </div>
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <FadeInUp delayOrder={0}>
            <span className="text-gray-500 dark:text-gray-400 text-sm font-semibold uppercase tracking-[0.2em]">{t('gallery.eyebrow')}</span>
          </FadeInUp>
          <FadeInUp delayOrder={1}>
            <h2 id="gallery-heading" className="mt-2 text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1C262D] dark:text-white">
              {t('gallery.heading')}
            </h2>
          </FadeInUp>
          <FadeInUp delayOrder={2}>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
              {t('gallery.intro')}
            </p>
          </FadeInUp>
        </div>

        {GALLERY_IMAGES.length === 0 ? (
          <FadeInUp delayOrder={3} className="mt-12 text-center py-12 rounded-2xl bg-gray-50 dark:bg-white/[0.04] border border-dashed border-gray-200 dark:border-white/10">
            <p className="text-gray-500 dark:text-gray-400">{t('gallery.emptyHint')}</p>
          </FadeInUp>
        ) : (
          <>
            <div className="mt-10 sm:mt-12 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
              {visible.map((item, i) => (
                <motion.button
                  key={item.src}
                  type="button"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: Math.min(i, 5) * 0.05 }}
                  className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden ring-1 ring-gray-200/50 dark:ring-white/10 focus:outline-none focus:ring-2 focus:ring-[#1C262D] focus:ring-offset-2 dark:focus:ring-offset-[#0a0a0b] text-left"
                  onClick={() => setLightboxIndex(GALLERY_IMAGES.findIndex((img) => img.src === item.src))}
                >
                  {!loaded.has(item.src) && (
                    <div className="absolute inset-0 rounded-2xl bg-gray-200 dark:bg-white/10 animate-pulse" aria-hidden />
                  )}
                  <img
                    src={item.src}
                    alt={item.alt}
                    loading="lazy"
                    decoding="async"
                    onLoad={() => markLoaded(item.src)}
                    className={`w-full h-full object-cover transition-all duration-200 hover:scale-105 ${loaded.has(item.src) ? 'opacity-100' : 'opacity-0'}`}
                  />
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors duration-200" aria-hidden />
                </motion.button>
              ))}
            </div>

            <div className="mt-10 sm:mt-12 flex flex-wrap justify-center gap-3">
              {visibleCount > INITIAL_COUNT && (
                <motion.button
                  type="button"
                  onClick={() => {
                    setVisibleCount(INITIAL_COUNT)
                    setTimeout(() => {
                      sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }, 50)
                  }}
                  className="px-6 py-3 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 ring-1 ring-gray-200/60 dark:ring-white/10 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {t('gallery.showLess')}
                </motion.button>
              )}
              {hasMore && (
                <motion.button
                  type="button"
                  onClick={() => setVisibleCount((c) => Math.min(c + LOAD_MORE_COUNT, GALLERY_IMAGES.length))}
                  className="px-6 py-3 rounded-xl text-sm font-semibold text-[#1C262D] dark:text-white bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 ring-1 ring-gray-200/60 dark:ring-white/10 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {t('gallery.loadMore')}
                </motion.button>
              )}
            </div>

            <AnimatePresence>
              {lightboxIndex !== null && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 sm:p-6"
                  onClick={close}
                >
                  <button
                    type="button"
                    onClick={close}
                    className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white shrink-0"
                    aria-label={t('gallery.ariaClose')}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); goPrev() }}
                    className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white shrink-0"
                    aria-label={t('gallery.ariaPrev')}
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <div className="flex flex-1 items-center justify-center w-full min-h-0 min-w-0 px-12 sm:px-14">
                    <motion.img
                      key={lightboxIndex}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      src={GALLERY_IMAGES[lightboxIndex]?.src}
                      alt={GALLERY_IMAGES[lightboxIndex]?.alt ?? ''}
                      className="max-w-full max-h-[75vh] w-auto h-auto object-contain rounded-lg"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); goNext() }}
                    className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white shrink-0"
                    aria-label={t('gallery.ariaNext')}
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </button>
                  <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">
                    {lightboxIndex + 1} / {GALLERY_IMAGES.length}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </section>
  )
}
