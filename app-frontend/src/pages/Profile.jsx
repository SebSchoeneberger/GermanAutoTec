import { useAuth } from '../hooks/useAuth';

const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';
const valueClass = 'text-gray-800 dark:text-gray-200';

const Profile = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex justify-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Loading…</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-4">
      <div className="border-gradient-brand rounded-2xl bg-white dark:bg-[#141518] p-8 shadow-xl shadow-gray-200/50 dark:shadow-black/30">
        <h2 className="text-2xl font-bold text-brand-dark dark:text-white text-center mb-8">Profile</h2>
        <div className="space-y-6">
          <div>
            <label className={labelClass}>Name</label>
            <p className={valueClass}>{user.firstName} {user.lastName}</p>
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <p className={valueClass}>{user.email}</p>
          </div>
          <div>
            <label className={labelClass}>Role</label>
            <p className={valueClass}>{user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : user.role}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
