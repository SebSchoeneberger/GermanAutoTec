import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const AuthenticatedNavbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">
          GermanAutoTec
        </Link>
        <div className="flex items-center space-x-4">
          <span className="ml-4 font-semibold">
            Welcome, {user?.firstName}
          </span>
          <Link to="/" className="hover:text-gray-300">
            Home
          </Link>
          <Link to="/profile" className="hover:text-gray-300">
            Profile
          </Link>
          <button
            onClick={logout}
            className="bg-red-600 px-4 py-2 rounded hover:bg-red-700 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default AuthenticatedNavbar;