import { useState, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { signIn } from '../services/userApi';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const baseInputClass =
  'w-full px-4 py-3 rounded-xl border bg-white dark:bg-white/5 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 transition';

const normalInput = `${baseInputClass} border-gray-200 dark:border-white/10 focus:ring-brand-dark/50 dark:focus:ring-white/30 focus:border-brand-dark dark:focus:border-white/20`;
const errorInput  = `${baseInputClass} border-red-400 dark:border-red-500 focus:ring-red-400/40 dark:focus:ring-red-500/40`;

const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5';

const FieldError = ({ msg }) =>
  msg ? <p className="mt-1.5 text-xs text-red-500 dark:text-red-400">{msg}</p> : null;

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
      toast.error(error?.message || 'An error occurred during sign in');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center py-12">
      <div className="w-full max-w-md">
        <div className="border-gradient-brand rounded-2xl bg-white dark:bg-[#141518] p-8 sm:p-10 shadow-xl shadow-gray-200/50 dark:shadow-black/30">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-brand-dark dark:text-white">Sign in</h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">German AutoTec employee portal</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="email" className={labelClass}>Email</label>
              <input
                type="email"
                id="email"
                className={errors.email ? errorInput : normalInput}
                placeholder="you@company.com"
                autoComplete="email"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Enter a valid email address',
                  },
                })}
              />
              <FieldError msg={errors.email?.message} />
            </div>

            <div>
              <label htmlFor="password" className={labelClass}>Password</label>
              <input
                type="password"
                id="password"
                className={errors.password ? errorInput : normalInput}
                placeholder="••••••••"
                autoComplete="current-password"
                {...register('password', { required: 'Password is required' })}
              />
              <FieldError msg={errors.password?.message} />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-xl text-sm font-semibold text-white bg-brand-dark hover:bg-[#2a3640] focus:outline-none focus:ring-2 focus:ring-brand-dark focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isLoading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            <Link to="/" className="text-brand-dark dark:text-brand-light hover:underline focus:outline-none focus:ring-2 focus:ring-brand-dark/50 dark:focus:ring-white/30 rounded">
              Back to home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
