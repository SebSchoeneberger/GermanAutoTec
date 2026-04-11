import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import CreateUserModal from '../components/CreateUserModal';
import DashboardCard from '../components/DashboardCard';
import { canAccessMyTime, canAccessTeamTime, getTimeHomePath } from '../utils/timeAccess';

const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
  </svg>
);

const SparePartsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
    <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
  </svg>
);

const PointsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z" />
  </svg>
);

const FinancialsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

const ActivityIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

const TimeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <section className="py-2">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-brand-dark dark:text-white">Dashboard</h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">Welcome, {user?.firstName}!</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <DashboardCard title="Users" icon={<UsersIcon />} description="Manage users in the system." />
        <DashboardCard title="Spare Parts" icon={<SparePartsIcon />} description="Manage spare parts in the inventory." onClick={() => navigate('/spare-parts')} />
        <DashboardCard title="Points" icon={<PointsIcon />} description="See and request points." />
        <DashboardCard title="Financials" icon={<FinancialsIcon />} description="See and manage financial data." />
        {['admin', 'manager'].includes(user?.role) && (
          <DashboardCard
            title="Activity Log"
            icon={<ActivityIcon />}
            description="Track all inventory changes and actions."
            onClick={() => navigate('/spare-parts/activity')}
          />
        )}
        {(canAccessTeamTime(user?.role) || canAccessMyTime(user?.role)) && (
          <DashboardCard
            title="Time Management"
            icon={<TimeIcon />}
            description={
              canAccessTeamTime(user?.role)
                ? 'See who is currently checked in and open employee time details.'
                : 'See your current status and today\'s check-in / check-out timeline.'
            }
            onClick={() => navigate(getTimeHomePath(user?.role))}
          />
        )}
      </div>

      {user?.role === 'admin' && (
        <div className="mt-8">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-brand-dark hover:bg-[#2a3640] rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-brand-dark/50 focus:ring-offset-2 dark:focus:ring-offset-[#0a0a0b]"
          >
            Create new user
          </button>
          <CreateUserModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>
      )}
    </section>
  );
};

export default AdminDashboard;
