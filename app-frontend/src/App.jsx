import { createBrowserRouter, createRoutesFromElements, Navigate, Outlet, Route, RouterProvider } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Profile from './pages/users/Profile';
import Login from './pages/Login';
import SetPassword from './pages/users/SetPassword';
import Users from './pages/users/Users';
import ProtectedLayout from './layouts/ProtectedLayout';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Dashboard from './pages/Dashboard';
import SpareParts from './pages/spare-parts/SpareParts';
import SparePartsActivity from './pages/spare-parts/SparePartsActivity';
import TimeHome from './pages/time/TimeHome';
import TimeDisplay from './pages/time/TimeDisplay';
import TimePunch from './pages/time/TimePunch';
import TimeTeam from './pages/time/TimeTeam';
import TimeEmployeeProfile from './pages/time/TimeEmployeeProfile';
import TimeMy from './pages/time/TimeMy';
import TimeHolidays from './pages/time/TimeHolidays';
import { useAuth } from './hooks/useAuth';

// Redirects / → /dashboard (or /time/display for workshop) when authenticated,
// and → /login when not. Waits for auth initialisation before navigating.
const RootRedirect = () => {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (user?.role === 'workshop') return <Navigate to="/time/display" replace />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <Navigate to="/login" replace />;
};

const router = createBrowserRouter(
  createRoutesFromElements(
    // Pathless root wrapper — lets /login and / share the same router
    // without forcing /login into MainLayout.
    <Route>
      <Route path="login" element={<Login />} />

      <Route path="/" element={<MainLayout />}>
        <Route index element={<RootRedirect />} />

        <Route element={<ProtectedLayout />}>
          <Route path="set-password" element={<SetPassword />} />
          <Route path="profile" element={<Profile />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="spare-parts" element={<SpareParts />} />
          <Route path="spare-parts/activity" element={<SparePartsActivity />} />
          <Route path="time" element={<Outlet />}>
            <Route index element={<TimeHome />} />
            <Route path="display" element={<TimeDisplay />} />
            <Route path="punch" element={<TimePunch />} />
            <Route path="team" element={<TimeTeam />} />
            <Route path="team/:employeeId" element={<TimeEmployeeProfile />} />
            <Route path="holidays" element={<TimeHolidays />} />
            <Route path="my" element={<TimeMy />} />
          </Route>
        </Route>
      </Route>
    </Route>,
  ),
);

const App = () => (
  <ThemeProvider>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </ThemeProvider>
);

export default App;
