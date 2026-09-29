import React, { useRef, useState, useEffect } from 'react';
import { useRole } from '../../context/RoleContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { UserRole } from '../../types/navigation.ts';
import { ChevronDown, Check, LogOut, Shield } from 'lucide-react';

export function ProfilePopover() {
  const { role, setRole, profile } = useRole();
  const { signOut, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('pointerdown', handleOutsideClick);
    return () => document.removeEventListener('pointerdown', handleOutsideClick);
  }, []);

  const rolesList: { id: UserRole; title: string; subtitle: string }[] = [
    { id: 'student', title: 'Student Portal', subtitle: 'Submit & track personal grievances' },
    { id: 'staff', title: 'Staff Console', subtitle: 'Departmental triage & workorders' },
    { id: 'admin', title: 'Admin Command', subtitle: 'Institutional governance & Jira rules' },
  ];

  const handleLogout = () => {
    setIsOpen(false);
    signOut();
  };

  // Initials for avatar
  const initials = profile.name && profile.name !== 'Guest User'
    ? profile.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'GU';

  return (
    <div className="relative" ref={containerRef}>
      {/* Profile Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 p-1.5 pr-2.5 rounded-xl border border-white/[0.09] bg-[#0A0A0E] hover:bg-[#121217] hover:border-red-500/40 transition-all cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
      >
        <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-red-600/25 to-rose-700/20 border border-red-500/40 text-red-300 font-semibold text-xs font-mono">
          {initials}
          {/* Active status micro-dot */}
          <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#040406] ${
            isAuthenticated ? 'bg-emerald-400' : 'bg-zinc-500'
          }`} />
        </div>

        <div className="hidden sm:block text-left">
          <div className="text-xs font-semibold text-white group-hover:text-red-400 transition-colors truncate max-w-[120px]">
            {profile.name}
          </div>
          <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
            {profile.role}
          </div>
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-red-500' : ''
          }`}
        />
      </button>

      {/* Spatial Dropdown Card */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-white/[0.12] bg-[#08080C]/98 backdrop-blur-2xl shadow-[0_20px_50px_-10px_rgba(0,0,0,0.95)] p-4 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-4">
          {/* Profile Header */}
          <div className="pb-3 border-b border-white/[0.08] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-red-400 font-medium">
                IDENTIFIER: {profile.identifier}
              </span>
              <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {isAuthenticated ? 'Authenticated' : 'Not signed in'}
              </span>
            </div>
            <div className="text-sm font-bold text-white pt-1">{profile.name}</div>
            <div className="text-xs text-zinc-400">{profile.email}</div>
            <div className="text-[11px] text-zinc-400 pt-1 flex items-center gap-1.5">
              <span className="text-zinc-500">Dept:</span>
              <span className="text-zinc-300 font-medium truncate">{profile.department}</span>
            </div>
          </div>

          {/* Role Switcher if Authenticated / Multi-Role */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold px-1">
              Operational Workspace
            </div>

            <div className="space-y-1">
              {rolesList.map((r) => {
                const isCurrent = role === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => {
                      setRole(r.id);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isCurrent
                        ? 'bg-red-500/15 border-red-500/45 text-white shadow-sm'
                        : 'bg-[#0E0E12] border-transparent hover:bg-[#14141A] hover:border-white/[0.09] text-zinc-300'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-semibold flex items-center gap-1.5">
                        <span className={isCurrent ? 'text-red-400 font-bold' : 'text-zinc-300'}>
                          {r.title}
                        </span>
                      </div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">{r.subtitle}</div>
                    </div>
                    {isCurrent && <Check className="w-4 h-4 text-red-500 shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Proper LOG OUT Action */}
          <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-red-950/30 border border-red-500/30 text-red-400 hover:bg-red-900/40 hover:border-red-500/60 hover:text-white text-xs font-semibold transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>LOG OUT</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
