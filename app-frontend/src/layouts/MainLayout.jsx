import { Outlet } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from '../components/Navbar';
import AuthenticatedNavbar from '../components/AuthenticatedNavbar';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';

const MainLayout = () => {
  const { user } = useAuth();
  const { theme } = useTheme();

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0b] text-gray-800 dark:text-gray-100">
      {user ? <AuthenticatedNavbar /> : <Navbar />}
      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <Outlet />
      </main>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={theme === 'dark' ? 'dark' : 'light'}
      />
    </div>
  );
};

export default MainLayout;
