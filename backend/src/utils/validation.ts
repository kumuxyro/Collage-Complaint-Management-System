import { config } from '../config/index.ts';

export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
}

export function isValidRole(role: string): role is 'STUDENT' | 'STAFF' | 'ADMIN' {
  if (!role || typeof role !== 'string') return false;
  const normalized = role.toUpperCase();
  return ['STUDENT', 'STAFF', 'ADMIN'].includes(normalized);
}

export function isValidPriority(priority: string): priority is 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' {
  if (!priority || typeof priority !== 'string') return false;
  const normalized = priority.toUpperCase();
  return ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(normalized);
}

export function isValidCategory(category: string): boolean {
  if (!category || typeof category !== 'string') return false;
  return Boolean(config.categoryDepartmentMap[category]);
}

export function isValidComplaintStatus(status: string): boolean {
  if (!status || typeof status !== 'string') return false;
  const normalized = status.toUpperCase().replace(/\s+/g, '_');
  return ['SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'BLOCKED', 'RESOLVED', 'CLOSED'].includes(normalized);
}
