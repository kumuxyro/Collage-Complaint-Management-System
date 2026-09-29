import { Request, Response, NextFunction } from 'express';
import { verifySessionToken, SessionPayload } from '../utils/jwt.ts';
import { getDatabase } from '../database/connection.ts';
import { AppError } from './errorHandler.ts';

export interface AuthenticatedUser {
  id: string;
  role: 'STUDENT' | 'STAFF' | 'ADMIN';
  email: string;
  name: string;
  studentUsn?: string;
  employeeId?: string;
  adminId?: string;
  department?: string;
  administrationUnit?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authentication required. Missing Bearer token.', 401, 'UNAUTHORIZED'));
  }

  const token = authHeader.substring(7).trim();
  const session = verifySessionToken(token);

  if (!session) {
    return next(new AppError('Invalid or expired session token.', 401, 'INVALID_TOKEN'));
  }

  // Verify directly against the SQLite database to avoid trusting client-forged data
  const db = getDatabase();
  const userRow = db.prepare('SELECT id, role, full_name, email, student_usn, employee_id, admin_id, department, administration_unit FROM users WHERE id = ?').get(session.userId) as any;

  if (!userRow) {
    return next(new AppError('Authenticated user record not found in system.', 401, 'USER_NOT_FOUND'));
  }

  req.user = {
    id: userRow.id,
    role: userRow.role,
    email: userRow.email,
    name: userRow.full_name,
    studentUsn: userRow.student_usn,
    employeeId: userRow.employee_id,
    adminId: userRow.admin_id,
    department: userRow.department,
    administrationUnit: userRow.administration_unit,
  };

  next();
}

export function requireRole(...allowedRoles: ('STUDENT' | 'STAFF' | 'ADMIN')[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401, 'UNAUTHORIZED'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError(`Access forbidden: this endpoint requires one of [${allowedRoles.join(', ')}] role.`, 403, 'FORBIDDEN'));
    }

    next();
  };
}
