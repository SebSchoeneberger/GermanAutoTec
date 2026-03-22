import { Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

const Navbar = () => (
  <header className="sticky top-0 z-50 bg-white/90 dark:bg-[#0a0a0b]/90 backdrop-blur-xl border-b border-gray-200/60 dark:border-white/5">
    <nav className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
      <div className="flex items-center justify-between h-14 sm:h-16">
        <Link
          to="/"
          className="text-lg font-bold text-brand-dark dark:text-white shrink-0"
        >
          German AutoTec
        </Link>
        <div className="flex items-center gap-2 sm:gap-4">
          <ThemeToggle />
          <Link
            to="/login"
            className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold text-white bg-brand-dark hover:bg-[#2a3640] transition-colors focus:outline-none focus:ring-2 focus:ring-brand-dark focus:ring-offset-2 dark:focus:ring-offset-[#0a0a0b]"
          >
            Sign in
          </Link>
        </div>
      </div>
    </nav>
  </header>
);

export default Navbar;
