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
  
  // The operational role is strictly determined by the authenticated user's registered role.
  // It cannot be overridden by UI controls, localStorage tampering, or client state.
  const role: UserRole = currentUser ? currentUser.role : 'student';

  const [activeNavId, setActiveNavId] = useState<string>(() => {
    return ROLE_NAVIGATION[role]?.[0]?.id || 'dashboard';
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Sync active navigation when authenticated role changes
  useEffect(() => {
    const defaultNav = ROLE_NAVIGATION[role]?.[0]?.id || 'dashboard';
    setActiveNavId(defaultNav);
  }, [role]);

  // Build profile dynamically from authenticated user
  const profile = buildUserProfile(currentUser, role);

  // setRole is preserved for interface compatibility but cannot override the server-authoritative role
  const setRole = (newRole: UserRole) => {
    if (!currentUser) {
      const defaultNav = ROLE_NAVIGATION[newRole]?.[0]?.id || 'dashboard';
      setActiveNavId(defaultNav);
    } else if (newRole !== currentUser.role) {
      console.warn(`[RoleContext] Blocked attempt to change authoritative role from '${currentUser.role}' to '${newRole}'`);
    }
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
