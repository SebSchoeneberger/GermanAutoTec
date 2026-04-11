import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getTimeHomePath } from '../../utils/timeAccess';

const TimeHome = () => {
  const { user } = useAuth();
  const destination = getTimeHomePath(user?.role);
  return <Navigate to={destination} replace />;
};

export default TimeHome;
