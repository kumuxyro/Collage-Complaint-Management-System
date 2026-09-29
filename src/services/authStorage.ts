import { RegisteredUser, OtpRecord } from '../types/auth.ts';

const ACCOUNTS_STORAGE_KEY = 'college_cms_accounts_v1';
const SESSION_STORAGE_KEY = 'college_cms_session_v1';
const OTP_STORAGE_KEY = 'college_cms_otp_v1';

export class AuthStorage {
  /**
   * Retrieves all registered user accounts.
   * Starts completely empty with NO fake users or hardcoded default identities.
   */
  public static getAccounts(): RegisteredUser[] {
    try {
      const data = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
      if (!data) return [];
      return JSON.parse(data) as RegisteredUser[];
    } catch {
      return [];
    }
  }

  /**
   * Saves a new registered user account
   */
  public static saveAccount(user: RegisteredUser): { success: boolean; error?: string } {
    const accounts = this.getAccounts();
    const existing = accounts.find((a) => a.email.toLowerCase() === user.email.toLowerCase());
    if (existing) {
      return { success: false, error: 'An account with this email address is already registered.' };
    }
    accounts.push(user);
    try {
      localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
      return { success: true };
    } catch {
      return { success: false, error: 'Failed to persist account data.' };
    }
  }

  /**
   * Finds an existing account by email
   */
  public static findByEmail(email: string): RegisteredUser | undefined {
    const accounts = this.getAccounts();
    return accounts.find((a) => a.email.toLowerCase() === email.trim().toLowerCase());
  }

  /**
   * Updates an account's password
   */
  public static updatePassword(email: string, newPasswordHash: string): boolean {
    const accounts = this.getAccounts();
    const index = accounts.findIndex((a) => a.email.toLowerCase() === email.trim().toLowerCase());
    if (index === -1) return false;
    accounts[index].passwordHash = newPasswordHash;
    try {
      localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Session Management
   */
  public static getSession(): RegisteredUser | null {
    try {
      const data = sessionStorage.getItem(SESSION_STORAGE_KEY) || localStorage.getItem(SESSION_STORAGE_KEY);
      if (!data) return null;
      return JSON.parse(data) as RegisteredUser;
    } catch {
      return null;
    }
  }

  public static setSession(user: RegisteredUser | null): void {
    try {
      if (!user) {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
        localStorage.removeItem(SESSION_STORAGE_KEY);
      } else {
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
      }
    } catch {
      // Storage error
    }
  }

  public static clearSession(): void {
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      // Storage error
    }
  }

  /**
   * OTP Storage & Validation with Expiration and Retry Limits
   */
  public static saveOtp(email: string, code: string): OtpRecord {
    const cleanEmail = email.trim().toLowerCase();
    const record: OtpRecord = {
      email: cleanEmail,
      code,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes validity
      attemptsRemaining: 5,
      verified: false,
    };
    try {
      const allOtps = this.getAllOtps();
      allOtps[cleanEmail] = record;
      sessionStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(allOtps));
    } catch {
      // Storage error
    }
    return record;
  }

  public static getOtp(email: string): OtpRecord | null {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const allOtps = this.getAllOtps();
      return allOtps[cleanEmail] || null;
    } catch {
      return null;
    }
  }

  public static verifyOtp(email: string, enteredCode: string): { success: boolean; error?: string } {
    const cleanEmail = email.trim().toLowerCase();
    const record = this.getOtp(cleanEmail);

    if (!record) {
      return { success: false, error: 'No verification request found for this email. Please request a new OTP.' };
    }

    if (Date.now() > record.expiresAt) {
      return { success: false, error: 'Your verification code has expired. Please request a new OTP.' };
    }

    if (record.attemptsRemaining <= 0) {
      return { success: false, error: 'Too many incorrect attempts. Please request a new OTP.' };
    }

    if (record.code !== enteredCode) {
      record.attemptsRemaining -= 1;
      const allOtps = this.getAllOtps();
      allOtps[cleanEmail] = record;
      sessionStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(allOtps));

      return {
        success: false,
        error: `Invalid verification code. Please try again. (${record.attemptsRemaining} attempts remaining)`,
      };
    }

    // Success: Mark as verified and invalidate OTP (single-use)
    record.verified = true;
    record.attemptsRemaining = 0; // Prevent reuse
    const allOtps = this.getAllOtps();
    allOtps[cleanEmail] = record;
    sessionStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(allOtps));

    return { success: true };
  }

  public static isEmailVerified(email: string): boolean {
    const record = this.getOtp(email);
    return record ? record.verified && Date.now() <= record.expiresAt + 10 * 60 * 1000 : false;
  }

  private static getAllOtps(): Record<string, OtpRecord> {
    try {
      const raw = sessionStorage.getItem(OTP_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }
}
