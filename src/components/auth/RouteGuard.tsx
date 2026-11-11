import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useParentAuth } from '../../context/ParentAuthContext';

interface RouteGuardProps {
  children: React.ReactNode;
}

export const RouteGuard: React.FC<RouteGuardProps> = ({ children }) => {
  const { accountState, isLoading } = useParentAuth();
  const location = useLocation();

  if (isLoading || !accountState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-4 border-amber-400 border-t-transparent animate-spin" />
          <p className="font-heading font-bold text-slate-600 text-sm">Checking account status...</p>
        </div>
      </div>
    );
  }

  const { step, route } = accountState;
  const currentPath = location.pathname;

  // Public legal pages are always accessible
  if (['/privacy', '/kids-privacy', '/terms'].includes(currentPath)) {
    return <>{children}</>;
  }

  // If user has not completed onboarding and is trying to access protected content
  if (step !== 'complete') {
    // If user is already on the exact unmet step route, allow rendering it
    if (currentPath === route) {
      return <>{children}</>;
    }
    // Otherwise redirect to the first unmet step
    return <Navigate to={route} replace />;
  }

  // If user has completed onboarding but visits an onboarding / login screen, redirect to Home
  if (
    currentPath === '/login' ||
    currentPath === '/verify-email' ||
    currentPath.startsWith('/onboarding')
  ) {
    return <Navigate to="/" replace />;
  }

  // Fully onboarded and on a normal route
  return <>{children}</>;
};
