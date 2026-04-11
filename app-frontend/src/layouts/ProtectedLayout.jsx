import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ProtectedLayout = () => {
    const { user, isLoading } = useAuth();
    const { pathname, search, hash } = useLocation();

    if (isLoading) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: `${pathname}${search}${hash}` }} replace />;
    }

    return <Outlet />;
};

export default ProtectedLayout;