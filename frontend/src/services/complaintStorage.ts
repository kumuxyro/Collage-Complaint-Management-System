import { 
  Complaint, 
  ComplaintStatus,
  ComplaintActivityEvent,
  StudentNotification, 
  StudentStatistics,
  StaffStatistics,
  AdminStatistics,
  DEPARTMENT_CATEGORIES_MAP
} from '../types/studentDashboard.ts';

const COMPLAINTS_STORAGE_KEY = 'college_cms_student_complaints_v1';
const NOTIFICATIONS_STORAGE_KEY = 'college_cms_student_notifications_v1';

export class ComplaintStorage {
  /**
   * Generates a unique, non-hardcoded complaint ID with format CMP-XXXXXXXX
   */
  public static generateComplaintId(): string {
    const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    // Generate 8 characters
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `CMP-${code}`;
  }

  /**
   * Retrieves all complaints
   */
  public static getAllComplaints(): Complaint[] {
    try {
      const data = localStorage.getItem(COMPLAINTS_STORAGE_KEY);
      if (!data) return [];
      return JSON.parse(data) as Complaint[];
    } catch {
      return [];
    }
  }

  /**
   * Retrieves complaints belonging strictly to the specified authenticated student.
   * Isolates records by email / USN so another student cannot view them.
   */
  public static getComplaintsByStudent(email: string, usn: string): Complaint[] {
    const all = this.getAllComplaints();
    const cleanEmail = email.trim().toLowerCase();
    const cleanUsn = usn.trim().toUpperCase();
    return all.filter(
      (c) =>
        (c.studentEmail && c.studentEmail.toLowerCase() === cleanEmail) ||
        (cleanUsn && c.studentUsn && c.studentUsn.toUpperCase() === cleanUsn)
    );
  }

  /**
   * Retrieves complaints relevant to a staff member's department.
   * Staff isolation: staff only see complaints for categories their department handles.
   */
  public static getComplaintsByDepartment(department: string): Complaint[] {
    const all = this.getAllComplaints();
    const allowedCategories = DEPARTMENT_CATEGORIES_MAP[department] || DEPARTMENT_CATEGORIES_MAP['General Administration'];
    return all.filter((c) => allowedCategories.includes(c.category));
  }

  /**
   * Retrieves a single complaint by ID
   */
  public static getComplaintById(id: string): Complaint | undefined {
    const all = this.getAllComplaints();
    return all.find((c) => c.id === id);
  }

  /**
   * Adds a newly submitted complaint to local persistence
   */
  public static addComplaint(complaint: Complaint): void {
    try {
      const all = this.getAllComplaints();
      all.unshift(complaint);
      localStorage.setItem(COMPLAINTS_STORAGE_KEY, JSON.stringify(all));
    } catch {
      // Storage error
    }
  }

  /**
   * Updates an existing complaint and optionally appends an activity event
   */
  public static updateComplaint(
    id: string, 
    updates: Partial<Complaint>, 
    activityEvent?: ComplaintActivityEvent
  ): Complaint | null {
    try {
      const all = this.getAllComplaints();
      const index = all.findIndex((c) => c.id === id);
      if (index === -1) return null;

      const current = all[index];
      const updatedHistory = current.history ? [...current.history] : [];
      if (activityEvent) {
        updatedHistory.unshift(activityEvent);
      }

      const updatedRecord: Complaint = {
        ...current,
        ...updates,
        history: updatedHistory,
        updatedAt: new Date().toISOString(),
      };

      all[index] = updatedRecord;
      localStorage.setItem(COMPLAINTS_STORAGE_KEY, JSON.stringify(all));
      return updatedRecord;
    } catch {
      return null;
    }
  }

  /**
   * Claims a complaint for an authenticated staff member
   */
  public static claimComplaint(
    complaintId: string, 
    staffId: string, 
    staffName: string
  ): Complaint | null {
    const now = new Date().toISOString();
    const event: ComplaintActivityEvent = {
      id: `act-${Date.now()}`,
      type: 'ASSIGNED',
      title: 'Complaint Claimed',
      description: `Claimed by technician ${staffName} and moved to ASSIGNED.`,
      timestamp: now,
      actor: staffName,
    };

    return this.updateComplaint(
      complaintId,
      {
        status: 'ASSIGNED',
        assignedStaffId: staffId,
        assignedStaffName: staffName,
        assignedAt: now,
      },
      event
    );
  }

  /**
   * Updates complaint status with validation for BLOCKED and RESOLVED
   */
  public static updateStatus(
    complaintId: string,
    newStatus: ComplaintStatus,
    staffName: string,
    reasonOrSummary?: string
  ): Complaint | null {
    const now = new Date().toISOString();
    let updates: Partial<Complaint> = { status: newStatus };
    let eventTitle = `Status updated to ${newStatus}`;
    let eventDescription = `Status changed to ${newStatus} by ${staffName}.`;

    if (newStatus === 'BLOCKED') {
      updates.blockedReason = reasonOrSummary || 'Additional action required';
      eventTitle = 'Complaint Blocked';
      eventDescription = `Work paused: ${updates.blockedReason}`;
    } else if (newStatus === 'RESOLVED') {
      updates.resolutionSummary = reasonOrSummary || 'Issue resolved by technician';
      updates.resolvedAt = now;
      eventTitle = 'Complaint Resolved';
      eventDescription = `Resolution submitted: ${updates.resolutionSummary}`;
    }

    const event: ComplaintActivityEvent = {
      id: `act-${Date.now()}`,
      type: 'STATUS_CHANGE',
      title: eventTitle,
      description: eventDescription,
      timestamp: now,
      actor: staffName,
    };

    return this.updateComplaint(complaintId, updates, event);
  }

  /**
   * Calculates actual statistics for the authenticated student
   */
  public static getStatisticsForStudent(email: string, usn: string): StudentStatistics {
    const list = this.getComplaintsByStudent(email, usn);
    const submitted = list.filter((c) => c.status === 'SUBMITTED' || c.status === 'ASSIGNED').length;
    const inProgress = list.filter((c) => c.status === 'IN PROGRESS').length;
    const blocked = list.filter((c) => c.status === 'BLOCKED').length;
    const resolved = list.filter((c) => c.status === 'RESOLVED').length;
    const closed = list.filter((c) => c.status === 'CLOSED').length;
    return {
      total: list.length,
      submitted,
      inProgress,
      blocked,
      resolved,
      closed,
    };
  }

  /**
   * Calculates actual statistics for the authenticated staff member
   */
  public static getStatisticsForStaff(department: string, staffEmployeeId: string): StaffStatistics {
    const list = this.getComplaintsByDepartment(department);
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

    return {
      assignedToMe,
      unassigned,
      inProgress,
      blocked,
      resolved,
      slaRisk,
    };
  }

  /**
   * Calculates actual institutional statistics for the Admin Command Center
   */
  public static getStatisticsForAdmin(): AdminStatistics {
    const list = this.getAllComplaints();
    const submitted = list.filter((c) => c.status === 'SUBMITTED' || c.status === 'ASSIGNED').length;
    const inProgress = list.filter((c) => c.status === 'IN PROGRESS').length;
    const blocked = list.filter((c) => c.status === 'BLOCKED').length;
    const resolved = list.filter((c) => c.status === 'RESOLVED').length;
    const closed = list.filter((c) => c.status === 'CLOSED').length;
    const slaRisk = list.filter(
      (c) => (c.slaStatus === 'Approaching SLA' || c.slaStatus === 'SLA Breached') && c.status !== 'RESOLVED' && c.status !== 'CLOSED'
    ).length;
    const unassigned = list.filter((c) => !c.assignedStaffId && c.status === 'SUBMITTED').length;

    return {
      total: list.length,
      submitted,
      inProgress,
      blocked,
      resolved,
      closed,
      slaRisk,
      unassigned,
    };
  }

  /**
   * Aggregates real activity events across all complaints
   */
  public static getAllActivityEvents(limit = 12): (ComplaintActivityEvent & { complaintId: string; complaintTitle: string })[] {
    const list = this.getAllComplaints();
    const allEvents: (ComplaintActivityEvent & { complaintId: string; complaintTitle: string })[] = [];

    list.forEach((c) => {
      const history = c.history && c.history.length > 0 
        ? c.history 
        : [
            {
              id: `act-${c.id}-init`,
              type: 'SUBMITTED' as const,
              title: 'Complaint Submitted',
              description: 'Complaint registered by student and logged for departmental triage.',
              timestamp: c.createdAt,
              actor: c.studentName || 'Student',
            },
          ];

      history.forEach((evt) => {
        allEvents.push({
          ...evt,
          complaintId: c.id,
          complaintTitle: c.title,
        });
      });
    });

    // Sort by timestamp descending
    allEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return allEvents.slice(0, limit);
  }

  /**
   * Authenticated notifications for student
   */
  public static getNotificationsForStudent(email: string): StudentNotification[] {
    try {
      const data = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (!data) return [];
      const all: (StudentNotification & { recipientEmail?: string })[] = JSON.parse(data);
      const cleanEmail = email.trim().toLowerCase();
      return all.filter((n) => !n.recipientEmail || n.recipientEmail.toLowerCase() === cleanEmail);
    } catch {
      return [];
    }
  }
}
