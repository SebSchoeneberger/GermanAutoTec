import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import heroImage from '../assets/Untitled design (4).webp'
import LogoImage from '../assets/18971_German AutoTec_logo_KJ_MT-01.webp'

const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.15 },
  },
}

const item = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.4, 0.25, 1] },
  },
}

export default function Hero() {
  const { t } = useTranslation()
  return (
    <section className="relative min-h-[100vh] flex items-center overflow-hidden bg-[#1C262D]">
      {/* Static background image – no scroll/parallax for smooth performance */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt={t('hero.altImage')}
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/50 to-black/85" />
      </div>

      {/* Subtle orbs – no scroll coupling */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-[#1C262D]/30 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 rounded-full bg-[#8C9090]/20 blur-[80px]" />
      </div>

      {/* Content */}
      <motion.div
        className="relative z-10 w-full mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20"
        variants={container}
        initial="hidden"
        animate="visible"
      >
        <div className="grid lg:grid-cols-12 gap-6 lg:gap-8 items-center">
          <div className="lg:col-span-7 space-y-4 sm:space-y-6 text-center lg:text-left">
            <motion.p
              variants={item}
              className="text-[#b4b7b8] text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] sm:tracking-[0.25em]"
            >
              {t('hero.badge')}
            </motion.p>
            <motion.h1
              variants={item}
              className="text-xl sm:text-5xl lg:text-7xl xl:text-8xl font-extrabold text-white tracking-tight leading-[1.1]"
            >
              {t('hero.title1')}
              <br />
              <span className="text-gradient-hero">{t('hero.title2')}</span>
            </motion.h1>
            <motion.p variants={item} className="text-base sm:text-lg lg:text-xl text-gray-300 max-w-xl mx-auto lg:mx-0">
              {t('hero.subtitle')}
            </motion.p>
            <motion.div variants={item} className="flex flex-wrap gap-3 sm:gap-4 pt-2 justify-center lg:justify-start">
              <a
                href="#contact"
                className="group inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-white bg-[#1C262D] hover:bg-[#2a3640] rounded-2xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-black border border-white/10 hover:border-white/20"
              >
                {t('hero.ctaContact')}
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
              <a
                href="#services"
                className="inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-white border-2 border-white/30 hover:border-white/50 rounded-2xl transition-all duration-200 hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-white/40"
              >
                {t('hero.ctaServices')}
              </a>
            </motion.div>
          </div>

          <div className="lg:col-span-5 grid grid-cols-2 gap-3 sm:gap-4 max-w-md mx-auto lg:mx-0 w-full">
            <motion.div
              variants={item}
              className="col-span-2 aspect-[16/10] rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
            >
              <img
                src={LogoImage}
                alt={t('hero.altLogo')}
                className="w-full h-full object-cover"
              />
            </motion.div>
            <a href="#services" className="block">
              <motion.div
                variants={item}
                className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-4 sm:p-5 flex flex-col justify-center hover:bg-white/10 hover:border-white/20 transition-colors cursor-pointer"
              >
                <span className="text-3xl sm:text-4xl font-bold text-white">{t('hero.garage')}</span>
                <span className="text-sm text-gray-400 mt-1">{t('hero.garageSub')}</span>
              </motion.div>
            </a>
            <a href="#services" className="block">
              <motion.div
                variants={item}
                className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-4 sm:p-5 flex flex-col justify-center hover:bg-white/10 hover:border-white/20 transition-colors cursor-pointer"
              >
                <span className="text-3xl sm:text-4xl font-bold text-white">{t('hero.detailing')}</span>
                <span className="text-sm text-gray-400 mt-1">{t('hero.detailingSub')}</span>
              </motion.div>
            </a>
          </div>

          {/* Scroll hint: in flow on mobile (below buttons), absolute at bottom on desktop */}
          <a
            href="#services"
            className="relative mt-8 flex flex-col items-center gap-2 text-white/50 hover:text-white/80 transition-colors lg:absolute lg:bottom-8 lg:left-1/2 lg:-translate-x-1/2 lg:mt-0"
            aria-label={t('hero.ariaScroll')}
          >
            <span className="text-xs uppercase tracking-[0.2em]">{t('hero.scrollHint')}</span>
            <svg className="w-5 h-5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </a>
        </div>
      </motion.div>
    </section>
  )
}
