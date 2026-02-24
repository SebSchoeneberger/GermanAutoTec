import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from '../locales/en.json'
import am from '../locales/am.json'
import de from '../locales/de.json'

const supportedLngs = ['en', 'am', 'de']
const browserLng = typeof navigator !== 'undefined' ? navigator.language?.slice(0, 2) : 'en'
const initialLng = supportedLngs.includes(browserLng) ? browserLng : 'en'

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, am: { translation: am }, de: { translation: de } },
  lng: initialLng,
  fallbackLng: 'en',
  supportedLngs,
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
})

i18n.on('languageChanged', (lng) => {
  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.lang = lng
  }
})

if (typeof document !== 'undefined' && document.documentElement) {
  document.documentElement.lang = initialLng
}

export default i18n
