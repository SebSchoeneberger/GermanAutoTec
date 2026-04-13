import { useState, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { signIn } from '../services/userApi';
import { AuthContext } from '../context/AuthContext';
import logo from '../assets/img/logo.png';

const inputClass =
  'w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 transition text-sm';

const errorInputClass =
  'w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-red-500/50 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 transition text-sm';

const FieldError = ({ msg }) =>
  msg ? <p className="mt-1.5 text-xs text-red-400">{msg}</p> : null;

const EnvelopeIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
      d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
  </svg>
);

const LockIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
      d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
  </svg>
);

const ArrowUpRightIcon = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
  </svg>
);

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const res = await signIn(data);
      if (res.status === 'success') {
        login(res.user, res.token);
        toast.success('Successfully signed in.');
        const from = location.state?.from;
        if (from && typeof from === 'string') {
          navigate(from);
        } else if (res.user?.role === 'workshop') {
          navigate('/time/display');
        } else {
          navigate('/dashboard');
        }
      } else {
        toast.error(res.message || 'Sign in failed');
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        error.response?.data?.error ||
        'An error occurred during sign in',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-5 relative overflow-hidden">
      {/* Background gradient orbs */}
      <div
        className="absolute -top-48 -right-48 w-96 h-96 rounded-full bg-brand-dark/40 blur-[120px] pointer-events-none"
        aria-hidden
      />
      <div
        className="absolute -bottom-48 -left-48 w-80 h-80 rounded-full bg-brand-muted/10 blur-[100px] pointer-events-none"
        aria-hidden
      />

      {/* Login card */}
      <div className="relative z-10 w-full max-w-sm animate-fade-slide-up">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl shadow-black/50">

          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img
              src={logo}
              alt="German AutoTec"
              className="h-12 w-auto object-contain"
            />
          </div>

          {/* Heading */}
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold text-white">German AutoTec</h1>
            <p className="mt-1 text-xs text-brand-muted uppercase tracking-widest">
              Employee Portal
            </p>
          </div>

          <div className="border-t border-white/[0.08] mb-6" />

          {/* Form */}
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            {/* Email */}
            <div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none">
                  <EnvelopeIcon />
                </span>
                <input
                  type="email"
                  id="email"
                  placeholder="Email address"
                  autoComplete="email"
                  className={errors.email ? errorInputClass : inputClass}
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: 'Enter a valid email address',
                    },
                  })}
                />
              </div>
              <FieldError msg={errors.email?.message} />
            </div>

            {/* Password */}
            <div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none">
                  <LockIcon />
                </span>
                <input
                  type="password"
                  id="password"
                  placeholder="Password"
                  autoComplete="current-password"
                  className={errors.password ? errorInputClass : inputClass}
                  {...register('password', { required: 'Password is required' })}
                />
              </div>
              <FieldError msg={errors.password?.message} />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-xl text-sm font-semibold text-white bg-brand-dark border border-white/10 hover:bg-[#2a3640] hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isLoading ? 'Signing in…' : 'Sign in →'}
            </button>
          </form>

          {/* Website link */}
          <div className="mt-6 text-center">
            <a
              href="https://www.german-autotec.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-brand-muted hover:text-brand-light transition"
            >
              <ArrowUpRightIcon />
              Visit german-autotec.com
            </a>
          </div>
        </div>
      </div>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </div>
  );
};

export default Login;
