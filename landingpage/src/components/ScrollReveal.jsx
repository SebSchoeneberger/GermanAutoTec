import { motion } from 'framer-motion'

const defaultVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.4, 0.25, 1] },
  }),
}

/**
 * Wraps children and reveals on scroll (once). Supports stagger via delay index.
 */
export function FadeInUp({ children, className = '', delayOrder = 0, as: Component = 'div' }) {
  const Comp = motion[Component] || motion.div
  return (
    <Comp
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      variants={defaultVariants}
      custom={delayOrder}
      className={className}
    >
      {children}
    </Comp>
  )
}

/**
 * Stagger container: children animate in sequence when in view.
 */
export function StaggerContainer({ children, className = '' }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
      variants={{
        visible: {
          transition: { staggerChildren: 0.1, delayChildren: 0.05 },
        },
        hidden: {},
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children, className = '' }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 24 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.4, 0.25, 1] } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
