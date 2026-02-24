import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FadeInUp } from './ScrollReveal'

export default function FAQ() {
  const { t } = useTranslation()
  const [openIndex, setOpenIndex] = useState(null)
  const items = t('faq.items', { returnObjects: true }) || []

  return (
    <section
      id="faq"
      className="relative py-14 sm:py-16 lg:py-24 overflow-hidden bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-[#0a0a0b] dark:via-[#0d0f12] dark:to-[#0a0a0b]"
      aria-labelledby="faq-heading"
    >
      {/* Background – no blur to avoid scroll jank */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute -top-32 -right-32 w-[480px] h-[480px] rounded-full bg-[#1C262D]/[0.06] dark:bg-[#1C262D]/10" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[520px] h-[280px] rounded-full bg-[#1C262D]/[0.04] dark:bg-[#1C262D]/6" />
      </div>

      <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-14 lg:mb-16">
          <FadeInUp delayOrder={0}>
            <span className="text-gray-500 dark:text-gray-400 text-sm font-semibold uppercase tracking-[0.2em]">
              {t('faq.eyebrow')}
            </span>
          </FadeInUp>
          <FadeInUp delayOrder={1}>
            <h2
              id="faq-heading"
              className="mt-2 text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1C262D] dark:text-white tracking-tight"
            >
              {t('faq.heading')}
            </h2>
          </FadeInUp>
          <FadeInUp delayOrder={2}>
            <p className="mt-4 text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
              {t('faq.intro')}
            </p>
          </FadeInUp>
        </div>

        <ul className="space-y-3 sm:space-y-4" role="list">
          {items.map((item, i) => {
            const isOpen = openIndex === i
            const q = typeof item === 'object' && item !== null ? item.q : ''
            const a = typeof item === 'object' && item !== null ? item.a : ''
            return (
              <li key={i} className="relative">
                <div
                  className={`relative rounded-2xl overflow-hidden border-2 transition-colors duration-300 ${
                    isOpen
                      ? 'border-[#1C262D] dark:border-[#1C262D] bg-white dark:bg-white/[0.06] shadow-lg shadow-[#1C262D]/10 dark:shadow-[#1C262D]/20'
                      : 'border-gray-200 dark:border-white/10 bg-white/80 dark:bg-white/[0.03] hover:border-gray-300 dark:hover:border-white/20 hover:bg-white dark:hover:bg-white/[0.05]'
                  }`}
                >
                  {isOpen && (
                    <div
                      className="absolute left-0 top-0 bottom-0 w-1.5 sm:w-2 rounded-l-2xl bg-[#1C262D]"
                      aria-hidden
                    />
                  )}

                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                    className="w-full text-left flex items-start sm:items-center gap-3 sm:gap-4 pl-5 pr-4 sm:pl-6 sm:pr-5 py-4 sm:py-5 min-h-[56px] sm:min-h-0 focus:outline-none focus:ring-2 focus:ring-[#1C262D] dark:focus:ring-white/40 focus:ring-inset rounded-2xl"
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${i}`}
                    id={`faq-question-${i}`}
                  >
                    <span
                      className={`shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-xs font-bold tabular-nums transition-all duration-300 ${
                        isOpen
                          ? 'bg-[#1C262D] text-white shadow-md shadow-[#1C262D]/25'
                          : 'bg-gray-100 dark:bg-white/10 text-gray-400 dark:text-gray-500'
                      }`}
                      aria-hidden
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="flex-1 pt-0.5 sm:pt-0 text-left text-base sm:text-lg font-semibold text-[#1C262D] dark:text-white leading-snug">
                      {q}
                    </span>
                    <span
                      className={`shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                        isOpen
                          ? 'bg-[#1C262D] text-white shadow-md shadow-[#1C262D]/25 rotate-180'
                          : 'bg-gray-100 dark:bg-white/10 text-[#1C262D] dark:text-gray-300'
                      }`}
                      aria-hidden
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </button>

                  <div
                    className="grid transition-[grid-template-rows] duration-300 ease-out"
                    style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
                  >
                    <div className="overflow-hidden">
                      <div
                        id={`faq-answer-${i}`}
                        role="region"
                        aria-labelledby={`faq-question-${i}`}
                        className="pt-5 pb-6 pl-5 pr-5 sm:pt-6 sm:pb-7 sm:pl-6 sm:pr-6 ml-12 sm:ml-14 text-gray-600 dark:text-gray-400 text-sm sm:text-base leading-[1.65] border-t border-gray-100 dark:border-white/10"
                      >
                        {a}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>

        <FadeInUp delayOrder={3} className="mt-12 sm:mt-14 text-center">
          <a
            href="#contact"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-semibold text-[#1C262D] dark:text-white bg-[#1C262D]/10 dark:bg-white/10 hover:bg-[#1C262D]/15 dark:hover:bg-white/15 border border-[#1C262D]/20 dark:border-white/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#1C262D] focus:ring-offset-2 dark:focus:ring-offset-[#0a0a0b]"
          >
            {t('hero.ctaContact')}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </FadeInUp>
      </div>
    </section>
  )
}
