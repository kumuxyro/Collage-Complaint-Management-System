import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole, UserProfile, ROLE_NAVIGATION, buildUserProfile } from '../types/navigation.ts';
import { useAuth } from './AuthContext.tsx';

interface RoleContextValue {
  role: UserRole;
  setRole: (role: UserRole) => void;
  profile: UserProfile;
  activeNavId: string;
  setActiveNavId: (id: string) => void;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  isMobileNavOpen: boolean;
  setIsMobileNavOpen: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

const RoleContext = createContext<RoleContextValue | undefined>(undefined);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  
  // Initialize role to current user's role if authenticated, otherwise default to 'student'
  const [role, setRoleState] = useState<UserRole>(() => {
    return currentUser ? currentUser.role : 'student';
  });

  const [activeNavId, setActiveNavId] = useState<string>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Sync role when authenticated user changes
  useEffect(() => {
    if (currentUser) {
      setRoleState(currentUser.role);
      setActiveNavId('dashboard');
    }
  }, [currentUser]);

  // Build profile dynamically from authenticated user
  // When unauthenticated, returns neutral "Guest User" and "Not signed in"
  const profile = buildUserProfile(currentUser, role);

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    const defaultNav = ROLE_NAVIGATION[newRole][0].id;
    setActiveNavId(defaultNav);
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => !prev);
  };

  return (
    <RoleContext.Provider
      value={{
        role,
        setRole,
        profile,
        activeNavId,
        setActiveNavId,
        isSidebarCollapsed,
        toggleSidebar,
        isMobileNavOpen,
        setIsMobileNavOpen,
        searchQuery,
        setSearchQuery,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}
