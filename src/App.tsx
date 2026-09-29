import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { RoleProvider } from './context/RoleContext.tsx';
import { MainLayout } from './components/layout/MainLayout.tsx';
import { AuthLanding } from './components/auth/AuthLanding.tsx';

function AppContent() {
  const { isAuthenticated } = useAuth();

  // If not authenticated, user sees the authentication & onboarding flow
  if (!isAuthenticated) {
    return <AuthLanding />;
  }

  // Once authenticated, access the protected role workspace & shell
  return (
    <RoleProvider>
      <MainLayout />
    </RoleProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
