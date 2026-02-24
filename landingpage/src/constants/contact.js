/**
 * Single source of truth for contact info, address, and social links.
 * Used by Contact and Footer.
 */

import IconWhatsApp from '../assets/SocialMedia/whatsapp-svgrepo-com.svg'
import IconTelegram from '../assets/SocialMedia/telegram-svgrepo-com.svg'
import IconInstagram from '../assets/SocialMedia/instagram-1-svgrepo-com.svg'
import IconFacebook from '../assets/SocialMedia/facebook-color-svgrepo-com.svg'
import IconTikTok from '../assets/SocialMedia/tiktok-svgrepo-com.svg'

export const PHONE_NUMBER = '+251964198222'
export const PHONE_DISPLAY = '+251 964 198 222'
export const EMAIL = 'workshop@german-autotec.com'
export const WHATSAPP_URL = 'https://wa.me/251964198222'
export const TELEGRAM_URL = 'https://t.me/GermanAutoTec'

/** Translation keys for address and opening hours (strings live in locales). */
const ADDRESS_KEYS = {
  line1: 'contactConstants.addressLine1',
  line2: 'contactConstants.addressLine2',
  city: 'contactConstants.city',
  country: 'contactConstants.country',
}

const OPENING_HOURS_KEYS = {
  weekdays: 'contactConstants.weekdays',
  saturday: 'contactConstants.saturday',
}

/**
 * Returns translated ADDRESS. Pass the i18n t function from useTranslation().
 * Use in Contact and Footer so address stays in one place and is localized.
 */
export function getTranslatedAddress(t) {
  return {
    line1: t(ADDRESS_KEYS.line1),
    line2: t(ADDRESS_KEYS.line2),
    city: t(ADDRESS_KEYS.city),
    country: t(ADDRESS_KEYS.country),
  }
}

/**
 * Returns translated OPENING_HOURS. Pass the i18n t function from useTranslation().
 */
export function getTranslatedOpeningHours(t) {
  return {
    weekdays: t(OPENING_HOURS_KEYS.weekdays),
    saturday: t(OPENING_HOURS_KEYS.saturday),
  }
}

export const MAP_EMBED_SRC =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4638.284729183177!2d38.78015947569973!3d9.019014991041914!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x164b857536e3f89f%3A0xec5500f350dee00d!2sGerman%20AutoTec!5e1!3m2!1sen!2set!4v1771701695174!5m2!1sen!2set'
export const GOOGLE_MAPS_SEARCH_URL = 'https://www.google.com/maps/search/?api=1&query=German+AutoTec+Addis+Ababa'
export const GOOGLE_REVIEWS_LINK = 'https://maps.app.goo.gl/gUPRMrcXAoiq8m5t6'
export const GOOGLE_RATING = 4.9

export const socialLinks = [
  { href: TELEGRAM_URL, label: 'Telegram', icon: IconTelegram },
  { href: WHATSAPP_URL, label: 'WhatsApp', icon: IconWhatsApp },
  { href: 'https://www.instagram.com/german_autotec/', label: 'Instagram', icon: IconInstagram },
  { href: 'https://www.facebook.com/GermanAutoTecAA', label: 'Facebook', icon: IconFacebook },
  { href: 'https://www.tiktok.com/@german_autotec', label: 'TikTok', icon: IconTikTok },
]

/** Social links for "Follow us" only (Telegram & WhatsApp are primary CTAs elsewhere) */
export const socialLinksFollow = socialLinks.filter(
  ({ label }) => label !== 'Telegram' && label !== 'WhatsApp'
)

export { IconWhatsApp, IconTelegram }
