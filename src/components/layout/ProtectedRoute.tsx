import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuthSession } from '../../services/authService';
import type { UserRole } from '../../types/auth';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const location = useLocation();
  const { session, isAuthenticated, role, user } = useAuthSession();

  if (!isAuthenticated || !session || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.status === 'inactive') {
    return (
      <Navigate
        to="/login"
        state={{ error: 'Your account has been deactivated. Please contact your system administrator.' }}
        replace
      />
    );
  }

  // Check role authorization if restricted
  if (allowedRoles && allowedRoles.length > 0 && role) {
    if (!allowedRoles.includes(role)) {
      // Unauthorized direct URL access -> redirect to dashboard
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children ? <>{children}</> : <Outlet />;
};
