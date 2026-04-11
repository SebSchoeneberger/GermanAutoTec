import { createBrowserRouter, createRoutesFromElements, Outlet, Route, RouterProvider } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Login from './pages/Login';
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

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<MainLayout />}>
      <Route index element={<Home />} />
      <Route path="login" element={<Login />} />

      <Route element={<ProtectedLayout />}>
        <Route path="profile" element={<Profile />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="spare-parts" element={<SpareParts />} />
        <Route path="spare-parts/activity" element={<SparePartsActivity />} />
        <Route path="time" element={<Outlet />}>
          <Route index element={<TimeHome />} />
          <Route path="display" element={<TimeDisplay />} />
          <Route path="punch" element={<TimePunch />} />
          <Route path="team" element={<TimeTeam />} />
          <Route path="team/:employeeId" element={<TimeEmployeeProfile />} />
          <Route path="my" element={<TimeMy />} />
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
