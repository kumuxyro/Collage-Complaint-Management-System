import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useRole } from '../../context/RoleContext.tsx';
import { AdminUser } from '../../types/auth.ts';
import { 
  Complaint, 
  ComplaintStatus, 
  ComplaintPriority, 
  ComplaintCategory, 
  AdminStatistics,
  DEPARTMENT_CATEGORIES_MAP,
  CATEGORY_SLA_HOURS,
  getDepartmentForCategory
} from '../../types/studentDashboard.ts';
import { complaintsApi } from '../../services/api.ts';
import { SpatialCard } from '../design-system/SpatialCard.tsx';
import { Button } from '../design-system/Button.tsx';
import { AdminComplaintDetailsDrawer } from './AdminComplaintDetailsDrawer.tsx';
import { ComplaintStatusStepper } from '../student/ComplaintStatusStepper.tsx';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  RotateCcw, 
  Calendar, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ShieldAlert, 
  Inbox, 
  Layers, 
  Building2, 
  User, 
  Activity, 
  BarChart3, 
  Eye, 
  ArrowRight, 
  AlertTriangle,
  FileText,
  UserCheck,
  Check,
  Image as ImageIcon
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

const DEPARTMENTS = [
  'Estate & Infrastructure Maintenance',
  'Laboratory & Technical Safety',
  'Finance & Accounts',
  'Library Operations',
  'Hostel & Residential Services',
  'Transport & Fleet Operations',
  'IT & Network Services',
  'General Administration',
];

const STATUS_OPTIONS: { value: 'ALL' | ComplaintStatus; label: string }[] = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'IN PROGRESS', label: 'In Progress' },
  { value: 'BLOCKED', label: 'Blocked' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'CLOSED', label: 'Closed' },
];

const PRIORITY_OPTIONS: { value: 'ALL' | ComplaintPriority; label: string }[] = [
  { value: 'ALL', label: 'All Priorities' },
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' },
];

type SortOption = 'newest' | 'oldest' | 'priority' | 'status';

export function AdminCommandCenter() {
  const { currentUser } = useAuth();
  const admin = currentUser as AdminUser | null;
  const { setRole } = useRole();

  // Guard: enforce admin role in context
  useEffect(() => {
    if (currentUser && currentUser.role !== 'admin') {
      setRole(currentUser.role);
    }
  }, [currentUser, setRole]);

  // Authenticated Admin Information (Strictly real account data)
  const adminName = admin?.name || 'Not provided';
  const adminId = admin?.adminId || 'Not provided';
  const adminEmail = admin?.email || 'Not provided';
  const adminUnit = admin?.adminUnit || 'Institutional Administration';

  // Shared Data State from Backend Database
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<AdminStatistics>({
    total: 0,
    submitted: 0,
    inProgress: 0,
    blocked: 0,
    resolved: 0,
    closed: 0,
    slaRisk: 0,
    unassigned: 0,
  });

  // Selected complaint for drawer inspection
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ComplaintStatus>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | ComplaintPriority>('ALL');
  const [slaFilter, setSlaFilter] = useState<string>('ALL');
  const [assignmentFilter, setAssignmentFilter] = useState<'ALL' | 'UNASSIGNED' | 'ASSIGNED'>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Load real institutional records from backend
  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const all = await complaintsApi.getComplaints();
      setComplaints(all);

      const submitted = all.filter((c) => c.status === 'SUBMITTED' || c.status === 'ASSIGNED').length;
      const inProgress = all.filter((c) => c.status === 'IN PROGRESS').length;
      const blocked = all.filter((c) => c.status === 'BLOCKED').length;
      const resolved = all.filter((c) => c.status === 'RESOLVED').length;
      const closed = all.filter((c) => c.status === 'CLOSED').length;
      const slaRisk = all.filter(
        (c) => (c.slaStatus === 'Approaching SLA' || c.slaStatus === 'SLA Breached') && c.status !== 'RESOLVED' && c.status !== 'CLOSED'
      ).length;
      const unassigned = all.filter((c) => !c.assignedStaffId && c.status === 'SUBMITTED').length;

      setStats({
        total: all.length,
        submitted,
        inProgress,
        blocked,
        resolved,
        closed,
        slaRisk,
        unassigned,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load institutional complaints from server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Recent Activity Events from backend complaints
  const recentActivities = useMemo(() => {
    const list: any[] = [];
    complaints.forEach((c) => {
      const hist = c.history && c.history.length > 0 ? c.history : [];
      hist.forEach((h) => {
        list.push({
          ...h,
          complaintId: c.complaintId || c.id,
          complaintTitle: c.title,
        });
      });
    });
    list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return list.slice(0, 8);
  }, [complaints]);

  // Status Distribution Calculation
  const statusDistribution = useMemo(() => {
    const stages: ComplaintStatus[] = ['SUBMITTED', 'ASSIGNED', 'IN PROGRESS', 'BLOCKED', 'RESOLVED', 'CLOSED'];
    return stages.map((st) => {
      const count = complaints.filter((c) => c.status === st).length;
      const percentage = stats.total > 0 ? ((count / stats.total) * 100).toFixed(0) : '0';
      return { status: st, count, percentage };
    });
  }, [complaints, stats.total]);

  // Priority Distribution Calculation
  const priorityDistribution = useMemo(() => {
    const list: ComplaintPriority[] = ['URGENT', 'HIGH', 'MEDIUM', 'LOW'];
    return list.map((pr) => {
      const count = complaints.filter((c) => c.priority === pr).length;
      const percentage = stats.total > 0 ? ((count / stats.total) * 100).toFixed(0) : '0';
      return { priority: pr, count, percentage };
    });
  }, [complaints, stats.total]);

  // Category Matrix Calculation
  const categoryMatrix = useMemo(() => {
    return CATEGORIES.map((cat) => {
      const catComplaints = complaints.filter((c) => c.category === cat);
      const total = catComplaints.length;
      const open = catComplaints.filter((c) => c.status !== 'RESOLVED' && c.status !== 'CLOSED').length;
      const resolved = catComplaints.filter((c) => c.status === 'RESOLVED' || c.status === 'CLOSED').length;
      return {
        category: cat,
        slaHours: CATEGORY_SLA_HOURS[cat],
        total,
        open,
        resolved,
      };
    });
  }, [complaints]);

  // Department Matrix Calculation
  const departmentMatrix = useMemo(() => {
    return DEPARTMENTS.map((dept) => {
      const allowedCategories = DEPARTMENT_CATEGORIES_MAP[dept] || [];
      const deptComplaints = complaints.filter((c) => allowedCategories.includes(c.category));
      const open = deptComplaints.filter((c) => c.status !== 'RESOLVED' && c.status !== 'CLOSED').length;
      const assigned = deptComplaints.filter((c) => c.status === 'ASSIGNED').length;
      const inProgress = deptComplaints.filter((c) => c.status === 'IN PROGRESS').length;
      const blocked = deptComplaints.filter((c) => c.status === 'BLOCKED').length;
      const resolved = deptComplaints.filter((c) => c.status === 'RESOLVED' || c.status === 'CLOSED').length;
      const slaRisk = deptComplaints.filter(
        (c) => (c.slaStatus === 'Approaching SLA' || c.slaStatus === 'SLA Breached') && c.status !== 'RESOLVED' && c.status !== 'CLOSED'
      ).length;

      return {
        department: dept,
        total: deptComplaints.length,
        open,
        assigned,
        inProgress,
        blocked,
        resolved,
        slaRisk,
      };
    });
  }, [complaints]);

  // SLA Monitor Items
  const slaMonitorComplaints = useMemo(() => {
    return complaints.slice(0, 8);
  }, [complaints]);

  // Reset Filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setCategoryFilter('ALL');
    setDepartmentFilter('ALL');
    setPriorityFilter('ALL');
    setSlaFilter('ALL');
    setAssignmentFilter('ALL');
    setSortBy('newest');
  };

  const isFilterActive = 
    searchQuery || 
    statusFilter !== 'ALL' || 
    categoryFilter !== 'ALL' || 
    departmentFilter !== 'ALL' || 
    priorityFilter !== 'ALL' || 
    slaFilter !== 'ALL' || 
    assignmentFilter !== 'ALL' || 
    sortBy !== 'newest';

  // Filtered Complaints List for All Complaints View
  const filteredComplaints = useMemo(() => {
    let result = [...complaints];

    // Global Search: ID, Title, Student Name, USN, Category, Department, Assigned Staff, Location
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((c) => {
        const dept = getDepartmentForCategory(c.category).toLowerCase();
        return (
          c.id.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          c.studentName.toLowerCase().includes(q) ||
          c.studentUsn.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q) ||
          dept.includes(q) ||
          (c.assignedStaffName && c.assignedStaffName.toLowerCase().includes(q)) ||
          (c.location && c.location.toLowerCase().includes(q)) ||
          (c.block && c.block.toLowerCase().includes(q)) ||
          (c.room && c.room.toLowerCase().includes(q))
        );
      });
    }

    // Status Filter
    if (statusFilter !== 'ALL') {
      result = result.filter((c) => c.status === statusFilter);
    }

    // Category Filter
    if (categoryFilter !== 'ALL') {
      result = result.filter((c) => c.category === categoryFilter);
    }

    // Department Filter
    if (departmentFilter !== 'ALL') {
      result = result.filter((c) => getDepartmentForCategory(c.category) === departmentFilter);
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
    } else if (assignmentFilter === 'ASSIGNED') {
      result = result.filter((c) => Boolean(c.assignedStaffId));
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
  }, [complaints, searchQuery, statusFilter, categoryFilter, departmentFilter, priorityFilter, slaFilter, assignmentFilter, sortBy]);

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
        return 'text-red-400 bg-red-950/40 border-red-500/30 font-bold';
      case 'HIGH':
        return 'text-amber-400 bg-amber-950/40 border-amber-500/30 font-semibold';
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
    <div className="space-y-8 max-w-7xl mx-auto w-full">
      {/* ========================================================================= */}
      {/* 1. HEADER AREA & AUTHENTICATED ADMIN PROFILE */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
            <span className="text-red-500 font-semibold uppercase">INSTITUTIONAL OVERSIGHT</span>
            <span className="text-zinc-600" aria-hidden="true">·</span>
            <span>ADMIN ID: {adminId}</span>
            <span className="text-zinc-600" aria-hidden="true">·</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Root Authorization
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white font-display">
            Admin Command Center
          </h1>

          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-2xl">
            Institutional oversight for complaints, departments, service levels, and resolution performance.
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-[#09090D] border border-white/[0.08] text-right space-y-0.5 self-start sm:self-auto shrink-0">
          <span className="text-[10px] font-mono uppercase text-zinc-500 block">Administration Unit</span>
          <span className="text-xs font-bold text-white block truncate max-w-[220px]">{adminUnit}</span>
        </div>
      </div>

      {/* Compact Authenticated Admin Profile Card */}
      <SpatialCard elevation={1} className="p-4 sm:p-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="space-y-1">
            <span className="text-zinc-500 font-mono text-[10px] uppercase block tracking-wider">
              Administrator Name
            </span>
            <span className="text-white font-semibold text-sm truncate block">
              {adminName}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-zinc-500 font-mono text-[10px] uppercase block tracking-wider">
              Institutional Admin ID
            </span>
            <span className="text-red-400 font-mono font-semibold text-sm truncate block">
              {adminId}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-zinc-500 font-mono text-[10px] uppercase block tracking-wider">
              Official Email
            </span>
            <span className="text-zinc-200 font-mono text-xs truncate block" title={adminEmail}>
              {adminEmail}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-zinc-500 font-mono text-[10px] uppercase block tracking-wider">
              Assigned Unit
            </span>
            <span className="text-zinc-200 font-medium text-xs truncate block" title={adminUnit}>
              {adminUnit}
            </span>
          </div>
        </div>
      </SpatialCard>

      {/* ========================================================================= */}
      {/* 2. INSTITUTIONAL OVERVIEW METRICS (8 SPATIAL CARDS) */}
      {/* ========================================================================= */}
      <div>
        <div className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold mb-3 flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-red-500" />
          <span>Institutional Grievance Telemetry</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {/* Total Complaints */}
          <SpatialCard elevation={2} className="p-3 text-center space-y-1">
            <span className="text-[10px] font-mono uppercase text-zinc-400 font-semibold block">Total</span>
            <div className="text-2xl font-bold font-mono text-white">{stats.total}</div>
            <span className="text-[9px] font-mono text-zinc-500 block">All Tickets</span>
          </SpatialCard>

          {/* Submitted */}
          <SpatialCard elevation={2} className="p-3 text-center space-y-1">
            <span className="text-[10px] font-mono uppercase text-zinc-300 font-medium block">Submitted</span>
            <div className="text-2xl font-bold font-mono text-zinc-200">{stats.submitted}</div>
            <span className="text-[9px] font-mono text-zinc-500 block">Inbound</span>
          </SpatialCard>

          {/* In Progress */}
          <SpatialCard elevation={2} className="p-3 text-center space-y-1">
            <span className="text-[10px] font-mono uppercase text-blue-400 font-medium block">In Progress</span>
            <div className="text-2xl font-bold font-mono text-blue-400">{stats.inProgress}</div>
            <span className="text-[9px] font-mono text-zinc-500 block">Active Work</span>
          </SpatialCard>

          {/* Blocked */}
          <SpatialCard elevation={2} className="p-3 text-center space-y-1">
            <span className="text-[10px] font-mono uppercase text-rose-400 font-medium block">Blocked</span>
            <div className="text-2xl font-bold font-mono text-rose-400">{stats.blocked}</div>
            <span className="text-[9px] font-mono text-zinc-500 block">Paused</span>
          </SpatialCard>

          {/* Resolved */}
          <SpatialCard elevation={2} className="p-3 text-center space-y-1">
            <span className="text-[10px] font-mono uppercase text-emerald-400 font-medium block">Resolved</span>
            <div className="text-2xl font-bold font-mono text-emerald-400">{stats.resolved}</div>
            <span className="text-[9px] font-mono text-zinc-500 block">Completed</span>
          </SpatialCard>

          {/* Closed */}
          <SpatialCard elevation={2} className="p-3 text-center space-y-1">
            <span className="text-[10px] font-mono uppercase text-zinc-500 font-medium block">Closed</span>
            <div className="text-2xl font-bold font-mono text-zinc-400">{stats.closed}</div>
            <span className="text-[9px] font-mono text-zinc-500 block">Archived</span>
          </SpatialCard>

          {/* SLA Risk */}
          <SpatialCard elevation={2} className="p-3 text-center space-y-1 border-red-500/20">
            <span className="text-[10px] font-mono uppercase text-purple-400 font-semibold block">SLA Risk</span>
            <div className="text-2xl font-bold font-mono text-purple-400">{stats.slaRisk}</div>
            <span className="text-[9px] font-mono text-zinc-500 block">At Risk</span>
          </SpatialCard>

          {/* Unassigned */}
          <SpatialCard elevation={2} className="p-3 text-center space-y-1">
            <span className="text-[10px] font-mono uppercase text-amber-400 font-medium block">Unassigned</span>
            <div className="text-2xl font-bold font-mono text-amber-400">{stats.unassigned}</div>
            <span className="text-[9px] font-mono text-zinc-500 block">Pending Tech</span>
          </SpatialCard>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. VISUAL DISTRIBUTIONS: STATUS & PRIORITY OVERVIEW */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <SpatialCard elevation={2} className="p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-red-500" />
              <h3 className="text-sm font-bold text-white font-display">
                Complaint Status Distribution
              </h3>
            </div>
            <span className="text-xs font-mono text-zinc-400">Total: {stats.total}</span>
          </div>

          {stats.total === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500 font-mono">
              No complaint data available.
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              {statusDistribution.map((item) => (
                <div key={item.status} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-zinc-300 font-medium">{item.status}</span>
                    <span className="text-zinc-400">
                      {item.count} tickets ({item.percentage}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-[#121218] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        item.status === 'RESOLVED' || item.status === 'CLOSED'
                          ? 'bg-emerald-500'
                          : item.status === 'BLOCKED'
                          ? 'bg-rose-500'
                          : item.status === 'IN PROGRESS'
                          ? 'bg-blue-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </SpatialCard>

        {/* Priority Breakdown */}
        <SpatialCard elevation={2} className="p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-white font-display">
                Priority Allocation
              </h3>
            </div>
            <span className="text-xs font-mono text-zinc-400">Severity Triage</span>
          </div>

          {stats.total === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500 font-mono">
              No complaint data available.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 pt-1">
              {priorityDistribution.map((item) => (
                <div
                  key={item.priority}
                  className="p-3.5 rounded-xl bg-[#09090D] border border-white/[0.06] space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold font-mono ${getPriorityBadgeClass(item.priority).split(' ')[0]}`}>
                      {item.priority}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500">{item.percentage}%</span>
                  </div>
                  <div className="text-xl font-bold font-mono text-white">
                    {item.count}
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono block">
                    Tickets Registered
                  </span>
                </div>
              ))}
            </div>
          )}
        </SpatialCard>
      </div>

      {/* ========================================================================= */}
      {/* 4. CATEGORY OVERVIEW (8 INSTITUTIONAL CATEGORIES) */}
      {/* ========================================================================= */}
      <SpatialCard elevation={2} className="p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-red-500" />
            <h3 className="text-sm font-bold text-white font-display">
              Category Overview
            </h3>
          </div>
          <span className="text-xs font-mono text-zinc-400">8 Institutional Domains</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {categoryMatrix.map((cat) => (
            <div
              key={cat.category}
              className="p-3.5 rounded-xl bg-[#09090D] border border-white/[0.06] space-y-2 hover:border-white/[0.14] transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-bold text-white block leading-tight">{cat.category}</span>
                <span className="text-[10px] font-mono text-red-400 shrink-0 font-semibold">{cat.slaHours}h SLA</span>
              </div>
              <div className="grid grid-cols-3 gap-1 text-center font-mono text-xs pt-1 border-t border-white/[0.04]">
                <div>
                  <span className="text-[9px] text-zinc-500 block uppercase">Total</span>
                  <span className="font-bold text-white">{cat.total}</span>
                </div>
                <div>
                  <span className="text-[9px] text-amber-400 block uppercase">Open</span>
                  <span className="font-bold text-amber-400">{cat.open}</span>
                </div>
                <div>
                  <span className="text-[9px] text-emerald-400 block uppercase">Resolved</span>
                  <span className="font-bold text-emerald-400">{cat.resolved}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </SpatialCard>

      {/* ========================================================================= */}
      {/* 5. DEPARTMENT MATRIX */}
      {/* ========================================================================= */}
      <SpatialCard elevation={2} className="p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-red-500" />
            <h3 className="text-sm font-bold text-white font-display">
              Department Matrix
            </h3>
          </div>
          <span className="text-xs font-mono text-zinc-400">Cross-Unit Operational Performance</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-white/[0.08] text-zinc-500 text-[10px] uppercase">
                <th className="py-2.5 px-3">Department Domain</th>
                <th className="py-2.5 px-3 text-center">Open Tickets</th>
                <th className="py-2.5 px-3 text-center">Assigned</th>
                <th className="py-2.5 px-3 text-center">In Progress</th>
                <th className="py-2.5 px-3 text-center">Blocked</th>
                <th className="py-2.5 px-3 text-center">Resolved</th>
                <th className="py-2.5 px-3 text-center">SLA Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {departmentMatrix.map((dept) => (
                <tr key={dept.department} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-3 font-semibold text-white truncate max-w-[240px]">
                    {dept.department}
                  </td>
                  <td className="py-3 px-3 text-center text-amber-400 font-bold">{dept.open}</td>
                  <td className="py-3 px-3 text-center text-zinc-300">{dept.assigned}</td>
                  <td className="py-3 px-3 text-center text-blue-400">{dept.inProgress}</td>
                  <td className="py-3 px-3 text-center text-rose-400">{dept.blocked}</td>
                  <td className="py-3 px-3 text-center text-emerald-400">{dept.resolved}</td>
                  <td className="py-3 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] ${
                      dept.slaRisk > 0 ? 'bg-red-950/40 text-red-400 border border-red-500/30 font-bold' : 'text-zinc-500'
                    }`}>
                      {dept.slaRisk}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SpatialCard>

      {/* ========================================================================= */}
      {/* 6. SLA MONITOR & RECENT ACTIVITY SPLIT */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SLA Monitor */}
        <SpatialCard elevation={2} className="p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-500" />
              <h3 className="text-sm font-bold text-white font-display">
                SLA Monitor
              </h3>
            </div>
            <span className="text-[11px] font-mono text-zinc-500">Notice: SLA countdown unavailable</span>
          </div>

          {complaints.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500 font-mono">
              No complaint records under SLA monitoring.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
              {slaMonitorComplaints.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedComplaint(item)}
                  className="p-3 rounded-xl bg-[#09090D] border border-white/[0.06] hover:border-red-500/40 transition-all cursor-pointer space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-red-400 font-bold">{item.id}</span>
                      <span className="text-zinc-600">·</span>
                      <span className="text-zinc-300 font-semibold">{item.category}</span>
                    </div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${getSlaBadgeClass(item.slaStatus)}`}>
                      {item.slaStatus}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                    <span className="truncate max-w-[200px]">Tech: {item.assignedStaffName || 'Unassigned'}</span>
                    <span>Target: {item.targetSlaHours}h</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SpatialCard>

        {/* Recent Activity Log */}
        <SpatialCard elevation={2} className="p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-bold text-white font-display">
                Recent Institutional Activity
              </h3>
            </div>
            <span className="text-xs font-mono text-zinc-400">{recentActivities.length} Audited Events</span>
          </div>

          {recentActivities.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500 font-mono">
              No activity recorded yet.
            </div>
          ) : (
            <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
              {recentActivities.map((evt, idx) => (
                <div key={evt.id || idx} className="flex items-start gap-3 text-xs">
                  <div className="w-6 h-6 rounded-full bg-red-950/40 border border-red-500/40 text-red-400 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div className="space-y-0.5 overflow-hidden">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{evt.title}</span>
                      <span className="font-mono text-[10px] text-red-400 font-semibold">({evt.complaintId})</span>
                    </div>
                    <p className="text-zinc-400 text-[11px] leading-relaxed">
                      {evt.description}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500">
                      <span>By: {evt.actor}</span>
                      <span>·</span>
                      <span>{formatSubmittedDate(evt.timestamp)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SpatialCard>
      </div>

      {/* ========================================================================= */}
      {/* 7. ALL COMPLAINTS VIEW & GLOBAL OVERSIGHT TABLE */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white font-display">
              All Institutional Complaints
            </h2>
            <span className="text-xs font-mono text-zinc-400">
              ({filteredComplaints.length} of {complaints.length} Records)
            </span>
          </div>
          <span className="text-xs font-mono text-zinc-500 hidden sm:inline">
            Global Search & Multi-Department Triage
          </span>
        </div>

        {/* Search & Filters Card */}
        <SpatialCard elevation={2} className="p-4 space-y-3">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Global search by ID, title, student name, USN, category, department, staff, or location..."
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

            {/* Clear Filters */}
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
            {/* Status Filter */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-zinc-500 uppercase block">Status</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full bg-[#0A0A0E] border border-white/[0.09] rounded-xl px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-red-500/60"
              >
                {STATUS_OPTIONS.map((s) => (
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
                <option value="ALL" className="bg-[#0A0A0E] text-white">All Categories</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="bg-[#0A0A0E] text-white">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Department Filter */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-zinc-500 uppercase block">Department</span>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="w-full bg-[#0A0A0E] border border-white/[0.09] rounded-xl px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-red-500/60"
              >
                <option value="ALL" className="bg-[#0A0A0E] text-white">All Departments</option>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept} className="bg-[#0A0A0E] text-white">
                    {dept}
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

            {/* Assignment Filter */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-zinc-500 uppercase block">Assignment</span>
              <select
                value={assignmentFilter}
                onChange={(e) => setAssignmentFilter(e.target.value as any)}
                className="w-full bg-[#0A0A0E] border border-white/[0.09] rounded-xl px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-red-500/60"
              >
                <option value="ALL" className="bg-[#0A0A0E] text-white">All Records</option>
                <option value="UNASSIGNED" className="bg-[#0A0A0E] text-amber-300">Unassigned</option>
                <option value="ASSIGNED" className="bg-[#0A0A0E] text-emerald-400">Assigned</option>
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

        {/* Complaints Table / List */}
        {isLoading ? (
          <SpatialCard elevation={1} className="p-12 text-center space-y-2">
            <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-mono text-zinc-400">Loading institutional records from server...</p>
          </SpatialCard>
        ) : error ? (
          <SpatialCard elevation={1} className="p-12 text-center space-y-3">
            <p className="text-xs text-red-400">{error}</p>
            <Button variant="secondary" size="sm" onClick={loadData}>
              Retry
            </Button>
          </SpatialCard>
        ) : complaints.length === 0 ? (
          <SpatialCard elevation={2} className="p-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-[#0F0F16] border border-white/[0.09] flex items-center justify-center mx-auto text-zinc-500">
              <Inbox className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-white font-display">
              No institutional complaints recorded
            </h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              Complaints registered by students will appear in this oversight command center in real-time.
            </p>
          </SpatialCard>
        ) : filteredComplaints.length === 0 ? (
          <SpatialCard elevation={1} className="p-10 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#0E0E14] border border-white/[0.08] flex items-center justify-center mx-auto text-zinc-500">
              <Search className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">
                No matching complaints found
              </h3>
              <p className="text-xs text-zinc-400">
                Adjust or reset your search parameters to view institutional records.
              </p>
            </div>
            <div className="pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleClearFilters}
              >
                Reset Filters
              </Button>
            </div>
          </SpatialCard>
        ) : (
          <div className="space-y-4">
            {filteredComplaints.map((item) => {
              const dept = getDepartmentForCategory(item.category);
              return (
                <SpatialCard
                  key={item.id}
                  elevation={2}
                  className="p-5 space-y-3 hover:border-red-500/40 transition-all group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-white/[0.07]">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-red-500 px-2 py-0.5 rounded bg-red-950/40 border border-red-500/30">
                        {item.id}
                      </span>
                      <span className="text-zinc-600">·</span>
                      <span className="text-xs font-semibold text-zinc-300">{item.category}</span>
                      <span className="text-zinc-600">·</span>
                      <span className="text-xs text-zinc-400">{dept}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${getPriorityBadgeClass(item.priority)}`}>
                        {item.priority}
                      </span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${getSlaBadgeClass(item.slaStatus)}`}>
                        {item.slaStatus}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h3
                        onClick={() => setSelectedComplaint(item)}
                        className="text-base font-bold text-white group-hover:text-red-400 transition-colors cursor-pointer leading-tight"
                      >
                        {item.title}
                      </h3>
                      <p className="text-xs text-zinc-300 line-clamp-2">
                        {item.description}
                      </p>
                      <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-400 pt-1">
                        <span>Student: <strong className="text-zinc-200">{item.studentName}</strong> ({item.studentUsn})</span>
                        {item.location && <span>Location: {item.location}</span>}
                      </div>
                    </div>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSelectedComplaint(item)}
                      className="shrink-0 self-start text-xs flex items-center gap-1"
                    >
                      <span>VIEW DETAILS</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  <div className="pt-1">
                    <ComplaintStatusStepper currentStatus={item.status} />
                  </div>

                  <div className="pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-zinc-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Submitted: {formatSubmittedDate(item.createdAt)}</span>
                    </div>
                    <div>
                      <span>Assigned Staff: </span>
                      <strong className={item.assignedStaffName ? 'text-zinc-300' : 'text-amber-400'}>
                        {item.assignedStaffName || 'Unassigned'}
                      </strong>
                    </div>
                  </div>
                </SpatialCard>
              );
            })}
          </div>
        )}
      </div>

      {/* Admin Complaint Inspection Drawer */}
      <AdminComplaintDetailsDrawer
        complaint={selectedComplaint}
        isOpen={Boolean(selectedComplaint)}
        onClose={() => setSelectedComplaint(null)}
      />
    </div>
  );
}
