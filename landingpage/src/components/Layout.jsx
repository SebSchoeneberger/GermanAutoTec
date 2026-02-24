import { useTheme } from '../hooks/useTheme'
import ScrollProgress from './ScrollProgress'
import Navbar from './Navbar'
import Footer from './Footer'
import TelegramFAB from './TelegramFAB'
import BackToTop from './BackToTop'

export default function Layout({ children }) {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0b] text-gray-900 dark:text-gray-100 noise-overlay">
      <ScrollProgress />
      <Navbar theme={theme} onThemeToggle={toggleTheme} />

      <main>{children}</main>

      <Footer />
      <BackToTop />
      <TelegramFAB />
    </div>
  )
}
