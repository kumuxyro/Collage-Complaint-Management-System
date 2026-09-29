import { Complaint, ComplaintStatus, ComplaintActivityEvent } from '../types/studentDashboard.ts';
import { RegisteredUser, StudentUser, StaffUser, AdminUser, UserRole } from '../types/auth.ts';

const TOKEN_KEY = 'college_cms_jwt_token_v1';
const USER_KEY = 'college_cms_auth_user_v1';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

export interface ApiErrorResponse {
  code: string;
  message: string;
}

export class ApiError extends Error {
  public code: string;
  public status: number;

  constructor(message: string, code = 'API_ERROR', status = 400) {
    super(message);
    this.code = code;
    this.status = status;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

/**
 * Token and Session Storage Management
 */
export const SessionStorage = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },
  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  },
  getUser(): RegisteredUser | null {
    try {
      const data = localStorage.getItem(USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
  setUser(user: RegisteredUser): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clear(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

/**
 * Reusable HTTP Request Engine
 */
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  const token = SessionStorage.getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (err: any) {
    throw new ApiError(
      'Unable to connect to server. Please check your network connection.',
      'NETWORK_ERROR',
      0
    );
  }

  let body: any = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      body = await response.json();
    } catch {
      body = null;
    }
  }

  if (!response.ok) {
    const errorData: ApiErrorResponse = body?.error || {
      code: 'HTTP_' + response.status,
      message: body?.message || response.statusText || 'An unexpected server error occurred',
    };

    if (response.status === 401) {
      SessionStorage.clear();
    }

    throw new ApiError(errorData.message, errorData.code, response.status);
  }

  return (body?.data !== undefined ? body.data : body) as T;
}

/**
 * Normalizes backend complaint model to match frontend types
 */
function normalizeComplaint(raw: any): Complaint {
  const displayId = raw.complaintId || raw.complaint_id || raw.id;
  const rawStatus = raw.status || 'SUBMITTED';
  const status: ComplaintStatus = rawStatus === 'IN_PROGRESS' ? 'IN PROGRESS' : rawStatus;

  const rawHistory = raw.activityHistory || raw.history || [];
  const history: ComplaintActivityEvent[] = rawHistory.map((h: any) => ({
    id: h.id || `act-${Date.now()}-${Math.random()}`,
    type: h.eventType || h.type || 'STATUS_CHANGE',
    title: h.eventType ? h.eventType.replace(/_/g, ' ') : (h.title || 'Status Updated'),
    description: h.message || h.description || '',
    timestamp: h.createdAt || h.timestamp || new Date().toISOString(),
    actor: h.actor || 'System',
  }));

  return {
    id: displayId,
    complaintId: displayId,
    studentId: raw.studentId || raw.student_id,
    studentName: raw.studentName || raw.student_name || 'Student',
    studentEmail: raw.studentEmail || raw.student_email || '',
    studentUsn: raw.studentUsn || raw.student_usn || '',
    category: raw.category,
    title: raw.title,
    description: raw.description,
    block: raw.block,
    room: raw.room,
    location: raw.location || `${raw.block}, ${raw.room}`,
    priority: raw.priority,
    status,
    department: raw.department,
    assignedStaffId: raw.assignedStaffId || raw.assigned_staff_id,
    assignedStaffName: raw.assignedStaffName || raw.assigned_staff_name,
    assignedAt: raw.assignedAt || raw.assigned_at,
    blockedReason: raw.blockedReason || raw.blocked_reason,
    resolutionSummary: raw.resolutionSummary || raw.resolution_summary,
    resolvedAt: raw.resolvedAt || raw.resolved_at,
    targetSlaHours: raw.slaTargetHours || raw.sla_target_hours || 24,
    slaStatus: raw.slaStatus || raw.sla_status || 'Within SLA',
    attachment: raw.attachment,
    history,
    createdAt: raw.createdAt || raw.created_at,
    updatedAt: raw.updatedAt || raw.updated_at,
  };
}

/**
 * Maps backend user object to frontend RegisteredUser
 */
function mapUserResponse(user: any): RegisteredUser {
  const role: UserRole = user.role.toLowerCase() as UserRole;
  if (role === 'student') {
    const studentUser: StudentUser = {
      id: user.id,
      name: user.name || user.full_name,
      email: user.email,
      role: 'student',
      usn: user.studentUsn || user.student_usn || '',
      branch: user.branch || '',
      semester: user.semester || '',
      passwordHash: '',
      createdAt: user.createdAt || user.created_at || new Date().toISOString(),
    };
    return studentUser;
  }
  if (role === 'staff') {
    const staffUser: StaffUser = {
      id: user.id,
      name: user.name || user.full_name,
      email: user.email,
      role: 'staff',
      employeeId: user.employeeId || user.employee_id || '',
      department: user.department || 'General Administration',
      passwordHash: '',
      createdAt: user.createdAt || user.created_at || new Date().toISOString(),
    };
    return staffUser;
  }
  const adminUser: AdminUser = {
    id: user.id,
    name: user.name || user.full_name,
    email: user.email,
    role: 'admin',
    adminId: user.adminId || user.admin_id || '',
    adminUnit: user.adminUnit || user.administration_unit || 'Central Administration',
    passwordHash: '',
    createdAt: user.createdAt || user.created_at || new Date().toISOString(),
  };
  return adminUser;
}

/**
 * Authentication API Service
 */
export const authApi = {
  async register(payload: {
    role: 'STUDENT' | 'STAFF' | 'ADMIN';
    name: string;
    email: string;
    password: string;
    usn?: string;
    branch?: string;
    semester?: string;
    employeeId?: string;
    department?: string;
    adminId?: string;
    adminUnit?: string;
  }): Promise<{ user: RegisteredUser; token: string }> {
    const res = await request<{ user: any; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const user = mapUserResponse(res.user);
    SessionStorage.setToken(res.token);
    SessionStorage.setUser(user);
    return { user, token: res.token };
  },

  async login(email: string, password: string): Promise<{ user: RegisteredUser; token: string }> {
    const res = await request<{ user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    const user = mapUserResponse(res.user);
    SessionStorage.setToken(res.token);
    SessionStorage.setUser(user);
    return { user, token: res.token };
  },

  async logout(): Promise<void> {
    try {
      await request('/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors on logout
    } finally {
      SessionStorage.clear();
    }
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    return request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async verifyOtp(email: string, code: string): Promise<{ verified: boolean }> {
    return request<{ verified: boolean }>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });
  },

  async resetPassword(email: string, code: string, newPassword: string): Promise<{ message: string }> {
    return request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, code, newPassword }),
    });
  },
};

/**
 * Complaints API Service
 */
export const complaintsApi = {
  async getComplaints(filters?: {
    status?: string;
    category?: string;
    priority?: string;
    search?: string;
  }): Promise<Complaint[]> {
    const params = new URLSearchParams();
    if (filters?.status && filters.status !== 'ALL') params.append('status', filters.status);
    if (filters?.category && filters.category !== 'ALL') params.append('category', filters.category);
    if (filters?.priority && filters.priority !== 'ALL') params.append('priority', filters.priority);
    if (filters?.search) params.append('search', filters.search);

    const qs = params.toString() ? `?${params.toString()}` : '';
    const rawList = await request<any[]>(`/complaints${qs}`);
    return (rawList || []).map(normalizeComplaint);
  },

  async getComplaintById(complaintId: string): Promise<Complaint> {
    const raw = await request<any>(`/complaints/${encodeURIComponent(complaintId)}`);
    return normalizeComplaint(raw);
  },

  async createComplaint(payload: {
    category: string;
    title: string;
    description: string;
    block: string;
    room: string;
    priority: string;
    attachment?: {
      name: string;
      size: number;
      type: string;
      dataUrl?: string;
    };
  }): Promise<Complaint> {
    const raw = await request<any>('/complaints', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return normalizeComplaint(raw);
  },

  async claimComplaint(complaintId: string): Promise<Complaint> {
    const raw = await request<any>(`/complaints/${encodeURIComponent(complaintId)}/claim`, {
      method: 'POST',
    });
    return normalizeComplaint(raw);
  },

  async updateStatus(
    complaintId: string,
    status: string,
    reasonOrSummary?: string
  ): Promise<Complaint> {
    const raw = await request<any>(`/complaints/${encodeURIComponent(complaintId)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({
        status,
        reason: reasonOrSummary,
        resolutionSummary: reasonOrSummary,
      }),
    });
    return normalizeComplaint(raw);
  },
};
