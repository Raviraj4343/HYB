import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // Show loader while auth state is resolving
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Not logged in → go to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Logged in but not admin/moderator → go to dashboard
  if (user.role !== 'admin' && user.role !== 'moderator' && user.role !== 'super_admin') {
    return <Navigate to="/dashboard" replace />;
  }

  // Authorized
  return children;
};

export default AdminRoute;
