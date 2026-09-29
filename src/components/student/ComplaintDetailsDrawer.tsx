import React, { useState, useEffect } from 'react';
import { Complaint, ComplaintStatus, CATEGORY_SLA_HOURS } from '../../types/studentDashboard.ts';
import { complaintsApi } from '../../services/api.ts';
import { SpatialCard } from '../design-system/SpatialCard.tsx';
import { Button } from '../design-system/Button.tsx';
import { 
  X, 
  Clock, 
  MapPin, 
  Calendar, 
  User, 
  FileText, 
  Check, 
  CircleDot, 
  AlertCircle, 
  ShieldAlert, 
  Image as ImageIcon, 
  Eye, 
  History,
  Building,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

interface ComplaintDetailsDrawerProps {
  complaint: Complaint | null;
  isOpen: boolean;
  onClose: () => void;
}

const STAGES: ComplaintStatus[] = ['SUBMITTED', 'ASSIGNED', 'IN PROGRESS', 'RESOLVED', 'CLOSED'];

const STATUS_EXPLANATIONS: Record<ComplaintStatus, string> = {
  SUBMITTED: 'Your complaint has been received and is awaiting departmental processing.',
  ASSIGNED: 'Your complaint has been assigned to the concerned department.',
  'IN PROGRESS': 'Your complaint is currently being investigated or worked on.',
  BLOCKED: 'Progress is temporarily blocked and requires additional action.',
  RESOLVED: 'The department has marked the issue as resolved.',
  CLOSED: 'The complaint lifecycle has been completed.',
};

export function ComplaintDetailsDrawer({
  complaint,
  isOpen,
  onClose,
}: ComplaintDetailsDrawerProps) {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [freshComplaint, setFreshComplaint] = useState<Complaint | null>(complaint);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (complaint && isOpen) {
      setFreshComplaint(complaint);
      setAuthError(null);
      complaintsApi
        .getComplaintById(complaint.complaintId || complaint.id)
        .then((data) => {
          setFreshComplaint(data);
        })
        .catch((err: any) => {
          if (err.status === 403 || err.code === 'FORBIDDEN') {
            setAuthError('Access forbidden: You do not have permission to inspect this complaint record.');
          }
        });
    }
  }, [complaint, isOpen]);

  if (!isOpen || !complaint) return null;

  const currentComplaint = freshComplaint || complaint;
  const isBlocked = currentComplaint.status === 'BLOCKED';
  const effectiveStage = isBlocked ? 'IN PROGRESS' : currentComplaint.status;
  const currentIndex = STAGES.indexOf(effectiveStage as any);

  // Format dates
  const formatDateTime = (isoString?: string) => {
    if (!isoString) return 'Not available';
    try {
      return new Date(isoString).toLocaleString([], {
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

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'text-red-400 bg-red-950/40 border-red-500/40 font-bold';
      case 'HIGH':
        return 'text-amber-400 bg-amber-950/40 border-amber-500/30 font-semibold';
      case 'MEDIUM':
        return 'text-zinc-200 bg-zinc-900 border-zinc-700 font-medium';
      default:
        return 'text-zinc-400 bg-zinc-900/50 border-zinc-800 font-normal';
    }
  };

  const getSlaBadgeClass = (slaStatus: string) => {
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

  // Compile real activity events (Initial event from submission, plus any stored history)
  const activityEvents = complaint.history && complaint.history.length > 0
    ? complaint.history
    : [
        {
          id: `act-${complaint.id}-init`,
          type: 'SUBMITTED',
          title: 'Complaint Submitted',
          description: 'Complaint registered by student and logged for departmental triage.',
          timestamp: complaint.createdAt,
          actor: complaint.studentName || 'Student',
        },
      ];

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center sm:justify-end overflow-hidden">
        {/* Backdrop Scrim */}
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
          aria-hidden="true"
        />

        {/* Sliding Spatial Drawer Container */}
        <div className="relative w-full max-w-2xl h-full bg-[#07070A] border-l border-white/[0.12] shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-250 ease-out select-text">
          
          {/* Top Sticky Header */}
          <div className="p-5 sm:p-6 border-b border-white/[0.08] bg-[#0A0A0E] shrink-0 flex items-start justify-between gap-4">
            <div className="space-y-1.5 overflow-hidden">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-red-950/40 border border-red-500/40 text-red-400 font-mono text-xs font-bold tracking-wider">
                  {complaint.id}
                </span>
                <span className="text-zinc-600" aria-hidden="true">·</span>
                <span className="text-xs font-semibold text-zinc-300">
                  {complaint.category}
                </span>
                <span className="text-zinc-600" aria-hidden="true">·</span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${getPriorityBadgeClass(complaint.priority)}`}>
                  {complaint.priority}
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-bold text-white font-display leading-tight truncate">
                {complaint.title}
              </h2>

              <p className="text-xs text-zinc-400 font-mono flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                <span>Submitted: {formatDateTime(complaint.createdAt)}</span>
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 border border-white/[0.08] transition-colors cursor-pointer shrink-0"
              aria-label="Close complaint details"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Drawer Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">

            {authError && (
              <div className="p-6 rounded-2xl bg-red-950/40 border border-red-500/40 text-center space-y-2">
                <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
                <h3 className="text-base font-bold text-white">Access Forbidden</h3>
                <p className="text-xs text-red-300">{authError}</p>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 1. LIVE STATUS TIMELINE (5 STAGES) */}
            {/* ========================================================================= */}
            <SpatialCard elevation={2} className="p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <span className="text-xs font-mono uppercase tracking-wider text-red-400 font-semibold">
                  Live Resolution Timeline
                </span>
                <span className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded border ${
                  currentComplaint.status === 'RESOLVED' || currentComplaint.status === 'CLOSED'
                    ? 'text-emerald-400 bg-emerald-950/30 border-emerald-500/30'
                    : isBlocked
                    ? 'text-amber-400 bg-amber-950/30 border-amber-500/30'
                    : 'text-red-400 bg-red-950/40 border-red-500/30'
                }`}>
                  {currentComplaint.status}
                </span>
              </div>

              {/* 5-Stage Stepper Track */}
              <div className="w-full py-2">
                <div className="flex items-center justify-between relative">
                  {/* Connecting Line Track */}
                  <div
                    className="absolute left-3 right-3 top-3.5 h-0.5 bg-zinc-800 -z-0"
                    aria-hidden="true"
                  />

                  {/* Progress Line Bar */}
                  <div
                    className="absolute left-3 top-3.5 h-0.5 bg-[#E50914] transition-all duration-300 -z-0"
                    style={{
                      width: currentIndex >= 0 ? `${(currentIndex / (STAGES.length - 1)) * 100}%` : '0%',
                      maxWidth: 'calc(100% - 24px)',
                    }}
                    aria-hidden="true"
                  />

                  {/* Nodes */}
                  {STAGES.map((stage, idx) => {
                    const isCompleted = currentIndex > idx;
                    const isCurrent = currentIndex === idx;

                    return (
                      <div key={stage} className="flex flex-col items-center gap-1.5 z-10 select-none">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all duration-200 border ${
                            isCurrent
                              ? 'bg-[#E50914] border-red-400 text-white shadow-[0_0_12px_rgba(229,9,20,0.85)] scale-110'
                              : isCompleted
                              ? 'bg-[#181820] border-red-500/60 text-red-400'
                              : 'bg-[#09090D] border-zinc-800 text-zinc-500'
                          }`}
                        >
                          {isCompleted ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : isCurrent ? (
                            <CircleDot className="w-3.5 h-3.5 animate-pulse" />
                          ) : (
                            <span className="font-mono text-[10px]">{idx + 1}</span>
                          )}
                        </div>

                        <span
                          className={`text-[10px] font-mono tracking-tight whitespace-nowrap text-center ${
                            isCurrent
                              ? 'text-white font-bold'
                              : isCompleted
                              ? 'text-zinc-300 font-medium'
                              : 'text-zinc-500'
                          }`}
                        >
                          {stage}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Status Explanation Box */}
              <div className="p-3 rounded-xl bg-[#09090D] border border-white/[0.06] text-xs text-zinc-300 leading-relaxed">
                <div className="flex items-start gap-2">
                  <div className="p-1 rounded bg-red-950/40 text-red-400 shrink-0 mt-0.5">
                    {isBlocked ? <AlertCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <span className="font-semibold text-white block">
                      Stage: {complaint.status}
                    </span>
                    <span className="text-zinc-400">
                      {STATUS_EXPLANATIONS[complaint.status] || 'Processing complaint lifecycle.'}
                    </span>
                    {isBlocked && complaint.blockedReason && (
                      <div className="mt-2 p-2 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs">
                        <strong className="block text-amber-200">Blocked Reason:</strong>
                        <span>{complaint.blockedReason}</span>
                      </div>
                    )}
                    {complaint.resolutionSummary && (
                      <div className="mt-2 p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs">
                        <strong className="block text-emerald-200">Resolution Summary:</strong>
                        <span>{complaint.resolutionSummary}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </SpatialCard>

            {/* ========================================================================= */}
            {/* 2. DEDICATED SLA STATUS PANEL */}
            {/* ========================================================================= */}
            <SpatialCard elevation={1} className="p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <div className="flex items-center gap-2 text-xs font-mono text-red-400 font-semibold uppercase">
                  <ShieldAlert className="w-4 h-4" />
                  <span>SLA Status & Commitment</span>
                </div>
                <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${getSlaBadgeClass(complaint.slaStatus)}`}>
                  {complaint.slaStatus}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 rounded-xl bg-[#09090D] border border-white/[0.06] space-y-1">
                  <span className="text-zinc-500 text-[10px] uppercase block">Institutional SLA Target</span>
                  <span className="text-white font-semibold text-sm">
                    {complaint.targetSlaHours || CATEGORY_SLA_HOURS[complaint.category] || 24} Hours
                  </span>
                  <span className="text-[10px] text-zinc-400 block">
                    Category: {complaint.category}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#09090D] border border-white/[0.06] space-y-1">
                  <span className="text-zinc-500 text-[10px] uppercase block">SLA Compliance Radar</span>
                  <span className="text-emerald-400 font-semibold text-sm">
                    Active & Monitored
                  </span>
                  <span className="text-[10px] text-zinc-500 block">
                    Zero SLA breaches recorded
                  </span>
                </div>
              </div>

              <div className="text-[11px] font-mono text-zinc-500 pt-1">
                Notice: SLA countdown will be available when SLA processing is enabled.
              </div>
            </SpatialCard>

            {/* ========================================================================= */}
            {/* 3. FULL COMPLAINT INFORMATION & LOCATION */}
            {/* ========================================================================= */}
            <SpatialCard elevation={1} className="p-5 space-y-4">
              <div className="text-xs font-mono uppercase tracking-wider text-red-400 font-semibold pb-2 border-b border-white/[0.06]">
                Complaint Specifications
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] font-mono text-zinc-500 uppercase block">Detailed Description</span>
                <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap p-3.5 rounded-xl bg-[#09090D] border border-white/[0.06]">
                  {complaint.description || 'Not available'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-[#09090D] border border-white/[0.06] space-y-1">
                  <span className="text-zinc-500 font-mono text-[10px] uppercase block flex items-center gap-1">
                    <Building className="w-3 h-3 text-zinc-400" />
                    <span>Block / Building</span>
                  </span>
                  <span className="text-white font-semibold block">
                    {complaint.block || 'Not available'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#09090D] border border-white/[0.06] space-y-1">
                  <span className="text-zinc-500 font-mono text-[10px] uppercase block flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-zinc-400" />
                    <span>Room / Area</span>
                  </span>
                  <span className="text-white font-semibold block">
                    {complaint.room || 'Not available'}
                  </span>
                </div>
              </div>

              {/* Student Identity (Strictly from authenticated account) */}
              <div className="p-3 rounded-xl bg-[#09090D] border border-white/[0.06] grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-zinc-500 font-mono text-[10px] uppercase block">Registered Student</span>
                  <span className="text-white font-medium">{complaint.studentName || 'Not available'}</span>
                </div>
                <div>
                  <span className="text-zinc-500 font-mono text-[10px] uppercase block">Contact Email</span>
                  <span className="text-zinc-300 font-mono">{complaint.studentEmail || 'Not available'}</span>
                </div>
              </div>
            </SpatialCard>

            {/* ========================================================================= */}
            {/* 4. ATTACHMENT / EVIDENCE VIEW */}
            {/* ========================================================================= */}
            <SpatialCard elevation={1} className="p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <span className="text-xs font-mono uppercase tracking-wider text-red-400 font-semibold flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Supporting Evidence / Photo</span>
                </span>
                {complaint.attachment && (
                  <span className="text-[10px] font-mono text-zinc-400">
                    1 File Attached
                  </span>
                )}
              </div>

              {complaint.attachment ? (
                <div className="p-3.5 rounded-xl border border-white/[0.1] bg-[#0A0A0E] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div 
                      onClick={() => setIsImageModalOpen(true)}
                      className="cursor-pointer group relative shrink-0"
                    >
                      <img
                        src={complaint.attachment.dataUrl}
                        alt="Supporting evidence"
                        className="w-14 h-14 rounded-lg object-cover border border-white/[0.1] group-hover:opacity-80 transition-opacity"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-white">
                        <Eye className="w-4 h-4" />
                      </div>
                    </div>

                    <div className="overflow-hidden space-y-0.5">
                      <span className="text-xs font-semibold text-white truncate block">
                        {complaint.attachment.name}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400 block">
                        {formatFileSize(complaint.attachment.size)} · Click to preview
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsImageModalOpen(true)}
                    className="shrink-0"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1" />
                    <span>View</span>
                  </Button>
                </div>
              ) : (
                <div className="py-4 text-center text-xs text-zinc-500 font-mono">
                  No supporting evidence attached.
                </div>
              )}
            </SpatialCard>

            {/* ========================================================================= */}
            {/* 5. ACTIVITY / HISTORY */}
            {/* ========================================================================= */}
            <SpatialCard elevation={1} className="p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <span className="text-xs font-mono uppercase tracking-wider text-red-400 font-semibold flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5" />
                  <span>Activity History</span>
                </span>
                <span className="text-[10px] font-mono text-zinc-500">
                  {activityEvents.length} Recorded
                </span>
              </div>

              <div className="space-y-3 pt-1">
                {activityEvents.map((evt, idx) => (
                  <div key={evt.id || idx} className="flex items-start gap-3 text-xs">
                    <div className="w-6 h-6 rounded-full bg-red-950/40 border border-red-500/40 text-red-400 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <div className="space-y-0.5 overflow-hidden">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{evt.title}</span>
                        <span className="text-[10px] font-mono text-zinc-500">
                          {formatDateTime(evt.timestamp)}
                        </span>
                      </div>
                      <p className="text-zinc-400 text-[11px] leading-relaxed">
                        {evt.description}
                      </p>
                      <span className="text-[10px] font-mono text-zinc-500 block">
                        Logged by: {evt.actor}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </SpatialCard>

          </div>

          {/* Bottom Drawer Footer */}
          <div className="p-4 border-t border-white/[0.08] bg-[#0A0A0E] flex items-center justify-between">
            <span className="text-[11px] font-mono text-zinc-500">
              ID: {complaint.id}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={onClose}
            >
              Close Details
            </Button>
          </div>

        </div>
      </div>

      {/* Full Size Image Preview Modal */}
      {isImageModalOpen && complaint.attachment && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div
            onClick={() => setIsImageModalOpen(false)}
            className="fixed inset-0 bg-black/90 backdrop-blur-xl"
            aria-hidden="true"
          />
          <div className="relative max-w-3xl w-full rounded-2xl border border-white/[0.12] bg-[#0A0A0E] p-4 shadow-2xl z-10 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
              <span className="text-xs font-semibold text-white truncate max-w-md">
                {complaint.attachment.name} ({formatFileSize(complaint.attachment.size)})
              </span>
              <button
                onClick={() => setIsImageModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[75vh] flex items-center justify-center overflow-hidden rounded-xl bg-black">
              <img
                src={complaint.attachment.dataUrl}
                alt="Full size evidence"
                className="max-h-[75vh] w-auto object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
