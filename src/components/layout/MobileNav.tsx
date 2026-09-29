import React, { useEffect } from 'react';
import { useRole } from '../../context/RoleContext.tsx';
import { ROLE_NAVIGATION, UserRole } from '../../types/navigation.ts';
import { NavIcon } from './NavIcon.tsx';
import { X } from 'lucide-react';

export function MobileNav() {
  const {
    role,
    setRole,
    activeNavId,
    setActiveNavId,
    isMobileNavOpen,
    setIsMobileNavOpen,
    profile,
  } = useRole();

  const navItems = ROLE_NAVIGATION[role];

  useEffect(() => {
    if (isMobileNavOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileNavOpen]);

  if (!isMobileNavOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden flex">
      {/* Backdrop scrim */}
      <div
        onClick={() => setIsMobileNavOpen(false)}
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
        aria-hidden="true"
      />

      {/* Drawer Canvas */}
      <div className="relative w-[300px] max-w-[85vw] h-full bg-[#060608] border-r border-white/[0.09] p-5 flex flex-col z-10 shadow-2xl animate-in slide-in-from-left duration-200">
        {/* Header with Close Button */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="overflow-hidden">
            <div className="text-[10px] font-mono text-red-400 uppercase tracking-wider font-semibold">
              Operational Navigation
            </div>
            <div className="text-sm font-bold text-white font-display truncate">
              {profile.name}
            </div>
          </div>
          <button
            onClick={() => setIsMobileNavOpen(false)}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 border border-white/[0.09] hover:border-red-500/40 transition-colors"
            aria-label="Close navigation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Role Switcher for Mobile */}
        <div className="py-3 border-b border-white/[0.08] space-y-1.5">
          <div className="text-[10px] font-mono uppercase text-zinc-500 font-semibold">
            Active Role
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {(['student', 'staff', 'admin'] as const).map((r) => {
              const isCurrent = role === r;
              return (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold capitalize transition-all border ${
                    isCurrent
                      ? 'bg-red-500/20 text-red-300 border-red-500/50 shadow-xs'
                      : 'bg-[#0E0E12] text-zinc-400 border-white/[0.08] hover:text-white'
                  }`}
                >
                  {r}
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = activeNavId === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveNavId(item.id);
                  setIsMobileNavOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-left text-xs font-medium transition-all min-h-[44px] ${
                  isActive
                    ? 'bg-red-500/15 text-red-300 border border-red-500/35 font-semibold shadow-xs'
                    : 'text-zinc-300 hover:bg-[#121217] hover:text-white border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <NavIcon name={item.iconName} className={`w-4 h-4 ${isActive ? 'text-red-500' : ''}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="font-mono text-[10px] text-red-400 px-1.5 py-0.5 rounded bg-red-950/40 border border-red-500/25">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Identifier */}
        <div className="pt-3 border-t border-white/[0.08] text-[11px] font-mono text-zinc-500 flex items-center justify-between">
          <span>{profile.identifier}</span>
          <span className="text-emerald-400 font-medium">Online</span>
        </div>
      </div>
    </div>
  );
}
