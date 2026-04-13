import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import ThemeToggle from './ThemeToggle';
import {
  canAccessMyTime,
  canAccessTeamTime,
  canAccessTimeDisplay,
  getTimeHomePath,
} from '../utils/timeAccess';

function buildNavItems(role) {
  const items = [];
  if (role !== 'workshop') {
    items.push({ to: '/dashboard', label: 'Dashboard' });
    items.push({ to: '/spare-parts', label: 'Inventory' });
  }
  if (role === 'admin') {
    items.push({ to: '/users', label: 'Employees' });
  }
  if (canAccessTeamTime(role) || canAccessMyTime(role)) {
    items.push({ to: getTimeHomePath(role), label: 'Time Management' });
  }
  if (canAccessTimeDisplay(role)) {
    items.push({ to: '/time/display', label: 'Clock QR' });
  }
  items.push({ to: '/profile', label: 'Profile' });
  return items;
}

const AuthenticatedNavbar = () => {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const role = user?.role;
  const navItems = buildNavItems(role);
  const showPunchAction = canAccessMyTime(role);
  const [menuOpen, setMenuOpen] = useState(false);

  const linkClass = (to) => {
    const active = pathname === to || pathname.startsWith(to);
    return `text-sm font-medium transition ${
      active
        ? 'text-brand-dark dark:text-white'
        : 'text-gray-500 dark:text-gray-400 hover:text-brand-dark dark:hover:text-white'
    }`;
  };

  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-[#0a0a0b]/90 backdrop-blur-xl border-b border-gray-200/60 dark:border-white/5">
      <nav className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <Link
            to="/"
            className="text-lg font-bold text-brand-dark dark:text-white shrink-0"
          >
            German AutoTec
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <span className="text-sm text-gray-400 dark:text-gray-500">
              {user?.firstName && `Welcome, ${user.firstName}`}
            </span>
            {navItems.map((item) => (
              <Link key={item.to} to={item.to} className={linkClass(item.to)}>
                {item.label}
              </Link>
            ))}
            {showPunchAction && (
              <Link
                to="/time/punch"
                className="text-sm font-semibold text-white bg-brand-dark hover:bg-[#2a3640] transition px-3 py-1.5 rounded-lg"
              >
                Check in/out
              </Link>
            )}
            <ThemeToggle />
            <button
              type="button"
              onClick={logout}
              className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition px-3 py-1.5 rounded-lg"
            >
              Sign out
            </button>
          </div>

          {/* Mobile: theme + hamburger */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Toggle menu"
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition"
            >
              {menuOpen ? <XIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 dark:border-white/5 py-3 space-y-1">
            {user?.firstName && (
              <p className="px-3 py-2 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                {user.firstName} {user.lastName}
              </p>
            )}
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMenuOpen(false)}
                className={`block px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                  pathname === item.to || pathname.startsWith(item.to)
                    ? 'text-brand-dark dark:text-white bg-gray-50 dark:bg-white/5'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'
                }`}
              >
                {item.label}
              </Link>
            ))}
            {showPunchAction && (
              <Link
                to="/time/punch"
                onClick={() => setMenuOpen(false)}
                className="block px-3 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-dark hover:bg-[#2a3640] transition"
              >
                Check in/out
              </Link>
            )}
            <button
              type="button"
              onClick={() => { setMenuOpen(false); logout(); }}
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
            >
              Sign out
            </button>
          </div>
        )}
      </nav>
    </header>
  );
};

const MenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
    <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
    <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export default AuthenticatedNavbar;
