export type UserRole = 'student' | 'staff' | 'admin';

export interface BaseUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  passwordHash: string; // Stored securely in client storage
  createdAt: string;
}

export interface StudentUser extends BaseUser {
  role: 'student';
  usn: string;
  branch: string;
  semester: string;
}

export interface StaffUser extends BaseUser {
  role: 'staff';
  employeeId: string;
  department: string;
}

export interface AdminUser extends BaseUser {
  role: 'admin';
  adminId: string;
  adminUnit: string;
}

export type RegisteredUser = StudentUser | StaffUser | AdminUser;

export interface OtpRecord {
  email: string;
  code: string;
  expiresAt: number; // Timestamp
  attemptsRemaining: number;
  verified: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: RegisteredUser | null;
}
