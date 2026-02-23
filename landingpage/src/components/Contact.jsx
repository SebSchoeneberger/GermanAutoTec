import { motion } from 'framer-motion'
import { FadeInUp } from './ScrollReveal'
import {
  MAP_EMBED_SRC,
  GOOGLE_REVIEWS_LINK,
  GOOGLE_RATING,
  GOOGLE_MAPS_SEARCH_URL,
  ADDRESS,
  OPENING_HOURS,
  PHONE_NUMBER,
  WHATSAPP_URL,
  TELEGRAM_URL,
  IconWhatsApp,
  IconTelegram,
  socialLinksFollow,
} from '../constants/contact'

export default function Contact() {
  return (
    <section id="contact" className="py-12 sm:py-16 lg:py-20 bg-gray-50 dark:bg-white/[0.02]" aria-labelledby="contact-heading">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 lg:mb-14">
          <FadeInUp delayOrder={0}>
            <span className="text-gray-500 dark:text-gray-400 text-sm font-semibold uppercase tracking-[0.2em]">Get in touch</span>
          </FadeInUp>
          <FadeInUp delayOrder={1}>
            <h2 id="contact-heading" className="mt-2 text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1C262D] dark:text-white">
              Contact us
            </h2>
          </FadeInUp>
          <FadeInUp delayOrder={2}>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
              Reach us on WhatsApp, Telegram, or give us a call. We're here to help.
            </p>
          </FadeInUp>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 items-stretch">
          <FadeInUp delayOrder={3} className="order-2 lg:order-1 flex flex-col gap-4">
            <div className="flex-1 min-h-[260px] sm:min-h-[320px] rounded-2xl overflow-hidden border-2 border-gray-200 dark:border-white/10 shadow-lg bg-gray-100 dark:bg-white/5">
              <iframe
                src={MAP_EMBED_SRC}
                width="100%"
                height="100%"
                style={{ minHeight: '260px' }}
                title="German AutoTec location"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="block w-full h-full min-h-[260px] sm:min-h-[320px]"
              />
            </div>
            <a
              href={GOOGLE_REVIEWS_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 py-3 text-sm font-medium text-[#1C262D] dark:text-white hover:underline focus:outline-none focus:ring-2 focus:ring-[#1C262D] focus:ring-offset-2 dark:focus:ring-offset-gray-900 rounded-lg"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span className="inline-flex items-center gap-1.5">
                <span className="font-semibold text-[#1C262D] dark:text-white">{GOOGLE_RATING}</span>
                <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                on Google · See reviews
              </span>
            </a>
          </FadeInUp>

          <FadeInUp delayOrder={3} className="order-1 lg:order-2">
            <div className="h-full flex flex-col p-6 sm:p-8 rounded-2xl bg-white dark:bg-white/[0.04] border-2 border-gray-200 dark:border-white/10 shadow-lg shadow-gray-200/50 dark:shadow-none hover:border-[#1C262D]/30 dark:hover:border-[#1C262D]/50 transition-colors duration-300">
              <div className="flex flex-col flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-5 border-b border-gray-200 dark:border-white/10 text-center sm:text-left">
                  <a
                    href={GOOGLE_MAPS_SEARCH_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col sm:flex-row items-center sm:items-start gap-3 group"
                  >
                    <span className="flex-shrink-0 w-9 h-9 rounded-lg bg-[#1C262D]/10 dark:bg-white/10 flex items-center justify-center text-[#1C262D] dark:text-[#8C9090] group-hover:bg-[#1C262D]/15 dark:group-hover:bg-white/15 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Location</p>
                      <p className="text-sm font-medium text-[#1C262D] dark:text-white mt-0.5">{ADDRESS.line1}, {ADDRESS.line2}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{ADDRESS.city}, {ADDRESS.country}</p>
                    </div>
                  </a>
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3">
                    <span className="flex-shrink-0 w-9 h-9 rounded-lg bg-[#1C262D]/10 dark:bg-white/10 flex items-center justify-center text-[#1C262D] dark:text-[#8C9090]">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Opening hours</p>
                      <p className="text-sm text-[#1C262D] dark:text-white font-medium mt-0.5">{OPENING_HOURS.weekdays}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{OPENING_HOURS.saturday}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-5 pt-5 flex-1 flex flex-col justify-center">
                  <motion.a
                    href={`tel:${PHONE_NUMBER.replace(/\s/g, '')}`}
                    className="flex items-center justify-center gap-3 w-full px-6 py-4 rounded-xl text-base font-semibold text-white bg-[#1C262D] hover:bg-[#2a3640] transition-colors focus:outline-none focus:ring-2 focus:ring-[#1C262D] focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    Call us
                  </motion.a>
                  <motion.a
                    href={WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-3 w-full px-6 py-4 rounded-xl text-base font-semibold text-white bg-[#25D366] hover:bg-[#20BD5A] transition-colors focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <img src={IconWhatsApp} alt="" className="w-6 h-6 shrink-0" aria-hidden />
                    Chat on WhatsApp
                  </motion.a>
                  <motion.a
                    href={TELEGRAM_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-3 w-full px-6 py-4 rounded-xl text-base font-semibold text-white bg-[#0088cc] hover:bg-[#0077b5] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0088cc] focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <img src={IconTelegram} alt="" className="w-6 h-6 shrink-0" aria-hidden />
                    Message on Telegram
                  </motion.a>
                </div>
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-white/10 text-center sm:text-left">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 mb-4">
                    Follow us
                  </p>
                  <div className="flex gap-4 justify-center sm:justify-start">
                    {socialLinksFollow.map(({ href, label, icon }) => (
                      <a
                        key={label}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center w-11 h-11 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 hover:bg-[#1C262D]/10 hover:text-[#1C262D] dark:hover:bg-white/20 dark:hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#1C262D] focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                        aria-label={label}
                      >
                        <img src={icon} alt="" className="w-5 h-5" />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </FadeInUp>
        </div>
      </div>
    </section>
  )
}
