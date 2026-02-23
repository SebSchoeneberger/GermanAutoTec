import { motion, useScroll, useSpring } from 'framer-motion'

/** Thin progress bar at top that fills on scroll (modern trend) */
export default function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 })
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 z-[100] h-2 origin-left bg-[#1C262D] rounded-full"
      style={{ scaleX }}
      aria-hidden="true"
    />
  )
}
