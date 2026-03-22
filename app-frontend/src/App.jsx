import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Login from './pages/Login';
import ProtectedLayout from './layouts/ProtectedLayout';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Dashboard from './pages/Dashboard';
import SpareParts from './pages/SpareParts';
import ActivityPage from './pages/ActivityPage';

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<MainLayout />}>
      <Route index element={<Home />} />
      <Route path="login" element={<Login />} />

      <Route element={<ProtectedLayout />}>
        <Route path="profile" element={<Profile />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="spare-parts" element={<SpareParts />} />
        <Route path="spare-parts/activity" element={<ActivityPage />} />
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
