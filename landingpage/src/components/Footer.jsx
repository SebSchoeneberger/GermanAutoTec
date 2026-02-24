import { useTranslation } from 'react-i18next'
import {
  socialLinks,
  PHONE_NUMBER,
  PHONE_DISPLAY,
  EMAIL,
  getTranslatedAddress,
  getTranslatedOpeningHours,
} from '../constants/contact'

export default function Footer() {
  const { t } = useTranslation()
  const ADDRESS = getTranslatedAddress(t)
  const OPENING_HOURS = getTranslatedOpeningHours(t)
  return (
    <footer className="relative bg-gray-900 dark:bg-black text-gray-400 overflow-hidden" role="contentinfo">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-px bg-gradient-to-r from-transparent via-[#8C9090]/40 to-transparent" aria-hidden="true" />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12 text-center sm:text-left">
          <div>
            <h3 className="text-white font-semibold text-lg">German AutoTec</h3>
            <p className="mt-3 text-sm leading-relaxed">
              {t('footer.tagline')}
            </p>
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider">{t('footer.addressTitle')}</h3>
            <address className="mt-3 text-sm not-italic leading-relaxed">
              {ADDRESS.line1} <br />
              {ADDRESS.line2} <br />
              {ADDRESS.city}, {ADDRESS.country}
            </address>
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider">{t('footer.contactTitle')}</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <a href={`tel:${PHONE_NUMBER.replace(/\s/g, '')}`} className="text-gray-400 hover:text-[#8C9090] transition">
                  {PHONE_DISPLAY}
                </a>
              </li>
              <li>
                <a href={`mailto:${EMAIL}`} className="text-gray-400 hover:text-[#8C9090] transition">
                  {EMAIL}
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider">{t('footer.hoursTitle')}</h3>
            <p className="mt-3 text-sm leading-relaxed">
              {OPENING_HOURS.weekdays}<br />
              {OPENING_HOURS.saturday}
            </p>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <p className="text-sm text-gray-500 order-2 sm:order-1">{t('footer.copyright', { year: new Date().getFullYear() })}</p>
          <div className="flex gap-4 justify-center sm:justify-end order-1 sm:order-2" aria-label="Social links">
            {socialLinks.map(({ href, label, icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-9 h-9 rounded-lg text-gray-500 hover:text-[#8C9090] transition focus:outline-none focus:ring-2 focus:ring-[#8C9090] focus:ring-offset-2 focus:ring-offset-gray-900"
                aria-label={label}
              >
                <img src={icon} alt="" className="w-5 h-5" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
