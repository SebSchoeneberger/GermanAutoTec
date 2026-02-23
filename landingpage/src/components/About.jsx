import { motion } from 'framer-motion'
import { FadeInUp, StaggerContainer, StaggerItem } from './ScrollReveal'
import AboutImage from '../assets/18354_2df6f6dc21daeb997cb58382a62eeb17-9_11_2023, 3_31_07 p. m..webp'
import FounderElias from '../assets/IMG_0644.webp'
import FounderMilkias from '../assets/IMG_0692.webp'
import FounderSebastian from '../assets/IMG_0703.webp'

const founders = [
  {
    name: 'Elias Gudita',
    position: 'Co-Founder and Technician',
    image: FounderElias,
    bio: 'Experienced mechanic specialized in automatic transmissions, with over 15 years at Orbis Trading as a senior mechanic and quality control lead. Strong people skills—led the employee union at Orbis Trading.',
  },
  {
    name: 'Milkias Awoke',
    position: 'Co-Founder and General Manager',
    image: FounderMilkias,
    bio: 'Trained at Selam Technical and Vocational College in Addis Ababa, with 9 years at the official Mercedes-Benz partner (Orbis Trading). Certified diagnostic technician from Mercedes-Benz Germany (Berlin & Stuttgart). General manager at German AutoTec for the last 5 years.',
    linkedin: 'https://www.linkedin.com/in/micky-awoke-490938163/',
  },
  {
    name: 'Sebastian Schoeneberger',
    position: 'Co-Founder and Detailer',
    image: FounderSebastian,
    bio: 'Certified mechatronic technician, trained at Mercedes-Benz. Gained several years of workshop experience in Germany before co-founding German AutoTec. Currently focusing on the detailing side of the business, including polishing and ceramic coating.',
    linkedin: 'https://www.linkedin.com/in/sebastian-schoeneberger/',
  },
]

export default function About() {
  return (
    <section id="about" className="py-12 sm:py-16 lg:py-20 bg-gray-50 dark:bg-white/[0.02] overflow-hidden" aria-labelledby="about-heading">
      {/* Floating blob */}
      <div className="absolute top-1/4 right-0 w-[600px] h-[600px] rounded-full bg-[#1C262D]/5 blur-[100px] pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-1/4 left-0 w-[400px] h-[400px] rounded-full bg-[#8C9090]/10 blur-[80px] pointer-events-none" aria-hidden="true" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 lg:mb-14">
          <FadeInUp delayOrder={0}>
            <span className="text-gray-500 dark:text-gray-400 text-sm font-semibold uppercase tracking-[0.2em]">About us</span>
          </FadeInUp>
          <FadeInUp delayOrder={1}>
            <h2 id="about-heading" className="mt-2 text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1C262D] dark:text-white">
              Expertise you can trust
            </h2>
          </FadeInUp>
          <FadeInUp delayOrder={2}>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
              Mercedes specialists in Addis Ababa—trained, certified, and here for you.
            </p>
          </FadeInUp>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 lg:gap-x-20 gap-y-8 lg:gap-y-10 items-start">
          <FadeInUp className="relative order-1 w-full max-w-lg mx-auto lg:mx-0 lg:max-w-none" delayOrder={3}>
            <motion.div
              className="aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-gray-200/50 dark:ring-white/10"
              whileHover="hover"
              initial="initial"
              variants={{
                initial: { scale: 1 },
                hover: { scale: 1.02, transition: { duration: 0.3 } },
              }}
            >
              <img
                src={AboutImage}
                alt="Professional car workshop - German AutoTec uses modern equipment and expert technicians in Addis Ababa"
                className="w-full h-full object-cover"
              />
            </motion.div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 sm:w-32 sm:h-32 rounded-2xl bg-[#1C262D]/20 blur-2xl" aria-hidden="true" />
          </FadeInUp>
          <div className="order-2 space-y-6 text-center lg:text-left">
            <div className="space-y-5 text-gray-600 dark:text-gray-400 text-base lg:text-lg leading-relaxed">
              <FadeInUp delayOrder={4}>
                <p>
                Founded in 2021, German AutoTec is a dedicated garage specializing exclusively in Mercedes-Benz vehicles in Addis Ababa. Our team includes multiple technicians trained and certified in Germany, supported by skilled staff across the workshop to ensure smooth, professional operations.</p>
              </FadeInUp>
              <FadeInUp delayOrder={5}>
                <p>
                  We combine modern equipment and reliable diagnostics with a strong focus on customer service and professionalism. Whether you need routine maintenance, repairs, or premium detailing—from interior care to polish and ceramic coating—we deliver quality you can depend on.
                </p>
              </FadeInUp>
              <FadeInUp delayOrder={6}>
                <p>
                  We offer multilingual service to make your visit smooth and stress-free. When you choose German AutoTec, you get expertise, transparency, and a team that cares about your vehicle.
                </p>
              </FadeInUp>
            </div>
            <FadeInUp delayOrder={7} className="flex flex-wrap gap-4 justify-center lg:justify-start pt-2">
              {['Mercedes specialist', 'Certified technicians', 'Multilingual service'].map((label) => (
                <motion.span
                  key={label}
                  className="inline-flex items-center rounded-full bg-[#1C262D]/10 dark:bg-white/10 px-4 py-2 text-sm font-medium text-[#1C262D] dark:text-[#8C9090] ring-1 ring-[#1C262D]/20 dark:ring-white/20"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  {label}
                </motion.span>
              ))}
            </FadeInUp>
          </div>
        </div>

        {/* Founders – same section, second heading */}
        <div className="mt-16 lg:mt-20">
          <FadeInUp delayOrder={0} className="text-center lg:text-left mb-8 lg:mb-10">
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1C262D] dark:text-white">
              Founders
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400 max-w-2xl lg:max-w-none">
              We founded German AutoTec together—all of us former Mercedes technicians.
            </p>
          </FadeInUp>
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
            {founders.map((founder, i) => (
              <StaggerItem key={founder.name}>
                <motion.article
                  className="group relative h-full flex flex-col rounded-2xl overflow-hidden bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 shadow-lg shadow-gray-200/50 dark:shadow-none hover:border-[#1C262D]/30 dark:hover:border-[#1C262D] hover:shadow-xl hover:shadow-[#1C262D]/10 dark:hover:shadow-[#1C262D]/20 transition-all duration-300"
                  whileHover={{ y: -6 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                >
                  <div className="relative aspect-[4/5] overflow-hidden">
                    <motion.img
                      src={founder.image}
                      alt={founder.name}
                      className="w-full h-full object-cover object-top"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.4 }}
                    />
                    {founder.linkedin && (
                      <a
                        href={founder.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute top-2 right-2 z-10 inline-flex rounded-md bg-[#0A66C2] p-1.5 text-white shadow-md hover:bg-[#004182] transition-colors"
                        aria-label={`${founder.name} on LinkedIn`}
                      >
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                      </a>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                      <span className="text-white text-sm font-medium">{founder.position}</span>
                    </div>
                  </div>
                  <div className="relative p-5 sm:p-6 flex flex-col flex-1">
                    <h4 className="text-xl font-bold text-[#1C262D] dark:text-white">{founder.name}</h4>
                    <p className="mt-1 text-sm font-medium text-[#1C262D]/80 dark:text-[#8C9090]">{founder.position}</p>
                    <p className="mt-3 text-gray-600 dark:text-gray-400 text-sm leading-relaxed flex-1">{founder.bio}</p>
                  </div>
                </motion.article>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </div>
    </section>
  )
}
