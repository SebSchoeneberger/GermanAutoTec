import { motion } from 'framer-motion'
import { StaggerContainer, StaggerItem, FadeInUp } from './ScrollReveal'

const garageServices = [
  {
    title: 'Diagnosis',
    description: 'Modern diagnostic equipment and experienced technicians to accurately identify issues and recommend the right solutions.',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
    ),
  },
  {
    title: 'Repair',
    description: 'Quality mechanical and electrical repairs for your Mercedes. We use proven procedures, manufacturer standards, and reliable parts so your car is fixed right.',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21.75 6.75C21.75 9.23528 19.7353 11.25 17.25 11.25C17.1206 11.25 16.9925 11.2445 16.8659 11.2338C15.7904 11.1429 14.6016 11.3052 13.9155 12.1383L6.76432 20.8219C6.28037 21.4096 5.55897 21.75 4.79769 21.75C3.39064 21.75 2.25 20.6094 2.25 19.2023C2.25 18.441 2.59044 17.7196 3.1781 17.2357L11.8617 10.0845C12.6948 9.39841 12.8571 8.20956 12.7662 7.13411C12.7555 7.00749 12.75 6.87938 12.75 6.75C12.75 4.26472 14.7647 2.25 17.25 2.25C17.9103 2.25 18.5375 2.39223 19.1024 2.64774L15.8262 5.92397C16.0823 7.03963 16.9605 7.91785 18.0762 8.17397L21.3524 4.89779C21.6078 5.46268 21.75 6.08973 21.75 6.75Z" />
        <path d="M4.86723 19.125H4.87473V19.1325H4.86723V19.125Z" />
      </svg>
    ),
  },
  {
    title: 'Maintenance',
    description: 'Routine servicing and preventive care to keep your vehicle running smoothly. Specialist care following manufacturer standards.',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
]

const detailingServices = [
  {
    title: 'Interior cleaning',
    description: 'Thorough interior cleaning, leather care, and protection. Your cabin stays fresh and well-maintained.',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3.75 6C3.75 4.75736 4.75736 3.75 6 3.75H8.25C9.49264 3.75 10.5 4.75736 10.5 6V8.25C10.5 9.49264 9.49264 10.5 8.25 10.5H6C4.75736 10.5 3.75 9.49264 3.75 8.25V6Z" />
        <path d="M3.75 15.75C3.75 14.5074 4.75736 13.5 6 13.5H8.25C9.49264 13.5 10.5 14.5074 10.5 15.75V18C10.5 19.2426 9.49264 20.25 8.25 20.25H6C4.75736 20.25 3.75 19.2426 3.75 18V15.75Z" />
        <path d="M13.5 6C13.5 4.75736 14.5074 3.75 15.75 3.75H18C19.2426 3.75 20.25 4.75736 20.25 6V8.25C20.25 9.49264 19.2426 10.5 18 10.5H15.75C14.5074 10.5 13.5 9.49264 13.5 8.25V6Z" />
        <path d="M13.5 15.75C13.5 14.5074 14.5074 13.5 15.75 13.5H18C19.2426 13.5 20.25 14.5074 20.25 15.75V18C20.25 19.2426 19.2426 20.25 18 20.25H15.75C14.5074 20.25 13.5 19.2426 13.5 18V15.75Z" />
      </svg>
    ),
  },
  {
    title: 'Polish & ceramic coating',
    description: 'Paint correction, polish, and long-lasting ceramic coating to protect and enhance your vehicle\'s finish.',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
  },
  {
    title: 'Dent repair',
    description: 'Paintless dent repair and minor body work to restore your car\'s appearance.',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M11.4194 15.1694L17.25 21C18.2855 22.0355 19.9645 22.0355 21 21C22.0355 19.9645 22.0355 18.2855 21 17.25L15.1233 11.3733M11.4194 15.1694L13.9155 12.1383C14.2315 11.7546 14.6542 11.5132 15.1233 11.3733M11.4194 15.1694L6.76432 20.8219C6.28037 21.4096 5.55897 21.75 4.79768 21.75C3.39064 21.75 2.25 20.6094 2.25 19.2023C2.25 18.441 2.59044 17.7196 3.1781 17.2357L10.0146 11.6056M15.1233 11.3733C15.6727 11.2094 16.2858 11.1848 16.8659 11.2338C16.9925 11.2445 17.1206 11.25 17.25 11.25C19.7353 11.25 21.75 9.23528 21.75 6.75C21.75 6.08973 21.6078 5.46268 21.3523 4.89779L18.0762 8.17397C16.9605 7.91785 16.0823 7.03963 15.8262 5.92397L19.1024 2.64774C18.5375 2.39223 17.9103 2.25 17.25 2.25C14.7647 2.25 12.75 4.26472 12.75 6.75C12.75 6.87938 12.7555 7.00749 12.7662 7.13411C12.8571 8.20956 12.6948 9.39841 11.8617 10.0845L11.7596 10.1686M10.0146 11.6056L5.90901 7.5H4.5L2.25 3.75L3.75 2.25L7.5 4.5V5.90901L11.7596 10.1686M10.0146 11.6056L11.7596 10.1686M18.375 18.375L15.75 15.75M4.86723 19.125H4.87473V19.1325H4.86723V19.125Z" />
      </svg>
    ),
  },
]

function ServiceCard({ service }) {
  return (
    <StaggerItem>
      <motion.li
        className="list-none h-full"
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <div className="group relative h-full p-6 sm:p-8 rounded-2xl bg-gray-50 dark:bg-white/[0.04] border-2 border-gray-200 dark:border-white/10 transition-all duration-300 hover:border-[#1C262D] dark:hover:border-[#1C262D] hover:shadow-lg hover:shadow-[#1C262D]/15 dark:hover:shadow-[#1C262D]/20 text-center md:text-left w-full max-w-md md:max-w-none">
          <div className="absolute inset-0 rounded-2xl group-hover:bg-[#1C262D]/5 dark:group-hover:bg-[#1C262D]/10 transition-colors pointer-events-none" />
          <div className="relative inline-flex p-3 rounded-xl bg-[#1C262D]/10 dark:bg-white/10 text-[#1C262D] dark:text-[#8C9090] group-hover:bg-[#1C262D] group-hover:text-white dark:group-hover:text-white transition-all duration-300 mx-auto md:mx-0">
            {service.icon}
          </div>
          <h3 className="relative mt-4 text-xl font-semibold text-[#1C262D] dark:text-white">{service.title}</h3>
          <p className="relative mt-2 text-gray-600 dark:text-gray-400 leading-relaxed">{service.description}</p>
        </div>
      </motion.li>
    </StaggerItem>
  )
}

export default function Services() {
  return (
    <section
      id="services"
      className="relative py-12 sm:py-16 lg:py-20 overflow-hidden bg-gradient-to-b from-white via-gray-50/50 to-gray-100/80 dark:from-[#0a0a0b] dark:via-[#0a0a0b] dark:to-[#0d0f12]"
      aria-labelledby="services-heading"
    >
      {/* Decorative background elements */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute -top-40 -right-40 w-[480px] h-[480px] rounded-full bg-[#1C262D]/[0.07] dark:bg-[#1C262D]/15 blur-[100px]" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[320px] rounded-full bg-[#1C262D]/[0.04] dark:bg-[#1C262D]/10 blur-[80px]" />
        <div className="absolute top-1/2 -left-32 w-64 h-64 rounded-full bg-gray-200/40 dark:bg-white/[0.02] blur-[60px]" />
      </div>
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <FadeInUp delayOrder={0}>
            <span className="text-gray-500 dark:text-gray-400 text-sm font-semibold uppercase tracking-[0.2em]">What we offer</span>
          </FadeInUp>
          <FadeInUp delayOrder={1}>
            <h2 id="services-heading" className="mt-2 text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1C262D] dark:text-white">
              Our services
            </h2>
          </FadeInUp>
          <FadeInUp delayOrder={2}>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
              From Mercedes maintenance and diagnostics to full detailing—a complete range of professional automotive services.
            </p>
          </FadeInUp>
        </div>

        <div className="mt-12 lg:mt-14 space-y-14 lg:space-y-16">
          <div>
            <FadeInUp delayOrder={3}>
              <h3 className="text-2xl sm:text-2xl lg:text-4xl font-bold text-[#1C262D] dark:text-white mb-6 lg:mb-8 flex items-center justify-center gap-2">
                <span className="w-2 h-8 rounded-full bg-[#1C262D]" aria-hidden="true" />
                Garage
              </h3>
            </FadeInUp>
            <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 place-items-center md:place-items-stretch">
              {garageServices.map((s) => (
                <ServiceCard key={s.title} service={s} />
              ))}
            </StaggerContainer>
          </div>

          <div>
            <FadeInUp delayOrder={4}>
              <h3 className="text-2xl sm:text-2xl lg:text-4xl font-bold text-[#1C262D] dark:text-white mb-6 lg:mb-8 flex items-center justify-center gap-2">
                <span className="w-2 h-8 rounded-full bg-[#1C262D]" aria-hidden="true" />
                Detailing
              </h3>
            </FadeInUp>
            <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 place-items-center md:place-items-stretch">
              {detailingServices.map((s) => (
                <ServiceCard key={s.title} service={s} />
              ))}
            </StaggerContainer>
          </div>
        </div>
      </div>
    </section>
  )
}

