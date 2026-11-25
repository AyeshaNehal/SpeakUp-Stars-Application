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

  const { step, route, parent } = accountState;
  const currentPath = location.pathname;

  // 1. Public legal pages are always accessible
  if (['/privacy', '/kids-privacy', '/terms'].includes(currentPath)) {
    return <>{children}</>;
  }

  // 2. Unauthenticated users must be on /login
  if (step === 'login' || !parent) {
    if (currentPath === '/login') {
      return <>{children}</>;
    }
    return <Navigate to="/login" replace />;
  }

  // 3. Logged in user visiting /login gets redirected to their next step or home
  if (currentPath === '/login') {
    return <Navigate to={step === 'complete' ? '/' : route} replace />;
  }

  // 4. User who has finished full onboarding cannot re-enter onboarding screens
  if (step === 'complete') {
    if (currentPath === '/verify-email' || currentPath.startsWith('/onboarding')) {
      return <Navigate to="/" replace />;
    }
    return <>{children}</>;
  }

  // 5. Authenticated user actively in onboarding:
  // Allow navigating between onboarding steps smoothly without route-guard bouncing
  if (currentPath.startsWith('/onboarding') || currentPath === '/verify-email') {
    return <>{children}</>;
  }

  // 6. If trying to access any main app route before onboarding finishes, redirect to active step
  return <Navigate to={route} replace />;
};
