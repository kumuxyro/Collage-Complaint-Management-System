export type ComplaintStatus = 
  | 'SUBMITTED' 
  | 'ASSIGNED' 
  | 'IN PROGRESS' 
  | 'RESOLVED' 
  | 'CLOSED' 
  | 'BLOCKED';

export type SlaStatus = 
  | 'Within SLA' 
  | 'Approaching SLA' 
  | 'SLA Breached' 
  | 'SLA data unavailable';

export type ComplaintPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type ComplaintCategory = 
  | 'Classrooms' 
  | 'Laboratories' 
  | 'Fees & Accounts' 
  | 'Library' 
  | 'Hostel & Residential' 
  | 'Transport' 
  | 'IT & Network Services' 
  | 'Facilities & Campus Life';

export const CATEGORY_SLA_HOURS: Record<ComplaintCategory, number> = {
  'Classrooms': 24,
  'Laboratories': 12,
  'Fees & Accounts': 48,
  'Library': 24,
  'Hostel & Residential': 8,
  'Transport': 24,
  'IT & Network Services': 6,
  'Facilities & Campus Life': 36,
};

/**
 * Department Category Routing Foundation
 */
export const DEPARTMENT_CATEGORIES_MAP: Record<string, ComplaintCategory[]> = {
  'Estate & Infrastructure Maintenance': ['Classrooms', 'Facilities & Campus Life'],
  'Laboratory & Technical Safety': ['Laboratories'],
  'Finance & Accounts': ['Fees & Accounts'],
  'Library Operations': ['Library'],
  'Hostel & Residential Services': ['Hostel & Residential'],
  'Transport & Fleet Operations': ['Transport'],
  'IT & Network Services': ['IT & Network Services'],
  'General Administration': [
    'Classrooms',
    'Laboratories',
    'Fees & Accounts',
    'Library',
    'Hostel & Residential',
    'Transport',
    'IT & Network Services',
    'Facilities & Campus Life',
  ],
};

export function getDepartmentForCategory(category: ComplaintCategory): string {
  switch (category) {
    case 'Classrooms':
    case 'Facilities & Campus Life':
      return 'Estate & Infrastructure Maintenance';
    case 'Laboratories':
      return 'Laboratory & Technical Safety';
    case 'Fees & Accounts':
      return 'Finance & Accounts';
    case 'Library':
      return 'Library Operations';
    case 'Hostel & Residential':
      return 'Hostel & Residential Services';
    case 'Transport':
      return 'Transport & Fleet Operations';
    case 'IT & Network Services':
      return 'IT & Network Services';
    default:
      return 'General Administration';
  }
}

export interface ComplaintAttachment {
  name: string;
  size: number;
  type: string;
  dataUrl: string; // Base64 data URL for preview and local storage
}

export interface ComplaintActivityEvent {
  id: string;
  type: 'SUBMITTED' | 'ASSIGNED' | 'STATUS_CHANGE' | 'NOTE' | 'SLA_ALERT' | 'RESOLVED' | 'CLOSED';
  title: string;
  description: string;
  timestamp: string;
  actor: string;
}

export interface Complaint {
  id: string; // e.g. CMP-8X92K4B1
  complaintId?: string; // Display Complaint ID CMP-XXXXXXXX
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentUsn: string;
  category: ComplaintCategory;
  title: string;
  description: string;
  block: string;
  room: string;
  location: string;
  priority: ComplaintPriority;
  attachment?: ComplaintAttachment;
  status: ComplaintStatus;
  createdAt: string; // ISO String
  updatedAt: string; // ISO String
  targetSlaHours: number;
  slaStatus: SlaStatus;
  history?: ComplaintActivityEvent[];
  assignedTechnician?: string;
  jiraIssueKey?: string;
  jiraIssueId?: string;
  jiraIssueUrl?: string;
  jiraSyncStatus?: 'NOT_SYNCED' | 'SYNCED' | 'SYNC_FAILED' | 'PENDING_RETRY' | string;
  // Staff fields
  assignedStaffId?: string;
  assignedStaffName?: string;
  assignedAt?: string;
  blockedReason?: string;
  resolutionSummary?: string;
  resolvedAt?: string;
  department?: string;
}

export interface StudentNotification {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  link?: string;
}

export interface StudentStatistics {
  total: number;
  submitted: number;
  inProgress: number;
  blocked: number;
  resolved: number;
  closed: number;
}

export interface StaffStatistics {
  assignedToMe: number;
  unassigned: number;
  inProgress: number;
  blocked: number;
  resolved: number;
  slaRisk: number;
}

export interface AdminStatistics {
  total: number;
  submitted: number;
  inProgress: number;
  blocked: number;
  resolved: number;
  closed: number;
  slaRisk: number;
  unassigned: number;
}
