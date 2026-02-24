import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import logo from '../assets/18971_German AutoTec_logo_KJ_MT-01.png'
import IconTelegram from '../assets/SocialMedia/telegram-svgrepo-com.svg'

function GlobeIcon({ className = 'w-5 h-5' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="m20.893 13.393-1.135-1.135a2.252 2.252 0 0 1-.421-.585l-1.08-2.16a.414.414 0 0 0-.663-.107.827.827 0 0 1-.812.21l-1.273-.363a.89.89 0 0 0-.738 1.595l.587.39c.59.395.674 1.23.172 1.732l-.2.2c-.212.212-.33.498-.33.796v.41c0 .409-.11.809-.32 1.158l-1.315 2.191a2.11 2.11 0 0 1-1.81 1.025 1.055 1.055 0 0 1-1.055-1.055v-1.172c0-.92-.56-1.747-1.414-2.089l-.655-.261a2.25 2.25 0 0 1-1.383-2.46l.007-.042a2.25 2.25 0 0 1 .29-.787l.09-.15a2.25 2.25 0 0 1 2.37-1.048l1.178.236a1.125 1.125 0 0 0 1.302-.795l.208-.73a1.125 1.125 0 0 0-.578-1.315l-.665-.332-.091.091a2.25 2.25 0 0 1-1.591.659h-.18c-.249 0-.487.1-.662.274a.931.931 0 0 1-1.458-1.137l1.411-2.353a2.25 2.25 0 0 0 .286-.76m11.928 9.869A9 9 0 0 0 8.965 3.525m11.928 9.868A9 9 0 1 1 8.965 3.525" />
    </svg>
  )
}

const NAV_LINK_CLASS =
  'block py-2 lg:py-0 text-sm font-medium text-gray-600 hover:text-[#1C262D] dark:text-gray-400 dark:hover:text-white transition relative after:absolute after:left-0 after:bottom-[-2px] after:h-px after:w-0 after:bg-[#1C262D] dark:after:bg-white after:transition-all after:duration-200 hover:after:w-full'

const NAV_ITEMS_KEYS = [
  { href: '#services', key: 'nav.services' },
  { href: '#about', key: 'nav.about' },
  { href: '#gallery', key: 'nav.gallery' },
  { href: '#faq', key: 'nav.faq' },
  { href: '#contact', key: 'nav.contact' },
]

function ThemeIcon({ isDark }) {
  if (isDark) {
    return (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
      </svg>
    )
  }
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
    </svg>
  )
}

const telegramCtaClass =
  'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#0088cc] hover:bg-[#0077b5] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0088cc] focus:ring-offset-2 dark:focus:ring-offset-[#0a0a0b]'

const LANGUAGES = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'am', label: 'Amharic', short: 'አማ' },
  { code: 'de', label: 'Deutsch', short: 'DE' },
]

export default function Navbar({ theme, onThemeToggle }) {
  const { t, i18n } = useTranslation()
  const [navOpen, setNavOpen] = useState(false)
  const [langMenuOpen, setLangMenuOpen] = useState(false)
  const langMenuRef = useRef(null)
  const closeNav = () => setNavOpen(false)
  const isDark = theme === 'dark'
  const currentLng = i18n.language || 'en'
  const setLanguage = (lng) => {
    i18n.changeLanguage(lng)
    setLangMenuOpen(false)
  }

  useEffect(() => {
    if (!langMenuOpen) return
    const handleClickOutside = (e) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target)) setLangMenuOpen(false)
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [langMenuOpen])

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#0a0a0b]/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/5">
      <nav className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
        <div className="flex items-center justify-between h-14 sm:h-16 min-h-[3.5rem]">
          <a href="#" className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#1C262D] dark:focus:ring-white/50 focus:ring-offset-2 rounded-lg transition hover:opacity-90 shrink-0">
            <img
              src={logo}
              alt="German AutoTec"
              className={`h-8 sm:h-9 w-auto object-contain ${theme === 'light' ? 'invert' : ''}`}
            />
            <span className="text-lg sm:text-xl font-bold text-[#1C262D] dark:text-white">German AutoTec</span>
          </a>

          <div className="hidden lg:flex items-center gap-6 xl:gap-8">
            <div className="flex gap-6 xl:gap-8">
              {NAV_ITEMS_KEYS.map(({ href, key }) => (
                <a key={href} href={href} className={NAV_LINK_CLASS} onClick={closeNav}>{t(key)}</a>
              ))}
            </div>
            <a href="https://t.me/GermanAutoTec" target="_blank" rel="noopener noreferrer" className={telegramCtaClass}>
              <img src={IconTelegram} alt="" className="w-5 h-5" aria-hidden />
              {t('nav.messageTelegram')}
            </a>
            <div className="flex items-center gap-1">
              <div className="relative" ref={langMenuRef}>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setLangMenuOpen((o) => !o) }}
                  aria-label="Language"
                  aria-expanded={langMenuOpen}
                  aria-haspopup="true"
                  className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:text-[#1C262D] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                >
                  <GlobeIcon className="w-5 h-5" />
                </button>
                {langMenuOpen && (
                  <div
                    className="absolute right-0 top-full mt-2 z-50 min-w-[10rem] rounded-xl bg-white dark:bg-[#141518] py-1.5 px-1.5 shadow-lg shadow-gray-200/80 dark:shadow-black/50 border border-gray-100 dark:border-white/10"
                    role="menu"
                  >
                    {LANGUAGES.map(({ code, label }) => (
                      <button
                        key={code}
                        type="button"
                        role="menuitem"
                        onClick={() => setLanguage(code)}
                        className={`w-full text-left px-3 py-2 text-sm rounded-lg flex items-center justify-between gap-3 transition-colors ${currentLng === code ? 'text-[#1C262D] dark:text-white bg-gray-100 dark:bg-white/10' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'}`}
                      >
                        <span>{label}</span>
                        {currentLng === code && (
                          <svg className="w-4 h-4 shrink-0 text-[#1C262D] dark:text-white" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={onThemeToggle}
                aria-label={isDark ? t('nav.ariaLight') : t('nav.ariaDark')}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:text-[#1C262D] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              >
                <ThemeIcon isDark={isDark} />
              </button>
            </div>
          </div>

          <div className="flex lg:hidden items-center gap-1">
            <button
              type="button"
              onClick={onThemeToggle}
              aria-label={isDark ? t('nav.ariaLight') : t('nav.ariaDark')}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10"
            >
              <ThemeIcon isDark={isDark} />
            </button>
            <button
              type="button"
              onClick={() => setNavOpen((o) => !o)}
              aria-label={navOpen ? t('nav.ariaMenuClose') : t('nav.ariaMenuOpen')}
              aria-expanded={navOpen}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10"
            >
              {navOpen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              )}
            </button>
          </div>
        </div>

        {navOpen && (
          <div className="lg:hidden pt-2 pb-3 px-4 border-t border-gray-200/50 dark:border-white/5 flex flex-col">
            {NAV_ITEMS_KEYS.map(({ href, key }) => (
              <a key={href} href={href} className={NAV_LINK_CLASS} onClick={closeNav}>{t(key)}</a>
            ))}
            <div className="pt-3 mt-1 border-t border-gray-100 dark:border-white/5">
              <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 text-center">
                Language
              </p>
              <div className="flex justify-center gap-2">
                {LANGUAGES.map(({ code, short }) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => { setLanguage(code); closeNav() }}
                    className={`min-w-[2.75rem] px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                      currentLng === code
                        ? 'bg-[#1C262D] text-white shadow-md shadow-[#1C262D]/20 dark:bg-[#1C262D] dark:text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/10 dark:text-gray-400 dark:hover:bg-white/15 dark:hover:text-gray-300'
                    }`}
                  >
                    {short}
                  </button>
                ))}
              </div>
            </div>
            <a
              href="https://t.me/GermanAutoTec"
              target="_blank"
              rel="noopener noreferrer"
              onClick={closeNav}
              className="inline-flex items-center justify-center gap-2 mt-4 px-4 py-3 rounded-xl text-sm font-semibold text-white bg-[#0088cc] hover:bg-[#0077b5] transition-colors"
            >
              <img src={IconTelegram} alt="" className="w-5 h-5" aria-hidden />
              {t('nav.messageTelegram')}
            </a>
          </div>
        )}
      </nav>
    </header>
  )
}
