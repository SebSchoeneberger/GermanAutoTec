import { useAuth } from '../hooks/useAuth';

const Profile = () => {
  const { user } = useAuth();

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Profile</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-gray-700 font-semibold mb-1">Name</label>
          <p className="text-gray-600">{user.firstName} {user.lastName}</p>
        </div>
        <div>
          <label className="block text-gray-700 font-semibold mb-1">Email</label>
          <p className="text-gray-600">{user.email}</p>
        </div>
        <div>
          <label className="block text-gray-700 font-semibold mb-1">Role</label>
          <p className="text-gray-600 capitalize">{user.role}</p>
        </div>
      </div>
    </div>
  );
};

export default Profile;