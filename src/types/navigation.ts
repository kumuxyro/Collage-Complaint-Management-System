import React from 'react';
import { RegisteredUser } from './auth.ts';

export type UserRole = 'student' | 'staff' | 'admin';

export interface NavItem {
  id: string;
  label: string;
  iconName: string;
  badge?: string;
  description: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleTitle: string;
  department: string;
  identifier: string; // USN, Employee ID, or Admin ID
  status: 'active' | 'on_duty' | 'away' | 'not_signed_in';
  unreadNotifications: number;
}

export const ROLE_NAVIGATION: Record<UserRole, NavItem[]> = {
  student: [
    { id: 'dashboard', label: 'Dashboard', iconName: 'LayoutDashboard', description: 'Overview of active grievances and campus notices' },
    { id: 'submit', label: 'Submit Complaint', iconName: 'PlusCircle', badge: 'New', description: 'Report an issue in classrooms, labs, hostel, transport, or facilities' },
    { id: 'my-complaints', label: 'My Complaints', iconName: 'Clock', description: 'Real-time 5-stage tracking and Jira status progression' },
    { id: 'notifications', label: 'Notifications', iconName: 'Bell', description: 'Technician updates, status transitions, and SLA alerts' },
    { id: 'feedback', label: 'Feedback', iconName: 'Star', description: 'Submit CSAT ratings and quality verification on resolved tickets' },
    { id: 'profile', label: 'Profile', iconName: 'User', description: 'Student credentials and academic details' },
  ],
  staff: [
    { id: 'dashboard', label: 'Dashboard', iconName: 'LayoutDashboard', description: 'Department performance summary and SLA health status' },
    { id: 'work-queue', label: 'Work Queue', iconName: 'Inbox', description: 'Unassigned and newly routed departmental campus tickets' },
    { id: 'active-complaints', label: 'Active Complaints', iconName: 'Wrench', description: 'Tickets currently under execution by your technician team' },
    { id: 'resolved', label: 'Resolved', iconName: 'CheckCircle2', description: 'Completed repairs awaiting student satisfaction verification' },
    { id: 'worklogs', label: 'Worklogs', iconName: 'FileText', description: 'Spare parts consumed, technician hours, and Jira mirrored notes' },
    { id: 'profile', label: 'Profile', iconName: 'User', description: 'Staff credentials and departmental assignments' },
  ],
  admin: [
    { id: 'command-center', label: 'Command Center', iconName: 'LayoutGrid', description: 'Campus-wide macro metrics, resolution velocity, and crisis radar' },
    { id: 'all-complaints', label: 'All Complaints', iconName: 'FolderKanban', description: 'Master institutional grievance registry across all 8 campus domains' },
    { id: 'sla-monitor', label: 'SLA Monitor', iconName: 'Timer', description: 'Real-time countdown radar and automated escalation controls' },
    { id: 'departments', label: 'Departments', iconName: 'Building2', description: 'Category routing rules, custodian assignments, and SLA thresholds' },
    { id: 'analytics', label: 'Analytics', iconName: 'BarChart3', description: 'Chronic failure hotspots, CSAT indices, and audit reports' },
    { id: 'jira-integration', label: 'Jira Integration', iconName: 'GitPullRequest', description: 'REST API v3 health, webhook stream inspector, and sync diagnostics' },
    { id: 'settings', label: 'Settings', iconName: 'Settings', description: 'System-wide governance, RBAC permissions, and notification policies' },
  ],
};

/**
 * Creates user profile strictly from authenticated data.
 * When not signed in, returns neutral placeholders:
 * "Guest User", "Not signed in", "Select Role".
 * No fake personal information or fake sample IDs.
 */
export function buildUserProfile(user: RegisteredUser | null, role: UserRole): UserProfile {
  if (!user) {
    return {
      id: 'guest',
      name: 'Guest User',
      email: 'Not signed in',
      role,
      roleTitle: 'Guest Session',
      department: 'Select Role',
      identifier: 'Not signed in',
      status: 'not_signed_in',
      unreadNotifications: 0,
    };
  }

  // Authenticated real user details:
  let identifier = 'Not assigned';
  let department = 'General';
  let roleTitle = 'Institutional User';

  if (user.role === 'student') {
    identifier = user.usn;
    department = `${user.branch} (${user.semester})`;
    roleTitle = 'Registered Student';
  } else if (user.role === 'staff') {
    identifier = user.employeeId;
    department = user.department;
    roleTitle = 'Department Staff';
  } else if (user.role === 'admin') {
    identifier = user.adminId;
    department = user.adminUnit;
    roleTitle = 'System Administrator';
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    roleTitle,
    department,
    identifier,
    status: 'active',
    unreadNotifications: 0,
  };
}
