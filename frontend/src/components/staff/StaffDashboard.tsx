import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useRole } from '../../context/RoleContext.tsx';
import { StaffUser } from '../../types/auth.ts';
import { 
  Complaint, 
  ComplaintStatus, 
  ComplaintPriority, 
  ComplaintCategory,
  StaffStatistics,
  DEPARTMENT_CATEGORIES_MAP,
  CATEGORY_SLA_HOURS
} from '../../types/studentDashboard.ts';
import { complaintsApi } from '../../services/api.ts';
import { SpatialCard } from '../design-system/SpatialCard.tsx';
import { Button } from '../design-system/Button.tsx';
import { StaffComplaintDetailsDrawer } from './StaffComplaintDetailsDrawer.tsx';
import { ComplaintStatusStepper } from '../student/ComplaintStatusStepper.tsx';
import { 
  Wrench, 
  Search, 
  Filter, 
  RotateCcw, 
  Calendar, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ShieldAlert, 
  UserCheck, 
  Inbox, 
  AlertTriangle, 
  Layers, 
  ArrowRight, 
  Eye, 
  Image as ImageIcon,
  Building2,
  User,
  ShieldCheck,
  Check
} from 'lucide-react';

const STATUS_FILTER_OPTIONS: { value: 'ALL' | ComplaintStatus; label: string }[] = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'SUBMITTED', label: 'Submitted (Unassigned)' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'IN PROGRESS', label: 'In Progress' },
  { value: 'BLOCKED', label: 'Blocked' },
  { value: 'RESOLVED', label: 'Resolved' },
];

const PRIORITY_OPTIONS: { value: 'ALL' | ComplaintPriority; label: string }[] = [
  { value: 'ALL', label: 'All Priorities' },
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' },
];

type SortOption = 'newest' | 'oldest' | 'priority' | 'status';

export function StaffDashboard() {
  const { currentUser } = useAuth();
  const staff = currentUser as StaffUser | null;
  const { setRole } = useRole();

  // Guard: If role is not staff, synchronize role
  useEffect(() => {
    if (currentUser && currentUser.role !== 'staff') {
      setRole(currentUser.role);
    }
  }, [currentUser, setRole]);

  // Authenticated Staff Profile Info (Never fake or hardcoded)
  const staffName = staff?.name || 'Not provided';
  const staffEmployeeId = staff?.employeeId || 'Not provided';
  const staffEmail = staff?.email || 'Not provided';
  const staffDepartment = staff?.department || 'General Administration';

  // Real Complaints State from Backend Database
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<StaffStatistics>({
    assignedToMe: 0,
    unassigned: 0,
    inProgress: 0,
    blocked: 0,
    resolved: 0,
    slaRisk: 0,
  });

  // Selected complaint for drawer preview
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ComplaintStatus>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | ComplaintPriority>('ALL');
  const [slaFilter, setSlaFilter] = useState<string>('ALL');
  const [assignmentFilter, setAssignmentFilter] = useState<'ALL' | 'UNASSIGNED' | 'ASSIGNED_TO_ME'>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Load complaints for this staff member's department
  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const list = await complaintsApi.getComplaints();
      setComplaints(list);

      const assignedToMe = list.filter(
        (c) => c.assignedStaffId === staffEmployeeId && c.status !== 'CLOSED'
      ).length;
      const unassigned = list.filter(
        (c) => !c.assignedStaffId && c.status === 'SUBMITTED'
      ).length;
      const inProgress = list.filter((c) => c.status === 'IN PROGRESS').length;
      const blocked = list.filter((c) => c.status === 'BLOCKED').length;
      const resolved = list.filter((c) => c.status === 'RESOLVED').length;
      const slaRisk = list.filter(
        (c) => (c.slaStatus === 'Approaching SLA' || c.slaStatus === 'SLA Breached') && c.status !== 'RESOLVED' && c.status !== 'CLOSED'
      ).length;

      setStats({
        assignedToMe,
        unassigned,
        inProgress,
        blocked,
        resolved,
        slaRisk,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load department work queue from server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [staffDepartment, staffEmployeeId]);

  // Handle complaint update from drawer
  const handleComplaintUpdated = (updated: Complaint) => {
    setSelectedComplaint(updated);
    loadData();
  };

  // Claim complaint directly from card list
  const handleQuickClaim = async (e: React.MouseEvent, complaintId: string) => {
    e.stopPropagation();
    try {
      await complaintsApi.claimComplaint(complaintId);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to claim complaint.');
    }
  };

  // Reset Filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setCategoryFilter('ALL');
    setPriorityFilter('ALL');
    setSlaFilter('ALL');
    setAssignmentFilter('ALL');
    setSortBy('newest');
  };

  const isFilterActive = 
    searchQuery || 
    statusFilter !== 'ALL' || 
    categoryFilter !== 'ALL' || 
    priorityFilter !== 'ALL' || 
    slaFilter !== 'ALL' || 
    assignmentFilter !== 'ALL' || 
    sortBy !== 'newest';

  // Allowed categories for this department to populate category filter
  const departmentCategories = DEPARTMENT_CATEGORIES_MAP[staffDepartment] || DEPARTMENT_CATEGORIES_MAP['General Administration'];

  // Filtered and Sorted Complaints
  const filteredComplaints = useMemo(() => {
    let result = [...complaints];

    // Search Filter (ID, Title, Location)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.id.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          (c.location && c.location.toLowerCase().includes(q)) ||
          (c.block && c.block.toLowerCase().includes(q)) ||
          (c.room && c.room.toLowerCase().includes(q)) ||
          c.category.toLowerCase().includes(q)
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

    // SLA Status Filter
    if (slaFilter !== 'ALL') {
      result = result.filter((c) => c.slaStatus === slaFilter);
    }

    // Assignment Filter
    if (assignmentFilter === 'UNASSIGNED') {
      result = result.filter((c) => !c.assignedStaffId);
    } else if (assignmentFilter === 'ASSIGNED_TO_ME') {
      result = result.filter((c) => c.assignedStaffId === staffEmployeeId);
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
  }, [complaints, searchQuery, statusFilter, categoryFilter, priorityFilter, slaFilter, assignmentFilter, sortBy, staffEmployeeId]);

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
      {/* 1. HEADER AREA & AUTHENTICATED STAFF SUMMARY */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
            <span className="text-red-500 font-semibold uppercase">DEPARTMENT CONSOLE</span>
            <span className="text-zinc-600" aria-hidden="true">·</span>
            <span>EMP ID: {staffEmployeeId}</span>
            <span className="text-zinc-600" aria-hidden="true">·</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Active Shift
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white font-display">
            Staff Dashboard
          </h1>

          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-2xl">
            Review, claim, and manage complaints assigned to your department.
          </p>
        </div>

        {/* Department Badge */}
        <div className="p-3 rounded-2xl bg-[#09090D] border border-white/[0.08] text-right space-y-0.5 self-start sm:self-auto shrink-0">
          <span className="text-[10px] font-mono uppercase text-zinc-500 block">Department Scope</span>
          <span className="text-xs font-bold text-white block max-w-[220px] truncate">{staffDepartment}</span>
        </div>
      </div>

      {/* Compact Authenticated Staff Profile Summary */}
      <SpatialCard elevation={1} className="p-4 sm:p-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="space-y-1">
            <span className="text-zinc-500 font-mono text-[10px] uppercase block tracking-wider">
              Staff Name
            </span>
            <span className="text-white font-semibold text-sm truncate block">
              {staffName}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-zinc-500 font-mono text-[10px] uppercase block tracking-wider">
              Employee ID
            </span>
            <span className="text-red-400 font-mono font-semibold text-sm truncate block">
              {staffEmployeeId}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-zinc-500 font-mono text-[10px] uppercase block tracking-wider">
              Official Email
            </span>
            <span className="text-zinc-200 font-mono text-xs truncate block" title={staffEmail}>
              {staffEmail}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-zinc-500 font-mono text-[10px] uppercase block tracking-wider">
              Assigned Department
            </span>
            <span className="text-zinc-200 font-medium text-xs truncate block" title={staffDepartment}>
              {staffDepartment}
            </span>
          </div>
        </div>
      </SpatialCard>

      {/* ========================================================================= */}
      {/* 2. STAFF METRICS (6 3D SPATIAL CARDS) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Assigned to Me */}
        <SpatialCard elevation={2} className="p-3.5 space-y-1 text-center border-red-500/20">
          <span className="text-[10px] font-mono uppercase text-red-400 font-semibold block">
            Assigned to Me
          </span>
          <div className="text-2xl font-bold font-mono text-red-500">
            {stats.assignedToMe}
          </div>
          <span className="text-[9px] font-mono text-zinc-500 block">Active Workorders</span>
        </SpatialCard>

        {/* Unassigned */}
        <SpatialCard elevation={2} className="p-3.5 space-y-1 text-center">
          <span className="text-[10px] font-mono uppercase text-amber-400 font-medium block">
            Unassigned
          </span>
          <div className="text-2xl font-bold font-mono text-amber-400">
            {stats.unassigned}
          </div>
          <span className="text-[9px] font-mono text-zinc-500 block">Available to Claim</span>
        </SpatialCard>

        {/* In Progress */}
        <SpatialCard elevation={2} className="p-3.5 space-y-1 text-center">
          <span className="text-[10px] font-mono uppercase text-blue-400 font-medium block">
            In Progress
          </span>
          <div className="text-2xl font-bold font-mono text-blue-400">
            {stats.inProgress}
          </div>
          <span className="text-[9px] font-mono text-zinc-500 block">Under Execution</span>
        </SpatialCard>

        {/* Blocked */}
        <SpatialCard elevation={2} className="p-3.5 space-y-1 text-center">
          <span className="text-[10px] font-mono uppercase text-rose-400 font-medium block">
            Blocked
          </span>
          <div className="text-2xl font-bold font-mono text-rose-400">
            {stats.blocked}
          </div>
          <span className="text-[9px] font-mono text-zinc-500 block">Awaiting Parts</span>
        </SpatialCard>

        {/* Resolved */}
        <SpatialCard elevation={2} className="p-3.5 space-y-1 text-center">
          <span className="text-[10px] font-mono uppercase text-emerald-400 font-medium block">
            Resolved
          </span>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {stats.resolved}
          </div>
          <span className="text-[9px] font-mono text-zinc-500 block">Completed</span>
        </SpatialCard>

        {/* SLA Risk */}
        <SpatialCard elevation={2} className="p-3.5 space-y-1 text-center">
          <span className="text-[10px] font-mono uppercase text-purple-400 font-medium block">
            SLA Risk
          </span>
          <div className="text-2xl font-bold font-mono text-purple-400">
            {stats.slaRisk}
          </div>
          <span className="text-[9px] font-mono text-zinc-500 block">Attention Needed</span>
        </SpatialCard>
      </div>

      {/* ========================================================================= */}
      {/* 3. STAFF WORK QUEUE SECTION */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white font-display">
              Work Queue
            </h2>
            <span className="text-xs font-mono text-zinc-400">
              ({filteredComplaints.length} Department Tickets)
            </span>
          </div>

          <span className="text-xs font-mono text-zinc-500 hidden sm:inline">
            Scope: {staffDepartment}
          </span>
        </div>

        {/* Search & Filters Spatial Card */}
        <SpatialCard elevation={2} className="p-4 space-y-3">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Search Box */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search work queue by ID, title, room, or building..."
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

            {/* Clear Filters Button */}
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

          {/* Filters Row */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
            {/* Assignment Filter */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-zinc-500 uppercase block">Assignment</span>
              <select
                value={assignmentFilter}
                onChange={(e) => setAssignmentFilter(e.target.value as any)}
                className="w-full bg-[#0A0A0E] border border-white/[0.09] rounded-xl px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-red-500/60"
              >
                <option value="ALL" className="bg-[#0A0A0E] text-white">All Assignment</option>
                <option value="UNASSIGNED" className="bg-[#0A0A0E] text-amber-300">Unassigned (Claimable)</option>
                <option value="ASSIGNED_TO_ME" className="bg-[#0A0A0E] text-red-400">Assigned to Me</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-zinc-500 uppercase block">Status</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full bg-[#0A0A0E] border border-white/[0.09] rounded-xl px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-red-500/60"
              >
                {STATUS_FILTER_OPTIONS.map((s) => (
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
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full bg-[#0A0A0E] border border-white/[0.09] rounded-xl px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-red-500/60"
              >
                <option value="ALL" className="bg-[#0A0A0E] text-white">All Dept Categories</option>
                {departmentCategories.map((cat) => (
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
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value} className="bg-[#0A0A0E] text-white">
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Order */}
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
        {/* 4. WORK QUEUE COMPLAINT LIST */}
        {/* ========================================================================= */}
        {isLoading ? (
          <SpatialCard elevation={1} className="p-10 text-center space-y-2">
            <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-mono text-zinc-400">Loading department work queue from server...</p>
          </SpatialCard>
        ) : error ? (
          <SpatialCard elevation={1} className="p-10 text-center space-y-3">
            <p className="text-xs text-red-400">{error}</p>
            <Button variant="secondary" size="sm" onClick={loadData}>
              Retry
            </Button>
          </SpatialCard>
        ) : complaints.length === 0 ? (
          <SpatialCard elevation={2} className="p-10 sm:p-14 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[#0F0F16] border border-white/[0.09] flex items-center justify-center mx-auto text-zinc-500">
              <Inbox className="w-7 h-7" />
            </div>

            <div className="space-y-1.5 max-w-sm mx-auto">
              <h3 className="text-base sm:text-lg font-bold text-white font-display">
                No complaints in department work queue
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                New grievances submitted by students for {staffDepartment} will appear here for technician triage and assignment.
              </p>
            </div>
          </SpatialCard>
        ) : filteredComplaints.length === 0 ? (
          <SpatialCard elevation={1} className="p-10 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#0E0E14] border border-white/[0.08] flex items-center justify-center mx-auto text-zinc-500">
              <Search className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">
                No matching complaints
              </h3>
              <p className="text-xs text-zinc-400">
                No complaints in the queue match the chosen filter parameters.
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
          <div className="space-y-4">
            {filteredComplaints.map((item) => {
              const isClaimable = !item.assignedStaffId;
              const isAssignedToThisStaff = item.assignedStaffId === staffEmployeeId;

              return (
                <SpatialCard
                  key={item.id}
                  elevation={2}
                  className="p-5 sm:p-6 space-y-4 hover:border-red-500/40 transition-all duration-200 group"
                >
                  {/* Top Bar: ID, Category, Location, Priority, Status */}
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

                  {/* Title & Description with Action Buttons */}
                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-1">
                        <h3 
                          onClick={() => setSelectedComplaint(item)}
                          className="text-base sm:text-lg font-bold text-white group-hover:text-red-400 transition-colors leading-tight cursor-pointer"
                        >
                          {item.title}
                        </h3>
                        <p className="text-xs text-zinc-300 leading-relaxed line-clamp-2">
                          {item.description}
                        </p>
                      </div>

                      {/* Action Buttons: VIEW & CLAIM */}
                      <div className="flex items-center gap-2 shrink-0 pt-1 sm:pt-0">
                        {isClaimable && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={(e) => handleQuickClaim(e, item.id)}
                            className="text-xs shadow-md"
                          >
                            <Wrench className="w-3.5 h-3.5 mr-1" />
                            <span>CLAIM</span>
                          </Button>
                        )}
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setSelectedComplaint(item)}
                          className="text-xs"
                        >
                          <span>VIEW</span>
                          <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      </div>
                    </div>

                    {/* Attachment Indicator */}
                    {item.attachment && (
                      <div className="pt-1 flex items-center gap-2 text-[11px] text-zinc-400 font-mono">
                        <span className="p-1 rounded bg-[#101016] border border-white/[0.08] text-red-400">
                          <ImageIcon className="w-3.5 h-3.5" />
                        </span>
                        <span>Evidence attached: {item.attachment.name}</span>
                      </div>
                    )}
                  </div>

                  {/* 5-Stage Stepper Progression */}
                  <div className="pt-1">
                    <ComplaintStatusStepper currentStatus={item.status} />
                  </div>

                  {/* Footer Strip */}
                  <div className="pt-3 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-zinc-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Submitted: {formatSubmittedDate(item.createdAt)}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span>Target SLA: {item.targetSlaHours}h</span>
                      <span className="text-zinc-600">·</span>
                      <span>
                        Staff: {item.assignedStaffName ? (
                          <strong className={isAssignedToThisStaff ? 'text-red-400' : 'text-zinc-300'}>
                            {item.assignedStaffName} {isAssignedToThisStaff && '(You)'}
                          </strong>
                        ) : (
                          <span className="text-amber-400">Unassigned</span>
                        )}
                      </span>
                    </div>
                  </div>
                </SpatialCard>
              );
            })}
          </div>
        )}
      </div>

      {/* Staff Complaint Details Drawer */}
      <StaffComplaintDetailsDrawer
        complaint={selectedComplaint}
        staffName={staffName}
        staffEmployeeId={staffEmployeeId}
        isOpen={Boolean(selectedComplaint)}
        onClose={() => setSelectedComplaint(null)}
        onComplaintUpdated={handleComplaintUpdated}
      />
    </div>
  );
}
