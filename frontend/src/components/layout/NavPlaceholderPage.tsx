import React from 'react';
import { useRole } from '../../context/RoleContext.tsx';
import { ROLE_NAVIGATION } from '../../types/navigation.ts';
import { SpatialCard } from '../design-system/SpatialCard.tsx';
import { StatusIndicator } from '../design-system/StatusIndicator.tsx';
import { NavIcon } from './NavIcon.tsx';
import { CheckCircle2, ShieldCheck } from 'lucide-react';

export function NavPlaceholderPage() {
  const { role, activeNavId, profile, searchQuery } = useRole();
  const navItem = ROLE_NAVIGATION[role].find((n) => n.id === activeNavId) || ROLE_NAVIGATION[role][0];

  const roleSpecs = {
    student: {
      accent: 'text-red-400',
      tag: 'STUDENT WORKSPACE',
      slaBadge: 'Guaranteed 24h SLA',
    },
    staff: {
      accent: 'text-red-400',
      tag: 'DEPARTMENT CONSOLE',
      slaBadge: 'Realtime SLA Clocks',
    },
    admin: {
      accent: 'text-red-500',
      tag: 'INSTITUTIONAL COMMAND',
      slaBadge: 'SLA Breach Radar',
    },
  }[role];

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      {/* Search Filter Bar Alert if user types in search */}
      {searchQuery && (
        <div className="p-3 rounded-xl border border-red-500/35 bg-red-950/20 text-xs text-red-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase bg-red-500/25 px-1.5 py-0.5 rounded text-red-200">
              Filter active
            </span>
            <span>Filtering views matching query: &quot;{searchQuery}&quot;</span>
          </div>
          <span className="text-zinc-400 font-mono text-[11px]">ESC to clear</span>
        </div>
      )}

      {/* Screen Title & Spatial Breadcrumb Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className={`font-semibold ${roleSpecs.accent}`}>{roleSpecs.tag}</span>
            <span className="text-zinc-600" aria-hidden="true">·</span>
            <span className="text-zinc-400">{profile.identifier}</span>
            <span className="text-zinc-600" aria-hidden="true">·</span>
            <StatusIndicator status="jira_created" label="Jira Synchronized" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-display flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#0D0D11] border border-white/[0.1] text-red-500 shrink-0 shadow-sm">
              <NavIcon name={navItem.iconName} className="w-6 h-6" />
            </div>
            <span>{navItem.label}</span>
          </h1>

          <p className="text-xs sm:text-sm text-zinc-300 max-w-3xl leading-relaxed">
            {navItem.description}
          </p>
        </div>

        {/* Quick Context Metadata */}
        <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-1 text-xs text-zinc-400 font-mono">
          <span className="text-zinc-300 font-medium">Session Status: Active</span>
          <span className="text-red-400 font-semibold">{roleSpecs.slaBadge}</span>
        </div>
      </div>

      {/* Shell Architectural Framing Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Workspace Canvas Frame */}
        <SpatialCard elevation={2} className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-600 shadow-[0_0_8px_rgba(229,9,20,0.85)]" />
              <span className="text-xs font-bold uppercase tracking-wider text-white font-mono">
                {navItem.label} Workspace Canvas
              </span>
            </div>
            <span className="text-[11px] font-mono text-zinc-500">
              LAYOUT_LAYER_02
            </span>
          </div>

          <div className="rounded-xl border border-dashed border-white/[0.1] bg-[#050508] p-8 sm:p-12 text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-[#0C0C10] border border-white/[0.09] flex items-center justify-center text-red-500 shadow-sm">
              <NavIcon name={navItem.iconName} className="w-6 h-6" />
            </div>

            <div className="max-w-md mx-auto space-y-2">
              <h3 className="text-lg font-bold text-white font-display">
                {navItem.label} Interface Scaffold Ready
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                The global application shell and navigation infrastructure are active. This area is framed and ready
                to receive the production {navItem.label.toLowerCase()} components, forms, queues, and workflows
                in the upcoming implementation steps.
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono text-zinc-400">
              <span className="px-2.5 py-1 rounded-md bg-[#0A0A0E] border border-white/[0.08]">
                Route: /{role}/{navItem.id}
              </span>
              <span className="px-2.5 py-1 rounded-md bg-[#0A0A0E] border border-white/[0.08]">
                Role: {role}
              </span>
              <span className="px-2.5 py-1 rounded-md bg-[#0A0A0E] border border-white/[0.08]">
                Department: {profile.department.split('&')[0]}
              </span>
            </div>
          </div>

          {/* Planned Features for this Screen */}
          <div className="pt-2 space-y-2">
            <span className="text-xs font-semibold text-zinc-300">Target Screen Architecture:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-400">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-[#07070A] border border-white/[0.08]">
                <CheckCircle2 className="w-3.5 h-3.5 text-red-500 shrink-0" />
                <span>Responsive full-height layout</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-[#07070A] border border-white/[0.08]">
                <CheckCircle2 className="w-3.5 h-3.5 text-red-500 shrink-0" />
                <span>Real-time state hydration</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-[#07070A] border border-white/[0.08]">
                <CheckCircle2 className="w-3.5 h-3.5 text-red-500 shrink-0" />
                <span>Jira Cloud event pipeline integration</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-[#07070A] border border-white/[0.08]">
                <CheckCircle2 className="w-3.5 h-3.5 text-red-500 shrink-0" />
                <span>Accessible keyboard tab sequencing</span>
              </div>
            </div>
          </div>
        </SpatialCard>

        {/* Sidebar Context & Active Role Card */}
        <div className="space-y-6">
          <SpatialCard elevation={2} className="space-y-4">
            <div className="text-xs font-mono uppercase text-red-400 font-semibold flex items-center justify-between">
              <span>Session Context</span>
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_6px_rgba(229,9,20,0.8)]" />
            </div>
            
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-[#07070A] border border-white/[0.08] space-y-1">
                <div className="text-zinc-500 text-[11px]">Operational Identity</div>
                <div className="text-white font-semibold">{profile.name}</div>
                <div className="text-zinc-400 font-mono text-[10px]">{profile.email}</div>
              </div>

              <div className="p-3 rounded-xl bg-[#07070A] border border-white/[0.08] space-y-1">
                <div className="text-zinc-500 text-[11px]">Assigned Scope</div>
                <div className="text-white font-semibold">{profile.department}</div>
                <div className="text-red-400 font-mono text-[10px]">{profile.roleTitle}</div>
              </div>

              <div className="p-3 rounded-xl bg-[#07070A] border border-white/[0.08] space-y-1">
                <div className="text-zinc-500 text-[11px]">Navigation Scope</div>
                <div className="text-white font-semibold">
                  {ROLE_NAVIGATION[role].length} Dedicated Views for {role.toUpperCase()}
                </div>
              </div>
            </div>
          </SpatialCard>

          <SpatialCard elevation={1} className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Global Navigation Active</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Use the sidebar links or header role toggle to navigate across all 3 roles and experience the new
              cinematic Black + Bright Red visual system.
            </p>
          </SpatialCard>
        </div>
      </div>
    </div>
  );
}
