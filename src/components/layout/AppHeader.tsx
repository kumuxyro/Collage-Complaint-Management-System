import React from 'react';
import { useRole } from '../../context/RoleContext.tsx';
import { ROLE_NAVIGATION } from '../../types/navigation.ts';
import { ProfilePopover } from './ProfilePopover.tsx';
import { NotificationPopover } from './NotificationPopover.tsx';
import { 
  Search, 
  Menu, 
  PanelLeftClose, 
  PanelLeft, 
  ChevronRight,
  ShieldAlert,
  GraduationCap,
  Wrench,
  Sparkles
} from 'lucide-react';

export function AppHeader() {
  const { 
    role, 
    setRole, 
    activeNavId, 
    isSidebarCollapsed, 
    toggleSidebar, 
    setIsMobileNavOpen,
    profile,
    searchQuery,
    setSearchQuery 
  } = useRole();

  const currentNav = ROLE_NAVIGATION[role].find((n) => n.id === activeNavId);

  const roleMeta = {
    student: { 
      label: 'STUDENT', 
      title: 'Student Portal',
      icon: GraduationCap, 
      color: 'text-red-400',
      badgeClass: 'bg-red-950/40 border-red-500/30 text-red-400',
    },
    staff: { 
      label: 'STAFF', 
      title: 'Staff Console',
      icon: Wrench, 
      color: 'text-red-400',
      badgeClass: 'bg-red-950/40 border-red-500/30 text-red-400',
    },
    admin: { 
      label: 'ADMIN', 
      title: 'Admin Command',
      icon: ShieldAlert, 
      color: 'text-red-500',
      badgeClass: 'bg-red-900/40 border-red-500/40 text-red-300',
    },
  }[role];

  const RoleIcon = roleMeta.icon;

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#040406]/92 backdrop-blur-2xl px-4 sm:px-6 py-3.5 flex items-center justify-between transition-colors">
      {/* Zone 1: Sidebar Toggle, Brand Wordmark & Role Indicator */}
      <div className="flex items-center gap-3">
        {/* Mobile Navigation Drawer Toggle */}
        <button
          onClick={() => setIsMobileNavOpen(true)}
          className="md:hidden p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 border border-white/[0.09] hover:border-red-500/40 transition-colors cursor-pointer"
          aria-label="Open mobile navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Desktop Sidebar Collapse Toggle */}
        <button
          onClick={toggleSidebar}
          className="hidden md:flex p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 border border-white/[0.09] hover:border-red-500/40 transition-colors cursor-pointer"
          title={isSidebarCollapsed ? 'Expand sidebar (Ctrl+\\)' : 'Collapse sidebar'}
          aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isSidebarCollapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>

        {/* Minimal Premium Brand Wordmark */}
        <a
          href="/"
          className="text-sm sm:text-base font-bold tracking-tight text-white hover:text-red-500 transition-colors font-display select-none whitespace-nowrap flex items-center gap-2.5"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-[#E50914] shadow-[0_0_10px_rgba(229,9,20,0.9)]" />
          <span className="tracking-tight">COLLEGE CMS</span>
        </a>

        {/* Prominent Role Indicator Badge */}
        <div className="hidden sm:flex items-center gap-1.5 pl-3 border-l border-white/[0.08]">
          <span
            className={`flex items-center gap-1.5 text-[11px] font-mono px-2 py-0.5 rounded-md border font-semibold tracking-wider ${roleMeta.badgeClass}`}
            title={`Active role: ${roleMeta.title}`}
          >
            <RoleIcon className="w-3 h-3 shrink-0" />
            <span>{roleMeta.label}</span>
          </span>

          <span className="hidden xl:flex items-center gap-1 text-xs text-zinc-500">
            <ChevronRight className="w-3 h-3 text-zinc-600" />
            <span className="text-zinc-200 font-medium">{currentNav?.label || 'Overview'}</span>
          </span>
        </div>
      </div>

      {/* Zone 2: Global Search Bar */}
      <div className="hidden md:flex items-center max-w-xs w-full mx-4">
        <div className="relative w-full group">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none group-focus-within:text-red-400 transition-colors" />
          <input
            type="text"
            placeholder={`Search ${role} workspace...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#08080B] border border-white/[0.09] rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder:text-zinc-500 focus:outline-none focus:border-red-500/70 focus:ring-1 focus:ring-red-500/40 transition-all"
          />
          <kbd className="hidden xl:inline-block absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-zinc-500 bg-black px-1.5 py-0.5 rounded border border-white/[0.08] pointer-events-none">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Zone 3: Role Switcher, Notification Control & User Profile */}
      <div className="flex items-center gap-2.5">
        {/* Quick Role Segmented Switcher (Desktop) */}
        <div className="hidden sm:flex items-center gap-1 p-1 bg-[#09090D] border border-white/[0.08] rounded-xl">
          {(['student', 'staff', 'admin'] as const).map((r) => {
            const isActive = role === r;
            return (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer capitalize whitespace-nowrap ${
                  isActive
                    ? 'bg-red-500/15 text-red-300 border border-red-500/40 shadow-xs font-semibold'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
                }`}
              >
                {r}
              </button>
            );
          })}
        </div>

        {/* Interactive Notification Control Popover */}
        <NotificationPopover />

        {/* User Identity & Profile Control */}
        <ProfilePopover />
      </div>
    </header>
  );
}
