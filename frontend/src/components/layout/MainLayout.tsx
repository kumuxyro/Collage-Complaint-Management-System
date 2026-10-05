import React from 'react';
import { useRole } from '../../context/RoleContext.tsx';
import { CinematicCanvas } from '../canvas/CinematicCanvas.tsx';
import { AppHeader } from './AppHeader.tsx';
import { AppSidebar } from './AppSidebar.tsx';
import { MobileNav } from './MobileNav.tsx';
import { PageTransition } from './PageTransition.tsx';
import { NavPlaceholderPage } from './NavPlaceholderPage.tsx';
import { StudentDashboard } from '../student/StudentDashboard.tsx';
import { MyComplaintsPage } from '../student/MyComplaintsPage.tsx';
import { StaffDashboard } from '../staff/StaffDashboard.tsx';
import { AdminCommandCenter } from '../admin/AdminCommandCenter.tsx';

export function MainLayout() {
  const { role, activeNavId } = useRole();

  // Render dedicated views based on role and active navigation item
  const renderContent = () => {
    if (role === 'student') {
      if (activeNavId === 'dashboard') {
        return <StudentDashboard />;
      }
      if (activeNavId === 'my-complaints') {
        return <MyComplaintsPage />;
      }
      if (activeNavId === 'submit') {
        return <StudentDashboard initialSubmitOpen={true} />;
      }
    }

    if (role === 'staff') {
      if (
        activeNavId === 'dashboard' ||
        activeNavId === 'work-queue' ||
        activeNavId === 'active-complaints' ||
        activeNavId === 'resolved'
      ) {
        return <StaffDashboard />;
      }
    }

    if (role === 'admin') {
      if (
        activeNavId === 'dashboard' ||
        activeNavId === 'all-complaints' ||
        activeNavId === 'sla-monitor' ||
        activeNavId === 'departments' ||
        activeNavId === 'analytics' ||
        activeNavId === 'activity-log'
      ) {
        return <AdminCommandCenter />;
      }
    }

    return <NavPlaceholderPage />;
  };

  return (
    <div className="min-h-screen bg-[#040405] text-slate-100 flex flex-col relative selection:bg-red-600/30 selection:text-red-200 overflow-x-hidden">
      {/* Layer 0: Global Background 3D Particle & Orb Physics Environment */}
      <CinematicCanvas interactive={true} lightingIntensity={0.85} particleDensity="balanced" />

      {/* Layer 50: Mobile Navigation Drawer */}
      <MobileNav />

      {/* Layer 40: Sticky Application Header */}
      <AppHeader />

      {/* Primary Workspace Frame (Sidebar + Main Content Viewport) */}
      <div className="flex-1 flex w-full relative z-10 overflow-hidden">
        {/* Layer 30: Responsive Spatial Sidebar */}
        <AppSidebar />

        {/* Layer 20: Scrollable Main Content Area */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <PageTransition transitionKey={`${role}-${activeNavId}`}>
            {renderContent()}
          </PageTransition>

          {/* Institutional Shell Footer */}
          <footer className="mt-12 pt-6 pb-8 border-t border-white/[0.07] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-zinc-300">College Complaint Management System</span>
              <span aria-hidden="true">·</span>
              <span>Cinematic Black & Bright Red Edition</span>
            </div>
            <div className="flex items-center gap-3 font-mono text-[11px] text-zinc-400">
              <span className="text-red-500 font-semibold uppercase">{role} Operational Mode</span>
              <span aria-hidden="true">·</span>
              <span>Shell Active</span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
