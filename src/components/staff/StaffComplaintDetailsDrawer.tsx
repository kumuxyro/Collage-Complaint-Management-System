import React, { useState } from 'react';
import { 
  Complaint, 
  ComplaintStatus, 
  CATEGORY_SLA_HOURS 
} from '../../types/studentDashboard.ts';
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
  Wrench,
  AlertTriangle,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

interface StaffComplaintDetailsDrawerProps {
  complaint: Complaint | null;
  staffName: string;
  staffEmployeeId: string;
  isOpen: boolean;
  onClose: () => void;
  onComplaintUpdated: (updated: Complaint) => void;
}

const STAGES: ComplaintStatus[] = ['SUBMITTED', 'ASSIGNED', 'IN PROGRESS', 'RESOLVED', 'CLOSED'];

const ALLOWED_STAFF_STATUSES: ComplaintStatus[] = ['ASSIGNED', 'IN PROGRESS', 'BLOCKED', 'RESOLVED'];

export function StaffComplaintDetailsDrawer({
  complaint,
  staffName,
  staffEmployeeId,
  isOpen,
  onClose,
  onComplaintUpdated,
}: StaffComplaintDetailsDrawerProps) {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  // Status Change State
  const [selectedNewStatus, setSelectedNewStatus] = useState<ComplaintStatus | null>(null);
  const [reasonInput, setReasonInput] = useState('');
  const [statusError, setStatusError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  if (!isOpen || !complaint) return null;

  const isBlocked = complaint.status === 'BLOCKED';
  const effectiveStage = isBlocked ? 'IN PROGRESS' : complaint.status;
  const currentIndex = STAGES.indexOf(effectiveStage as any);

  // Check if currently assigned to this staff member
  const isAssignedToMe = complaint.assignedStaffId === staffEmployeeId;
  const isUnassigned = !complaint.assignedStaffId;

  // Claim complaint handler
  const handleClaim = async () => {
    setIsUpdating(true);
    setStatusError(null);
    try {
      const updated = await complaintsApi.claimComplaint(complaint.complaintId || complaint.id);
      onComplaintUpdated(updated);
    } catch (err: any) {
      setStatusError(err.message || 'Failed to claim complaint.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Submit Status Update
  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusError(null);

    if (!selectedNewStatus) {
      setStatusError('Please choose a status.');
      return;
    }

    if (selectedNewStatus === 'BLOCKED' && !reasonInput.trim()) {
      setStatusError('Please provide a reason why this complaint is blocked.');
      return;
    }

    if (selectedNewStatus === 'RESOLVED' && !reasonInput.trim()) {
      setStatusError('Please enter a resolution summary describing what work was completed.');
      return;
    }

    setIsUpdating(true);
    try {
      const updated = await complaintsApi.updateStatus(
        complaint.complaintId || complaint.id,
        selectedNewStatus,
        reasonInput.trim()
      );
      onComplaintUpdated(updated);
      setSelectedNewStatus(null);
      setReasonInput('');
    } catch (err: any) {
      setStatusError(err.message || 'Failed to update complaint status.');
    } finally {
      setIsUpdating(false);
    }
  };

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

  const activityEvents = complaint.history && complaint.history.length > 0
    ? complaint.history
    : [
        {
          id: `act-${complaint.id}-init`,
          type: 'SUBMITTED' as const,
          title: 'Complaint Submitted',
          description: 'Complaint registered by student and logged for departmental triage.',
          timestamp: complaint.createdAt,
          actor: complaint.studentName || 'Student',
        },
      ];

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center sm:justify-end overflow-hidden">
        {/* Backdrop */}
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
          aria-hidden="true"
        />

        {/* Drawer Surface */}
        <div className="relative w-full max-w-2xl h-full bg-[#07070A] border-l border-white/[0.12] shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-250 ease-out select-text">
          
          {/* Header */}
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
                  Priority: {complaint.priority}
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-bold text-white font-display leading-tight truncate">
                {complaint.title}
              </h2>

              <div className="text-xs text-zinc-400 font-mono flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Submitted: {formatDateTime(complaint.createdAt)}</span>
                </span>
                <span className="text-zinc-600" aria-hidden="true">·</span>
                <span>
                  Staff: {complaint.assignedStaffName ? <strong className="text-white font-medium">{complaint.assignedStaffName}</strong> : <span className="text-amber-400">Unassigned</span>}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 border border-white/[0.08] transition-colors cursor-pointer shrink-0"
              aria-label="Close complaint details"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">

            {/* QUICK CLAIM ACTION IF UNASSIGNED */}
            {isUnassigned && (
              <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/40 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-white block">
                    Unclaimed Department Ticket
                  </span>
                  <span className="text-[11px] text-zinc-400">
                    Claim this grievance to move status to ASSIGNED and take ownership of repair.
                  </span>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleClaim}
                  className="shrink-0 shadow-md"
                >
                  <Wrench className="w-3.5 h-3.5 mr-1.5" />
                  <span>Claim Complaint</span>
                </Button>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 1. STATUS UPDATE CONTROLS (ASSIGNED, IN PROGRESS, BLOCKED, RESOLVED) */}
            {/* ========================================================================= */}
            <SpatialCard elevation={2} className="p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <span className="text-xs font-mono uppercase tracking-wider text-red-400 font-semibold flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Technician Status Controls</span>
                </span>
                <span className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded border ${
                  complaint.status === 'RESOLVED' || complaint.status === 'CLOSED'
                    ? 'text-emerald-400 bg-emerald-950/30 border-emerald-500/30'
                    : isBlocked
                    ? 'text-amber-400 bg-amber-950/30 border-amber-500/30'
                    : 'text-red-400 bg-red-950/40 border-red-500/30'
                }`}>
                  Current: {complaint.status}
                </span>
              </div>

              {/* 5-Stage Stepper Preview */}
              <div className="w-full py-2">
                <div className="flex items-center justify-between relative">
                  <div className="absolute left-3 right-3 top-3.5 h-0.5 bg-zinc-800 -z-0" aria-hidden="true" />
                  <div 
                    className="absolute left-3 top-3.5 h-0.5 bg-[#E50914] transition-all duration-300 -z-0"
                    style={{
                      width: currentIndex >= 0 ? `${(currentIndex / (STAGES.length - 1)) * 100}%` : '0%',
                      maxWidth: 'calc(100% - 24px)',
                    }}
                    aria-hidden="true"
                  />
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
                          {isCompleted ? <Check className="w-3.5 h-3.5" /> : isCurrent ? <CircleDot className="w-3.5 h-3.5 animate-pulse" /> : <span className="font-mono text-[10px]">{idx + 1}</span>}
                        </div>
                        <span className={`text-[10px] font-mono tracking-tight whitespace-nowrap text-center ${
                          isCurrent ? 'text-white font-bold' : isCompleted ? 'text-zinc-300 font-medium' : 'text-zinc-500'
                        }`}>
                          {stage}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Current Blocked or Resolution notes if existing */}
              {isBlocked && complaint.blockedReason && (
                <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs text-amber-200">
                  <strong className="block text-amber-200 font-mono text-[10px] uppercase">Active Blocked Reason:</strong>
                  <span>{complaint.blockedReason}</span>
                </div>
              )}

              {complaint.resolutionSummary && (
                <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-200">
                  <strong className="block text-emerald-200 font-mono text-[10px] uppercase">Recorded Resolution:</strong>
                  <span>{complaint.resolutionSummary}</span>
                </div>
              )}

              {/* Status Update Form */}
              <form onSubmit={handleStatusSubmit} className="pt-2 border-t border-white/[0.06] space-y-3">
                <span className="text-xs font-semibold text-zinc-300 block">
                  Transition Status (Staff Permission):
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {ALLOWED_STAFF_STATUSES.map((st) => {
                    const isSelected = selectedNewStatus === st;
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setSelectedNewStatus(st)}
                        className={`p-2 rounded-xl border text-xs font-mono font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-red-500/20 border-red-500 text-white shadow-[0_0_10px_rgba(229,9,20,0.3)]'
                            : 'bg-[#09090D] border-white/[0.08] text-zinc-300 hover:border-white/[0.16]'
                        }`}
                      >
                        {st}
                      </button>
                    );
                  })}
                </div>

                {/* Conditional Reason / Summary Input */}
                {selectedNewStatus === 'BLOCKED' && (
                  <div className="space-y-1.5 animate-in fade-in duration-150">
                    <label className="text-xs font-medium text-amber-300 block">
                      Why is this complaint blocked? *
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Waiting for replacement circuit breakers from manufacturer..."
                      value={reasonInput}
                      onChange={(e) => setReasonInput(e.target.value)}
                      className="w-full bg-[#09090D] border border-amber-500/40 rounded-xl p-3 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>
                )}

                {selectedNewStatus === 'RESOLVED' && (
                  <div className="space-y-1.5 animate-in fade-in duration-150">
                    <label className="text-xs font-medium text-emerald-300 block">
                      Resolution Summary *
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Installed new projection bulb, tested display output at 1080p, verified operational..."
                      value={reasonInput}
                      onChange={(e) => setReasonInput(e.target.value)}
                      className="w-full bg-[#09090D] border border-emerald-500/40 rounded-xl p-3 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                )}

                {statusError && (
                  <p className="text-xs text-red-400 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{statusError}</span>
                  </p>
                )}

                {selectedNewStatus && (
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setSelectedNewStatus(null);
                        setReasonInput('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      isLoading={isUpdating}
                    >
                      Save Status Update
                    </Button>
                  </div>
                )}
              </form>
            </SpatialCard>

            {/* ========================================================================= */}
            {/* 2. DEDICATED SLA STATUS PANEL */}
            {/* ========================================================================= */}
            <SpatialCard elevation={1} className="p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <div className="flex items-center gap-2 text-xs font-mono text-red-400 font-semibold uppercase">
                  <ShieldAlert className="w-4 h-4" />
                  <span>SLA Commitment</span>
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
                  <span className="text-zinc-500 text-[10px] uppercase block">Assigned Technician</span>
                  <span className="text-white font-semibold text-sm truncate block">
                    {complaint.assignedStaffName || 'Unassigned'}
                  </span>
                  <span className="text-[10px] text-zinc-400 block">
                    {complaint.assignedAt ? `Claimed ${formatDateTime(complaint.assignedAt)}` : 'Awaiting assignment'}
                  </span>
                </div>
              </div>

              <div className="text-[11px] font-mono text-zinc-500 pt-1">
                Notice: SLA countdown unavailable
              </div>
            </SpatialCard>

            {/* ========================================================================= */}
            {/* 3. COMPLAINT INFORMATION & STUDENT CONTACT */}
            {/* ========================================================================= */}
            <SpatialCard elevation={1} className="p-5 space-y-4">
              <div className="text-xs font-mono uppercase tracking-wider text-red-400 font-semibold pb-2 border-b border-white/[0.06]">
                Complaint Details & Location
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

              {/* Student Contact Information from Complaint Record */}
              <div className="p-3.5 rounded-xl bg-[#0C0C11] border border-white/[0.08] space-y-1.5">
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block font-semibold">
                  Reporting Student Contact
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-zinc-500 block text-[10px]">Student Name</span>
                    <span className="text-white font-semibold">{complaint.studentName || 'Not available'}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px]">USN</span>
                    <span className="text-red-400 font-mono">{complaint.studentUsn || 'Not available'}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px]">Student Email</span>
                    <span className="text-zinc-300 font-mono truncate block" title={complaint.studentEmail}>
                      {complaint.studentEmail || 'Not available'}
                    </span>
                  </div>
                </div>
              </div>
            </SpatialCard>

            {/* ========================================================================= */}
            {/* 4. ATTACHMENT VIEW */}
            {/* ========================================================================= */}
            <SpatialCard elevation={1} className="p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <span className="text-xs font-mono uppercase tracking-wider text-red-400 font-semibold flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Student Uploaded Evidence</span>
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
            {/* 5. ACTIVITY HISTORY */}
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

          {/* Drawer Footer */}
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

      {/* Full Size Image Viewer */}
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
