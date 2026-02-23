import { useState } from 'react'
import logo from '../assets/18971_German AutoTec_logo_KJ_MT-01.png'
import IconTelegram from '../assets/SocialMedia/telegram-svgrepo-com.svg'

const NAV_LINK_CLASS =
  'block py-2 md:py-0 text-sm font-medium text-gray-600 hover:text-[#1C262D] dark:text-gray-400 dark:hover:text-white transition relative after:absolute after:left-0 after:bottom-[-2px] after:h-px after:w-0 after:bg-[#1C262D] dark:after:bg-white after:transition-all after:duration-200 hover:after:w-full'

const NAV_ITEMS = [
  { href: '#services', label: 'Services' },
  { href: '#about', label: 'About' },
  { href: '#gallery', label: 'Gallery' },
  { href: '#contact', label: 'Contact' },
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

export default function Navbar({ theme, onThemeToggle }) {
  const [navOpen, setNavOpen] = useState(false)
  const closeNav = () => setNavOpen(false)
  const isDark = theme === 'dark'

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

          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            <div className="flex gap-6 lg:gap-8">
              {NAV_ITEMS.map(({ href, label }) => (
                <a key={href} href={href} className={NAV_LINK_CLASS} onClick={closeNav}>{label}</a>
              ))}
            </div>
            <a href="https://t.me/GermanAutoTec" target="_blank" rel="noopener noreferrer" className={telegramCtaClass}>
              <img src={IconTelegram} alt="" className="w-5 h-5" aria-hidden />
              Message us on Telegram
            </a>
            <button
              type="button"
              onClick={onThemeToggle}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2.5 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20 transition"
            >
              <ThemeIcon isDark={isDark} />
            </button>
          </div>

          <div className="flex md:hidden items-center gap-2">
            <button
              type="button"
              onClick={onThemeToggle}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300"
            >
              <ThemeIcon isDark={isDark} />
            </button>
            <button
              type="button"
              onClick={() => setNavOpen((o) => !o)}
              aria-label={navOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={navOpen}
              className="p-2 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20"
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
          <div className="md:hidden py-3 border-t border-gray-200/50 dark:border-white/5 flex flex-col gap-1">
            {NAV_ITEMS.map(({ href, label }) => (
              <a key={href} href={href} className={NAV_LINK_CLASS} onClick={closeNav}>{label}</a>
            ))}
            <a
              href="https://t.me/GermanAutoTec"
              target="_blank"
              rel="noopener noreferrer"
              onClick={closeNav}
              className="inline-flex items-center justify-center gap-2 mt-2 mx-2 px-4 py-3 rounded-xl text-sm font-semibold text-white bg-[#0088cc] hover:bg-[#0077b5] transition-colors"
            >
              <img src={IconTelegram} alt="" className="w-5 h-5" aria-hidden />
              Message us on Telegram
            </a>
          </div>
        )}
      </nav>
    </header>
  )
}
