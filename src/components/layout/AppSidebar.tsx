import React, { useRef, useState } from 'react';
import { useRole } from '../../context/RoleContext.tsx';
import { ROLE_NAVIGATION, NavItem } from '../../types/navigation.ts';
import { NavIcon } from './NavIcon.tsx';
import { GraduationCap, Wrench, Shield, ChevronLeft, ChevronRight } from 'lucide-react';

export function AppSidebar() {
  const { role, activeNavId, setActiveNavId, isSidebarCollapsed, toggleSidebar, profile } = useRole();
  const navItems = ROLE_NAVIGATION[role];

  const roleTheme = {
    student: {
      accentBorder: 'border-red-500/40',
      activeBg: 'bg-red-600/10',
      activeText: 'text-red-300 font-semibold',
      indicator: 'bg-[#E50914] shadow-[0_0_10px_rgba(229,9,20,0.9)]',
      badge: 'text-red-400',
      portalTitle: 'STUDENT PORTAL',
      icon: GraduationCap,
    },
    staff: {
      accentBorder: 'border-red-500/40',
      activeBg: 'bg-red-600/10',
      activeText: 'text-red-300 font-semibold',
      indicator: 'bg-[#FF2E3B] shadow-[0_0_10px_rgba(255,46,59,0.9)]',
      badge: 'text-red-400',
      portalTitle: 'STAFF CONSOLE',
      icon: Wrench,
    },
    admin: {
      accentBorder: 'border-red-500/40',
      activeBg: 'bg-red-600/10',
      activeText: 'text-red-300 font-semibold',
      indicator: 'bg-[#DC2626] shadow-[0_0_10px_rgba(220,38,38,0.9)]',
      badge: 'text-red-400',
      portalTitle: 'ADMIN COMMAND',
      icon: Shield,
    },
  }[role];

  const RoleIcon = roleTheme.icon;

  return (
    <aside
      className={`hidden md:flex flex-col shrink-0 border-r border-white/[0.08] bg-[#050507]/95 backdrop-blur-2xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] z-30 relative select-none ${
        isSidebarCollapsed ? 'w-[72px]' : 'w-[260px]'
      }`}
    >
      {/* Top Role Indicator Plaque */}
      <div className="p-4 border-b border-white/[0.07] flex items-center justify-between">
        {!isSidebarCollapsed ? (
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#0C0C10] border border-white/[0.09] shrink-0 text-red-500 shadow-sm">
              <RoleIcon className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <div className="text-[10px] font-mono tracking-wider uppercase text-zinc-400 font-semibold truncate">
                {roleTheme.portalTitle}
              </div>
              <div className="text-xs font-semibold text-slate-200 truncate">
                {profile.department.split('&')[0]}
              </div>
            </div>
          </div>
        ) : (
          <div className="mx-auto flex items-center justify-center w-8 h-8 rounded-lg bg-[#0C0C10] border border-white/[0.09] text-red-500 shadow-sm" title={roleTheme.portalTitle}>
            <RoleIcon className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Navigation Links Scrollable List */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {!isSidebarCollapsed && (
          <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-semibold">
            Operational Menu
          </div>
        )}

        {navItems.map((item) => {
          const isActive = activeNavId === item.id;
          return (
            <SidebarNavItem
              key={item.id}
              item={item}
              isActive={isActive}
              isCollapsed={isSidebarCollapsed}
              roleTheme={roleTheme}
              onClick={() => setActiveNavId(item.id)}
            />
          );
        })}
      </nav>

      {/* Bottom Institutional Health & Collapse Quick-Action Strip */}
      <div className="p-3 border-t border-white/[0.07] bg-black/60 space-y-2">
        {!isSidebarCollapsed ? (
          <div className="p-2.5 rounded-xl border border-white/[0.08] bg-[#0A0A0E] flex items-center justify-between">
            <div className="space-y-0.5 overflow-hidden pr-2">
              <div className="text-[10px] font-mono uppercase text-zinc-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>JIRA CLOUD SYNC</span>
              </div>
              <div className="text-xs text-slate-300 font-medium truncate">
                Rest API v3 · Active
              </div>
            </div>
            <span className="text-[11px] font-mono text-red-400 font-semibold shrink-0">99.8%</span>
          </div>
        ) : (
          <div className="flex justify-center" title="Jira Cloud Sync: Active (99.8%)">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          </div>
        )}
      </div>
    </aside>
  );
}

interface SidebarNavItemProps {
  item: NavItem;
  isActive: boolean;
  isCollapsed: boolean;
  roleTheme: {
    accentBorder: string;
    activeBg: string;
    activeText: string;
    indicator: string;
    badge: string;
  };
  onClick: () => void;
}

function SidebarNavItem({ item, isActive, isCollapsed, roleTheme, onClick }: SidebarNavItemProps) {
  const [glint, setGlint] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);
  const itemRef = useRef<HTMLButtonElement | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!itemRef.current) return;
    const rect = itemRef.current.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    setGlint({ x, y });
  };

  return (
    <div className="relative group/item">
      <button
        ref={itemRef}
        onClick={onClick}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`group relative w-full flex items-center rounded-xl transition-all duration-200 cursor-pointer overflow-hidden border text-left ${
          isCollapsed ? 'justify-center p-2.5 min-h-[44px]' : 'px-3.5 py-2.5 min-h-[44px] gap-3'
        } ${
          isActive
            ? `${roleTheme.activeBg} border-white/[0.14] ${roleTheme.activeText} shadow-sm`
            : 'border-transparent text-zinc-400 hover:text-white hover:bg-[#111116] hover:border-white/[0.08]'
        }`}
      >
        {/* Active Navigation Vertical Bright Red Indicator Bar */}
        {isActive && (
          <span
            className={`absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full ${roleTheme.indicator}`}
            aria-hidden="true"
          />
        )}

        {/* Cursor-tracking subtle red specular glow on hover */}
        <span
          className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition-opacity duration-200"
          style={{
            opacity: isHovered ? 1 : 0,
            background: `radial-gradient(120px circle at ${glint.x}% ${glint.y}%, rgba(229, 9, 20, 0.12), transparent 70%)`,
          }}
          aria-hidden="true"
        />

        {/* Nav Icon */}
        <span
          className={`shrink-0 transition-transform duration-200 ${
            isActive ? 'scale-110 text-red-500' : 'group-hover:scale-105 group-hover:text-red-400'
          }`}
        >
          <NavIcon name={item.iconName} className="w-4 h-4" />
        </span>

        {/* Text Label & Badge (when expanded) */}
        {!isCollapsed && (
          <div className="flex-1 flex items-center justify-between min-w-0">
            <span className="text-xs truncate">{item.label}</span>
            {item.badge && (
              <span className="font-mono text-[10px] text-red-400 px-1.5 py-0.5 rounded bg-red-950/40 border border-red-500/25 shrink-0 ml-1.5 font-medium">
                {item.badge}
              </span>
            )}
          </div>
        )}
      </button>

      {/* Floating Spatial Tooltip for Collapsed Sidebar State */}
      {isCollapsed && (
        <div className="pointer-events-none absolute left-full ml-2.5 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-[#0C0C10] border border-white/[0.12] text-xs text-white shadow-xl opacity-0 group-hover/item:opacity-100 transition-opacity duration-150 z-50 whitespace-nowrap">
          <div className="font-semibold flex items-center gap-1.5">
            <span>{item.label}</span>
            {item.badge && (
              <span className="text-[10px] font-mono text-red-400">({item.badge})</span>
            )}
          </div>
          <div className="text-[10px] text-zinc-400 max-w-[200px] truncate">
            {item.description}
          </div>
        </div>
      )}
    </div>
  );
}
