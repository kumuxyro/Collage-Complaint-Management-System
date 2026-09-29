import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { StudentUser } from '../../types/auth.ts';
import { 
  Complaint, 
  ComplaintStatus, 
  ComplaintPriority, 
  ComplaintCategory, 
  StudentStatistics 
} from '../../types/studentDashboard.ts';
import { complaintsApi } from '../../services/api.ts';
import { SpatialCard } from '../design-system/SpatialCard.tsx';
import { Button } from '../design-system/Button.tsx';
import { ComplaintSubmitModal } from './ComplaintSubmitModal.tsx';
import { ComplaintDetailsDrawer } from './ComplaintDetailsDrawer.tsx';
import { ComplaintStatusStepper } from './ComplaintStatusStepper.tsx';
import { 
  Search, 
  Filter, 
  PlusCircle, 
  Calendar, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Layers, 
  SlidersHorizontal, 
  ArrowUpDown, 
  RotateCcw, 
  Image as ImageIcon,
  ArrowRight,
  Eye,
  Inbox,
  AlertTriangle,
  FolderCheck,
  Ban
} from 'lucide-react';

const CATEGORIES: ComplaintCategory[] = [
  'Classrooms',
  'Laboratories',
  'Fees & Accounts',
  'Library',
  'Hostel & Residential',
  'Transport',
  'IT & Network Services',
  'Facilities & Campus Life',
];

const STATUSES: { value: 'ALL' | ComplaintStatus; label: string }[] = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'IN PROGRESS', label: 'In Progress' },
  { value: 'BLOCKED', label: 'Blocked' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'CLOSED', label: 'Closed' },
];

const PRIORITIES: { value: 'ALL' | ComplaintPriority; label: string }[] = [
  { value: 'ALL', label: 'All Priorities' },
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' },
];

type SortOption = 'newest' | 'oldest' | 'priority' | 'status';

export function MyComplaintsPage() {
  const { currentUser } = useAuth();
  const student = currentUser as StudentUser | null;

  // Real Complaints State from Backend Database
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

  // Modal / Drawer States
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ComplaintStatus>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | ComplaintCategory>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | ComplaintPriority>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Load real student records from backend
  const loadData = async () => {
    if (!student) return;

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
  }, [student]);

  // Callback when a new complaint is submitted
  const handleComplaintSubmitted = (newRecord: Complaint) => {
    loadData();
    setSelectedComplaint(newRecord);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setCategoryFilter('ALL');
    setPriorityFilter('ALL');
    setSortBy('newest');
  };

  const isFilterActive = searchQuery || statusFilter !== 'ALL' || categoryFilter !== 'ALL' || priorityFilter !== 'ALL' || sortBy !== 'newest';

  // Filtered and Sorted Complaints List
  const filteredComplaints = useMemo(() => {
    let result = [...complaints];

    // Search Filter (by ID, Title, Category, Location)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.id.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q) ||
          (c.location && c.location.toLowerCase().includes(q)) ||
          (c.block && c.block.toLowerCase().includes(q)) ||
          (c.room && c.room.toLowerCase().includes(q))
      );
    }

    // Status Filter
    if (statusFilter !== 'ALL') {
      result = result.filter((c) => c.status === statusFilter);
    }

    // Category Filter
    if (categoryFilter !== 'ALL') {
      result = result.filter((c) => c.category === categoryFilter);
    }

    // Priority Filter
    if (priorityFilter !== 'ALL') {
      result = result.filter((c) => c.priority === priorityFilter);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === 'priority') {
        const priorityOrder: Record<ComplaintPriority, number> = {
          URGENT: 4,
          HIGH: 3,
          MEDIUM: 2,
          LOW: 1,
        };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      if (sortBy === 'status') {
        return a.status.localeCompare(b.status);
      }
      return 0;
    });

    return result;
  }, [complaints, searchQuery, statusFilter, categoryFilter, priorityFilter, sortBy]);

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

  const getPriorityBadgeClass = (priority: string) => {
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      {/* ========================================================================= */}
      {/* 1. HEADER AREA */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
            <span className="text-red-500 font-semibold uppercase">STUDENT COMPLAINT REGISTRY</span>
            <span className="text-zinc-600" aria-hidden="true">·</span>
            <span>USN: {student?.usn || 'Not provided'}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white font-display">
            My Complaints
          </h1>

          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-2xl">
            Track every complaint submitted from your account.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => setIsSubmitModalOpen(true)}
          className="shadow-[0_4px_20px_-2px_rgba(229,9,20,0.6)] shrink-0"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          <span>SUBMIT NEW COMPLAINT</span>
        </Button>
      </div>

      {/* ========================================================================= */}
      {/* 2. COMPACT 6-METRIC SUMMARY CARDS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total */}
        <SpatialCard elevation={1} className="p-3.5 space-y-1 text-center">
          <span className="text-[10px] font-mono uppercase text-zinc-400 font-medium block">
            Total
          </span>
          <div className="text-2xl font-bold font-mono text-white">
            {stats.total}
          </div>
          <span className="text-[9px] font-mono text-zinc-500 block">All Records</span>
        </SpatialCard>

        {/* Submitted */}
        <SpatialCard elevation={1} className="p-3.5 space-y-1 text-center">
          <span className="text-[10px] font-mono uppercase text-zinc-400 font-medium block">
            Submitted
          </span>
          <div className="text-2xl font-bold font-mono text-zinc-200">
            {stats.submitted}
          </div>
          <span className="text-[9px] font-mono text-zinc-500 block">Awaiting Review</span>
        </SpatialCard>

        {/* In Progress */}
        <SpatialCard elevation={1} className="p-3.5 space-y-1 text-center">
          <span className="text-[10px] font-mono uppercase text-amber-400 font-medium block">
            In Progress
          </span>
          <div className="text-2xl font-bold font-mono text-amber-400">
            {stats.inProgress}
          </div>
          <span className="text-[9px] font-mono text-zinc-500 block">Under Fix</span>
        </SpatialCard>

        {/* Blocked */}
        <SpatialCard elevation={1} className="p-3.5 space-y-1 text-center">
          <span className="text-[10px] font-mono uppercase text-rose-400 font-medium block">
            Blocked
          </span>
          <div className="text-2xl font-bold font-mono text-rose-400">
            {stats.blocked}
          </div>
          <span className="text-[9px] font-mono text-zinc-500 block">Action Needed</span>
        </SpatialCard>

        {/* Resolved */}
        <SpatialCard elevation={1} className="p-3.5 space-y-1 text-center">
          <span className="text-[10px] font-mono uppercase text-emerald-400 font-medium block">
            Resolved
          </span>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {stats.resolved}
          </div>
          <span className="text-[9px] font-mono text-zinc-500 block">Completed</span>
        </SpatialCard>

        {/* Closed */}
        <SpatialCard elevation={1} className="p-3.5 space-y-1 text-center">
          <span className="text-[10px] font-mono uppercase text-zinc-500 font-medium block">
            Closed
          </span>
          <div className="text-2xl font-bold font-mono text-zinc-400">
            {stats.closed}
          </div>
          <span className="text-[9px] font-mono text-zinc-500 block">Archived</span>
        </SpatialCard>
      </div>

      {/* ========================================================================= */}
      {/* 3. SEARCH & MULTI-FILTER BAR */}
      {/* ========================================================================= */}
      <SpatialCard elevation={2} className="p-4 space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search complaints by ID, title, category, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#07070A] border border-white/[0.09] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-red-500/70 focus:ring-1 focus:ring-red-500/40 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick Clear Filter Button if active */}
          {isFilterActive && (
            <button
              onClick={handleClearFilters}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-950/30 border border-red-500/30 text-red-400 hover:bg-red-900/40 text-xs font-mono transition-colors cursor-pointer self-start lg:self-auto shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        {/* Dropdowns Row: Status, Category, Priority, Sort */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          {/* Status Filter */}
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-zinc-500 uppercase block">Status</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full bg-[#0A0A0E] border border-white/[0.09] rounded-xl px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-red-500/60"
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value} className="bg-[#0A0A0E] text-white">
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-zinc-500 uppercase block">Category</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as any)}
              className="w-full bg-[#0A0A0E] border border-white/[0.09] rounded-xl px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-red-500/60"
            >
              <option value="ALL" className="bg-[#0A0A0E] text-white">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat} className="bg-[#0A0A0E] text-white">
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-zinc-500 uppercase block">Priority</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as any)}
              className="w-full bg-[#0A0A0E] border border-white/[0.09] rounded-xl px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-red-500/60"
            >
              {PRIORITIES.map((p) => (
                <option key={p.value} value={p.value} className="bg-[#0A0A0E] text-white">
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-zinc-500 uppercase block">Sort By</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full bg-[#0A0A0E] border border-white/[0.09] rounded-xl px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-red-500/60"
            >
              <option value="newest" className="bg-[#0A0A0E] text-white">Newest First</option>
              <option value="oldest" className="bg-[#0A0A0E] text-white">Oldest First</option>
              <option value="priority" className="bg-[#0A0A0E] text-white">Priority (High-Low)</option>
              <option value="status" className="bg-[#0A0A0E] text-white">Status</option>
            </select>
          </div>
        </div>
      </SpatialCard>

      {/* ========================================================================= */}
      {/* 4. COMPLAINT LIST & EMPTY STATES */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
          <span>Showing {filteredComplaints.length} of {complaints.length} complaints</span>
          {isFilterActive && <span className="text-red-400">Filters applied</span>}
        </div>

        {/* LOADING STATE */}
        {isLoading ? (
          <SpatialCard elevation={1} className="p-10 text-center space-y-2">
            <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-mono text-zinc-400">Loading complaints from server...</p>
          </SpatialCard>
        ) : error ? (
          <SpatialCard elevation={1} className="p-10 text-center space-y-3">
            <p className="text-xs text-red-400">{error}</p>
            <Button variant="secondary" size="sm" onClick={loadData}>
              Retry
            </Button>
          </SpatialCard>
        ) : complaints.length === 0 ? (
          <SpatialCard elevation={2} className="p-10 sm:p-14 text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-[#0F0F16] border border-white/[0.09] flex items-center justify-center mx-auto text-red-500 shadow-inner">
              <FileText className="w-7 h-7" />
            </div>

            <div className="space-y-1.5 max-w-sm mx-auto">
              <h3 className="text-lg font-bold text-white font-display">
                No complaints yet
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Your submitted complaints will appear here.
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
                <span>SUBMIT NEW COMPLAINT</span>
              </Button>
            </div>
          </SpatialCard>
        ) : filteredComplaints.length === 0 ? (
          /* NO MATCHING RESULTS FROM FILTERS */
          <SpatialCard elevation={1} className="p-10 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#0E0E14] border border-white/[0.08] flex items-center justify-center mx-auto text-zinc-500">
              <Search className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">
                No matching complaints
              </h3>
              <p className="text-xs text-zinc-400">
                None of your registered complaints match the selected query and filters.
              </p>
            </div>

            <div className="pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleClearFilters}
              >
                Clear Filters
              </Button>
            </div>
          </SpatialCard>
        ) : (
          /* COMPLAINT CARDS LIST */
          <div className="space-y-4">
            {filteredComplaints.map((item) => (
              <SpatialCard
                key={item.id}
                elevation={2}
                className="p-5 sm:p-6 space-y-4 hover:border-red-500/40 transition-all duration-200 group"
              >
                {/* Header Strip: ID, Category, Location, Priority, Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.07]">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-red-500 px-2 py-0.5 rounded bg-red-950/40 border border-red-500/30">
                      {item.id}
                    </span>
                    <span className="text-zinc-600" aria-hidden="true">·</span>
                    <span className="text-xs font-semibold text-zinc-300">
                      {item.category}
                    </span>
                    {item.location && (
                      <>
                        <span className="text-zinc-600" aria-hidden="true">·</span>
                        <span className="text-xs text-zinc-400 truncate max-w-[200px] flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-zinc-500" />
                          <span>{item.location}</span>
                        </span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border uppercase ${getPriorityBadgeClass(item.priority)}`}>
                      {item.priority}
                    </span>
                    <span className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded border ${getSlaBadgeClass(item.slaStatus)}`}>
                      {item.slaStatus}
                    </span>
                  </div>
                </div>

                {/* Title & Description */}
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-red-400 transition-colors leading-tight">
                      {item.title}
                    </h3>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSelectedComplaint(item)}
                      className="shrink-0 hidden sm:flex items-center gap-1.5"
                    >
                      <span>VIEW DETAILS</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  <p className="text-xs text-zinc-300 leading-relaxed line-clamp-2">
                    {item.description}
                  </p>

                  {/* Attachment Indicator if exists */}
                  {item.attachment && (
                    <div className="pt-1 flex items-center gap-2 text-[11px] text-zinc-400 font-mono">
                      <span className="p-1 rounded bg-[#101016] border border-white/[0.08] text-red-400">
                        <ImageIcon className="w-3.5 h-3.5" />
                      </span>
                      <span>Evidence attached: {item.attachment.name}</span>
                    </div>
                  )}
                </div>

                {/* Status Stepper Progression */}
                <div className="pt-2">
                  <ComplaintStatusStepper currentStatus={item.status} />
                </div>

                {/* Footer Bar: Submitted Date, SLA Target, Mobile Action */}
                <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-zinc-500">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Submitted: {formatSubmittedDate(item.createdAt)}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-zinc-400 font-mono">
                      Target SLA: {item.targetSlaHours}h
                    </span>

                    {/* Mobile Button */}
                    <button
                      onClick={() => setSelectedComplaint(item)}
                      className="sm:hidden text-xs text-red-400 hover:text-white font-semibold flex items-center gap-1"
                    >
                      <span>DETAILS</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </SpatialCard>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 5. MODALS & DRAWERS */}
      {/* ========================================================================= */}
      
      {/* Submission Modal */}
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
