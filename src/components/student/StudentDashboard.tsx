import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useRole } from '../../context/RoleContext.tsx';
import { StudentUser } from '../../types/auth.ts';
import { Complaint, StudentStatistics, StudentNotification } from '../../types/studentDashboard.ts';
import { complaintsApi } from '../../services/api.ts';
import { SpatialCard } from '../design-system/SpatialCard.tsx';
import { Button } from '../design-system/Button.tsx';
import { ComplaintSubmitModal } from './ComplaintSubmitModal.tsx';
import { ComplaintDetailsDrawer } from './ComplaintDetailsDrawer.tsx';
import { ComplaintStatusStepper } from './ComplaintStatusStepper.tsx';
import { 
  PlusCircle, 
  FileText, 
  Clock, 
  CheckCircle2, 
  Bell, 
  ArrowRight, 
  ShieldAlert, 
  Inbox,
  Calendar,
  Image as ImageIcon
} from 'lucide-react';

interface StudentDashboardProps {
  initialSubmitOpen?: boolean;
}

export function StudentDashboard({ initialSubmitOpen = false }: StudentDashboardProps) {
  const { currentUser } = useAuth();
  const { setActiveNavId, setRole } = useRole();

  // Modal State for Complaint Submission
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(initialSubmitOpen);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  // Complaints & Stats state (starts strictly from real authenticated backend data)
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<StudentStatistics>({
    total: 0,
    submitted: 0,
    inProgress: 0,
    blocked: 0,
    resolved: 0,
    closed: 0,
  });
  const [notifications, setNotifications] = useState<StudentNotification[]>([]);

  // Guard: If authenticated as Staff or Admin, enforce redirection
  useEffect(() => {
    if (currentUser && currentUser.role !== 'student') {
      setRole(currentUser.role);
    }
  }, [currentUser, setRole]);

  // Sync initialSubmitOpen if prop changes
  useEffect(() => {
    if (initialSubmitOpen) {
      setIsSubmitModalOpen(true);
    }
  }, [initialSubmitOpen]);

  // Load real student records from backend API
  const loadData = async () => {
    if (!currentUser || currentUser.role !== 'student') return;

    setIsLoading(true);
    setError(null);
    try {
      const data = await complaintsApi.getComplaints();
      setComplaints(data);

      const submitted = data.filter((c) => c.status === 'SUBMITTED' || c.status === 'ASSIGNED').length;
      const inProgress = data.filter((c) => c.status === 'IN PROGRESS').length;
      const blocked = data.filter((c) => c.status === 'BLOCKED').length;
      const resolved = data.filter((c) => c.status === 'RESOLVED').length;
      const closed = data.filter((c) => c.status === 'CLOSED').length;

      setStats({
        total: data.length,
        submitted,
        inProgress,
        blocked,
        resolved,
        closed,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load complaints from server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  // Callback when a new complaint is submitted
  const handleComplaintSubmitted = () => {
    loadData();
  };

  // Extract real authenticated student information - NO fake names or fake USN
  const studentName = currentUser?.name || 'Not provided';
  const studentUsn = (currentUser as StudentUser)?.usn || 'Not provided';
  const studentBranch = (currentUser as StudentUser)?.branch || 'Not provided';
  const studentSemester = (currentUser as StudentUser)?.semester || 'Not provided';

  // Helper for priority tag styling
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'text-red-400 bg-red-950/40 border-red-500/30';
      case 'HIGH':
        return 'text-amber-400 bg-amber-950/40 border-amber-500/30';
      case 'MEDIUM':
        return 'text-zinc-300 bg-zinc-900 border-zinc-700';
      default:
        return 'text-zinc-400 bg-zinc-900/50 border-zinc-800';
    }
  };

  // Helper for SLA styling
  const getSlaBadge = (slaStatus: string) => {
    switch (slaStatus) {
      case 'Within SLA':
        return 'text-emerald-400 bg-emerald-950/30 border-emerald-500/30';
      case 'Approaching SLA':
        return 'text-amber-400 bg-amber-950/30 border-amber-500/30';
      case 'SLA Breached':
        return 'text-red-400 bg-red-950/40 border-red-500/40 animate-pulse';
      default:
        return 'text-zinc-400 bg-zinc-900/50 border-zinc-800';
    }
  };

  const formatSubmittedDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      {/* ========================================================================= */}
      {/* 1. HEADER AREA & AUTHENTICATED PROFILE SUMMARY */}
      {/* ========================================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/[0.08]">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
            <span className="text-red-500 font-semibold uppercase">STUDENT WORKSPACE</span>
            <span className="text-zinc-600" aria-hidden="true">·</span>
            <span>USN: {studentUsn}</span>
            <span className="text-zinc-600" aria-hidden="true">·</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Verified Session
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white font-display">
            Welcome back, {studentName}
          </h1>

          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-2xl">
            Manage your college complaints and track their resolution.
          </p>
        </div>

        {/* Primary Action Button */}
        <div className="shrink-0 flex items-center gap-3">
          <Button
            variant="primary"
            size="lg"
            onClick={() => setIsSubmitModalOpen(true)}
            className="shadow-[0_4px_20px_-2px_rgba(229,9,20,0.6)]"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            <span>SUBMIT NEW COMPLAINT</span>
          </Button>
        </div>
      </div>

      {/* Compact Authenticated Student Profile Card */}
      <SpatialCard elevation={1} className="p-4 sm:p-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="space-y-1">
            <span className="text-zinc-500 font-mono text-[10px] uppercase block tracking-wider">
              Student Name
            </span>
            <span className="text-white font-semibold text-sm truncate block">
              {studentName}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-zinc-500 font-mono text-[10px] uppercase block tracking-wider">
              College USN
            </span>
            <span className="text-red-400 font-mono font-semibold text-sm truncate block">
              {studentUsn}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-zinc-500 font-mono text-[10px] uppercase block tracking-wider">
              Academic Branch
            </span>
            <span className="text-zinc-200 font-medium text-sm truncate block">
              {studentBranch}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-zinc-500 font-mono text-[10px] uppercase block tracking-wider">
              Current Semester
            </span>
            <span className="text-zinc-200 font-medium text-sm truncate block">
              {studentSemester}
            </span>
          </div>
        </div>
      </SpatialCard>

      {/* ========================================================================= */}
      {/* 2. QUICK STATISTICS (4 SPATIAL CARDS) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Complaints */}
        <SpatialCard elevation={2} className="space-y-2 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider font-medium">
              Total Complaints
            </span>
            <div className="p-2 rounded-lg bg-[#14141B] border border-white/[0.08] text-zinc-300">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-bold font-mono text-white tracking-tight">
            {stats.total}
          </div>
          <p className="text-[11px] text-zinc-500 font-mono">
            All submitted campus tickets
          </p>
        </SpatialCard>

        {/* Submitted */}
        <SpatialCard elevation={2} className="space-y-2 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider font-medium">
              Submitted
            </span>
            <div className="p-2 rounded-lg bg-zinc-900 border border-white/[0.08] text-zinc-300">
              <Inbox className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-bold font-mono text-zinc-200 tracking-tight">
            {stats.submitted}
          </div>
          <p className="text-[11px] text-zinc-500 font-mono">
            Awaiting technician review
          </p>
        </SpatialCard>

        {/* In Progress */}
        <SpatialCard elevation={2} className="space-y-2 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider font-medium">
              In Progress
            </span>
            <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-bold font-mono text-amber-400 tracking-tight">
            {stats.inProgress}
          </div>
          <p className="text-[11px] text-zinc-500 font-mono">
            Currently being addressed
          </p>
        </SpatialCard>

        {/* Resolved */}
        <SpatialCard elevation={2} className="space-y-2 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider font-medium">
              Resolved
            </span>
            <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-bold font-mono text-emerald-400 tracking-tight">
            {stats.resolved}
          </div>
          <p className="text-[11px] text-zinc-500 font-mono">
            Fix completed & verified
          </p>
        </SpatialCard>
      </div>

      {/* ========================================================================= */}
      {/* 3. RECENT COMPLAINTS & NOTIFICATIONS SPLIT SECTION */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Complaints List Area (2 columns on large screens) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white font-display">
                Recent Complaints
              </h2>
              {complaints.length > 0 && (
                <span className="font-mono text-xs text-zinc-400">
                  ({complaints.length})
                </span>
              )}
            </div>

            {complaints.length > 0 && (
              <button
                onClick={() => setActiveNavId('my-complaints')}
                className="text-xs text-red-400 hover:text-red-300 font-medium transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* LOADING STATE */}
          {isLoading ? (
            <SpatialCard elevation={1} className="p-8 text-center space-y-2">
              <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-mono text-zinc-400">Loading complaints from server...</p>
            </SpatialCard>
          ) : error ? (
            <SpatialCard elevation={1} className="p-8 text-center space-y-3">
              <p className="text-xs text-red-400">{error}</p>
              <Button variant="secondary" size="sm" onClick={loadData}>
                Retry
              </Button>
            </SpatialCard>
          ) : complaints.length === 0 ? (
            <SpatialCard elevation={2} className="p-8 sm:p-12 text-center space-y-5">
              <div className="w-14 h-14 rounded-2xl bg-[#0F0F16] border border-white/[0.09] flex items-center justify-center mx-auto text-red-500 shadow-inner">
                <FileText className="w-7 h-7" />
              </div>

              <div className="space-y-1.5 max-w-sm mx-auto">
                <h3 className="text-base sm:text-lg font-bold text-white font-display">
                  Your complaint workspace is ready.
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Submit an issue and track its progress from submission to resolution.
                </p>
              </div>

              <div className="pt-2">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setIsSubmitModalOpen(true)}
                  className="shadow-md"
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  <span>SUBMIT YOUR FIRST COMPLAINT</span>
                </Button>
              </div>
            </SpatialCard>
          ) : (
            /* COMPLAINT LIST ROWS */
            <div className="space-y-4">
              {complaints.map((item) => (
                <SpatialCard key={item.id} elevation={2} className="p-5 space-y-4">
                  {/* Complaint Item Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/[0.07]">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs text-red-400 font-bold">
                        {item.id}
                      </span>
                      <span className="text-zinc-600" aria-hidden="true">·</span>
                      <span className="text-xs font-semibold text-zinc-300">
                        {item.category}
                      </span>
                      {item.location && (
                        <>
                          <span className="text-zinc-600" aria-hidden="true">·</span>
                          <span className="text-xs text-zinc-400 truncate max-w-[140px]">
                            {item.location}
                          </span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border uppercase ${getPriorityBadge(item.priority)}`}>
                        {item.priority}
                      </span>
                      <span className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded border ${getSlaBadge(item.slaStatus)}`}>
                        {item.slaStatus} ({item.targetSlaHours}h)
                      </span>
                    </div>
                  </div>

                  {/* Complaint Title & Details */}
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="text-base font-bold text-white hover:text-red-400 transition-colors cursor-pointer" onClick={() => setSelectedComplaint(item)}>
                        {item.title}
                      </h3>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setSelectedComplaint(item)}
                        className="shrink-0 text-xs"
                      >
                        <span>VIEW DETAILS</span>
                      </Button>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">
                      {item.description}
                    </p>

                    {/* Evidence preview if uploaded */}
                    {item.attachment && (
                      <div className="pt-1 flex items-center gap-2 text-[11px] text-zinc-400">
                        <span className="p-1 rounded bg-[#101016] border border-white/[0.08] text-red-400">
                          <ImageIcon className="w-3.5 h-3.5" />
                        </span>
                        <span>Photo evidence attached: <strong className="text-zinc-300 font-normal">{item.attachment.name}</strong></span>
                      </div>
                    )}
                  </div>

                  {/* 5-Stage Status Visual Stepper */}
                  <div className="pt-2">
                    <ComplaintStatusStepper currentStatus={item.status} />
                  </div>

                  {/* Footer Info & Jira Synchronized Key */}
                  <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-zinc-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Submitted: {formatSubmittedDate(item.createdAt)}</span>
                    </div>
                    {item.jiraIssueKey ? (
                      <span className="text-red-400 font-semibold">
                        JIRA: {item.jiraIssueKey}
                      </span>
                    ) : (
                      <span>Target SLA: {item.targetSlaHours}h</span>
                    )}
                  </div>
                </SpatialCard>
              ))}
            </div>
          )}
        </div>

        {/* Notifications & Quick Help Sidebar (1 column on large screens) */}
        <div className="space-y-6">
          {/* Notifications Preview */}
          <SpatialCard elevation={2} className="space-y-4 p-5">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-red-500" />
                <h3 className="text-sm font-bold text-white font-display">
                  Recent Notifications
                </h3>
              </div>
              <button
                onClick={() => setActiveNavId('notifications')}
                className="text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                VIEW ALL
              </button>
            </div>

            {notifications.length === 0 ? (
              <div className="py-6 text-center space-y-1">
                <p className="text-xs text-zinc-400">No new notifications.</p>
                <p className="text-[11px] text-zinc-500">
                  Updates on submitted grievances will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {notifications.slice(0, 3).map((notif) => (
                  <div
                    key={notif.id}
                    className="p-3 rounded-xl bg-[#09090D] border border-white/[0.06] space-y-1"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white truncate max-w-[180px]">
                        {notif.title}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500">
                        {notif.createdAt}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      {notif.message}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </SpatialCard>

          {/* SLA Assurance Information Box */}
          <SpatialCard elevation={1} className="space-y-3 p-5">
            <div className="flex items-center gap-2 text-xs font-mono text-red-400 font-semibold">
              <ShieldAlert className="w-4 h-4" />
              <span>Institutional Resolution SLA</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              All grievances are routed directly to departmental custodians with guaranteed turn-around times:
            </p>
            <div className="space-y-1.5 text-[11px] font-mono text-zinc-300">
              <div className="flex items-center justify-between">
                <span>IT & Network Services</span>
                <span className="text-red-400 font-semibold">6h SLA</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Hostel & Residential</span>
                <span className="text-red-400 font-semibold">8h SLA</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Laboratories</span>
                <span className="text-red-400 font-semibold">12h SLA</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Classrooms & Transport</span>
                <span className="text-red-400 font-semibold">24h SLA</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Facilities & Campus Life</span>
                <span className="text-red-400 font-semibold">36h SLA</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Fees & Accounts</span>
                <span className="text-red-400 font-semibold">48h SLA</span>
              </div>
            </div>
          </SpatialCard>
        </div>
      </div>

      {/* Complaint Submission Full Experience Modal */}
      <ComplaintSubmitModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onComplaintSubmitted={handleComplaintSubmitted}
      />

      {/* Complaint Details Drawer */}
      <ComplaintDetailsDrawer
        complaint={selectedComplaint}
        isOpen={Boolean(selectedComplaint)}
        onClose={() => setSelectedComplaint(null)}
      />
    </div>
  );
}
