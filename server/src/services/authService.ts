import crypto from 'node:crypto';
import { getDatabase } from '../database/connection.ts';
import { hashPassword, verifyPassword } from '../utils/hash.ts';
import { generateSessionToken } from '../utils/jwt.ts';
import { isValidEmail, isValidRole } from '../utils/validation.ts';
import { AppError } from '../middleware/errorHandler.ts';
import { EmailService } from './emailService.ts';

// In-memory OTP storage for password reset (10-minute expiry)
interface OtpEntry {
  email: string;
  code: string;
  expiresAt: number;
  attempts: number;
}
const otpStore = new Map<string, OtpEntry>();

export class AuthService {
  public static async register(data: {
    role: string;
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
  }) {
    if (!data.name || data.name.trim().length < 2) {
      throw new AppError('Full name must be at least 2 characters long.', 400, 'INVALID_NAME');
    }

    if (!isValidEmail(data.email)) {
      throw new AppError('Please provide a valid email address.', 400, 'INVALID_EMAIL');
    }

    if (!data.password || data.password.length < 6) {
      throw new AppError('Password must be at least 6 characters long.', 400, 'WEAK_PASSWORD');
    }

    const normalizedRole = data.role?.toUpperCase();
    if (!isValidRole(normalizedRole)) {
      throw new AppError('Role must be STUDENT, STAFF, or ADMIN.', 400, 'INVALID_ROLE');
    }

    const db = getDatabase();
    const cleanEmail = data.email.trim().toLowerCase();

    // Check if email already registered
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
    if (existing) {
      throw new AppError('An account with this email address already exists.', 409, 'EMAIL_EXISTS');
    }

    const userId = `usr_${crypto.randomUUID()}`;
    const passwordHash = await hashPassword(data.password);
    const now = new Date().toISOString();

    const insertStmt = db.prepare(`
      INSERT INTO users (
        id, role, full_name, email, password_hash,
        student_usn, branch, semester, employee_id, admin_id,
        department, administration_unit, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?
      )
    `);

    insertStmt.run(
      userId,
      normalizedRole,
      data.name.trim(),
      cleanEmail,
      passwordHash,
      data.usn?.trim() || null,
      data.branch?.trim() || null,
      data.semester?.trim() || null,
      data.employeeId?.trim() || null,
      data.adminId?.trim() || null,
      data.department?.trim() || null,
      data.adminUnit?.trim() || null,
      now,
      now
    );

    const token = generateSessionToken({
      id: userId,
      role: normalizedRole,
      email: cleanEmail,
      name: data.name.trim(),
    });

    return {
      token,
      user: {
        id: userId,
        role: normalizedRole,
        name: data.name.trim(),
        email: cleanEmail,
        studentUsn: data.usn?.trim() || null,
        branch: data.branch?.trim() || null,
        semester: data.semester?.trim() || null,
        employeeId: data.employeeId?.trim() || null,
        department: data.department?.trim() || null,
        adminId: data.adminId?.trim() || null,
        adminUnit: data.adminUnit?.trim() || null,
        createdAt: now,
      },
    };
  }

  public static async login(email: string, password: string) {
    if (!isValidEmail(email)) {
      throw new AppError('Please provide a valid email address.', 400, 'INVALID_EMAIL');
    }

    if (!password) {
      throw new AppError('Password is required.', 400, 'MISSING_PASSWORD');
    }

    const cleanEmail = email.trim().toLowerCase();
    const db = getDatabase();
    const userRow = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail) as any;

    if (!userRow) {
      throw new AppError('Invalid email or password credentials.', 401, 'INVALID_CREDENTIALS');
    }

    const isMatch = await verifyPassword(password, userRow.password_hash);
    if (!isMatch) {
      throw new AppError('Invalid email or password credentials.', 401, 'INVALID_CREDENTIALS');
    }

    const token = generateSessionToken({
      id: userRow.id,
      role: userRow.role,
      email: userRow.email,
      name: userRow.full_name,
    });

    return {
      token,
      user: {
        id: userRow.id,
        role: userRow.role,
        name: userRow.full_name,
        email: userRow.email,
        studentUsn: userRow.student_usn,
        branch: userRow.branch,
        semester: userRow.semester,
        employeeId: userRow.employee_id,
        department: userRow.department,
        adminId: userRow.admin_id,
        adminUnit: userRow.administration_unit,
        createdAt: userRow.created_at,
      },
    };
  }

  public static async forgotPassword(email: string) {
    if (!isValidEmail(email)) {
      throw new AppError('Please provide a valid email address.', 400, 'INVALID_EMAIL');
    }

    const cleanEmail = email.trim().toLowerCase();
    const db = getDatabase();
    const userRow = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);

    if (!userRow) {
      // Return success to avoid email enumeration
      return { message: 'If this email is registered, a password reset code has been dispatched.' };
    }

    const otp = EmailService.generateOtp();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    otpStore.set(cleanEmail, {
      email: cleanEmail,
      code: otp,
      expiresAt,
      attempts: 0,
    });

    await EmailService.sendPasswordResetOtp(cleanEmail, otp);

    return { 
      message: 'If this email is registered, a password reset code has been dispatched.',
      // In development mode, provide a reference code indicator
      devReference: process.env.NODE_ENV === 'development' ? otp : undefined,
    };
  }

  public static async verifyOtp(email: string, code: string) {
    const cleanEmail = email.trim().toLowerCase();
    const entry = otpStore.get(cleanEmail);

    if (!entry) {
      throw new AppError('No active verification code for this email. Please request a new one.', 400, 'OTP_NOT_FOUND');
    }

    if (Date.now() > entry.expiresAt) {
      otpStore.delete(cleanEmail);
      throw new AppError('The verification code has expired. Please request a new one.', 400, 'OTP_EXPIRED');
    }

    entry.attempts += 1;
    if (entry.attempts > 5) {
      otpStore.delete(cleanEmail);
      throw new AppError('Too many failed verification attempts. Please request a new code.', 429, 'MAX_ATTEMPTS_EXCEEDED');
    }

    if (entry.code !== code.trim()) {
      throw new AppError('Incorrect verification code. Please check and try again.', 400, 'INVALID_OTP');
    }

    return { verified: true };
  }

  public static async resetPassword(email: string, code: string, newPassword: string) {
    await this.verifyOtp(email, code);

    if (!newPassword || newPassword.length < 6) {
      throw new AppError('New password must be at least 6 characters long.', 400, 'WEAK_PASSWORD');
    }

    const cleanEmail = email.trim().toLowerCase();
    const passwordHash = await hashPassword(newPassword);
    const db = getDatabase();

    db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE email = ?').run(
      passwordHash,
      new Date().toISOString(),
      cleanEmail
    );

    otpStore.delete(cleanEmail);
    return { success: true, message: 'Password has been successfully updated.' };
  }
}
