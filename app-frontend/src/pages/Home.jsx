import { Link } from 'react-router-dom';
import heroImg from '../assets/img/IMG_20210919_150803.jpg';

const Home = () => {
  return (
    <div className="flex flex-col">
      {/* Hero section – hero image as background with overlay */}
      <section className="relative min-h-[60vh] sm:min-h-[70vh] flex items-center overflow-hidden rounded-2xl bg-brand-dark">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImg})` }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
        <div className="absolute -top-40 -right-40 w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] rounded-full bg-brand-dark/40 blur-[100px]" aria-hidden />
        <div className="absolute bottom-0 right-1/4 w-32 sm:w-48 h-32 sm:h-48 rounded-full bg-brand-muted/20 blur-[80px]" aria-hidden />

        <div className="relative z-10 w-full mx-auto max-w-6xl px-5 sm:px-6 lg:px-8 py-10 sm:py-16">
          <div className="max-w-2xl">
            <p className="text-brand-light text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] mb-4">
              Internal Portal
            </p>
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Welcome to
              <br />
              <span className="text-gradient-hero">German AutoTec</span>
            </h1>
            <p className="mt-4 text-base sm:text-lg text-gray-300">
              Your trusted partner for German auto maintenance and repairs. Sign in to access the employee portal.
            </p>
            <div className="mt-6 sm:mt-8 flex flex-wrap gap-3 sm:gap-4">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-5 sm:px-6 py-3 sm:py-3.5 text-sm font-semibold text-white bg-brand-dark border border-white/20 hover:bg-[#2a3640] hover:border-white/30 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-brand-dark"
              >
                Sign in
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <a
                href="https://www.german-autotec.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 sm:px-6 py-3 sm:py-3.5 text-sm font-semibold text-white border-2 border-white/30 hover:border-white/50 hover:bg-white/5 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/40 focus:ring-offset-2 focus:ring-offset-brand-dark"
              >
                Visit website
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Short info strip */}
      <section className="mt-10 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          For access issues, contact your administrator.
        </p>
      </section>
    </div>
  );
};

export default Home;
