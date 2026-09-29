import React, { createContext, useContext, useState, useEffect } from 'react';
import { RegisteredUser, StudentUser, StaffUser, AdminUser, UserRole } from '../types/auth.ts';
import { authApi, SessionStorage, ApiError } from '../services/api.ts';

interface StudentSignupData {
  name: string;
  email: string;
  usn: string;
  branch: string;
  semester: string;
  password: string;
}

interface StaffSignupData {
  name: string;
  email: string;
  employeeId: string;
  department: string;
  password: string;
}

interface AdminSignupData {
  name: string;
  email: string;
  adminId: string;
  adminUnit: string;
  password: string;
}

interface AuthContextValue {
  isAuthenticated: boolean;
  currentUser: RegisteredUser | null;
  signIn: (email: string, password: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
  signUpStudent: (data: StudentSignupData) => Promise<{ success: boolean; error?: string }>;
  signUpStaff: (data: StaffSignupData) => Promise<{ success: boolean; error?: string }>;
  signUpAdmin: (data: AdminSignupData) => Promise<{ success: boolean; error?: string }>;
  signOut: () => void;
  requestOtp: (email: string) => Promise<{ success: boolean; error?: string; providerConfigured?: boolean; message?: string }>;
  verifyOtp: (email: string, code: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<RegisteredUser | null>(() => {
    return SessionStorage.getUser();
  });

  // Stored OTP code for multi-step password reset flow
  const [pendingOtpCode, setPendingOtpCode] = useState<string>('');

  const isAuthenticated = currentUser !== null;

  const signIn = async (
    email: string,
    password: string,
    role: UserRole
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await authApi.login(email.trim().toLowerCase(), password);

      // Verify that user role matches selected tab
      if (res.user.role !== role) {
        // Clear session since role mismatch
        SessionStorage.clear();
        return {
          success: false,
          error: `This account is registered under the ${res.user.role.toUpperCase()} role. Please select "${res.user.role}" to sign in.`,
        };
      }

      setCurrentUser(res.user);
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Authentication failed. Please verify your credentials.',
      };
    }
  };

  const signUpStudent = async (
    data: StudentSignupData
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await authApi.register({
        role: 'STUDENT',
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        password: data.password,
        usn: data.usn.trim().toUpperCase(),
        branch: data.branch,
        semester: data.semester,
      });

      setCurrentUser(res.user);
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Registration failed. Please check your information.',
      };
    }
  };

  const signUpStaff = async (
    data: StaffSignupData
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await authApi.register({
        role: 'STAFF',
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        password: data.password,
        employeeId: data.employeeId.trim().toUpperCase(),
        department: data.department,
      });

      setCurrentUser(res.user);
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Registration failed. Please check your information.',
      };
    }
  };

  const signUpAdmin = async (
    data: AdminSignupData
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await authApi.register({
        role: 'ADMIN',
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        password: data.password,
        adminId: data.adminId.trim().toUpperCase(),
        adminUnit: data.adminUnit.trim(),
      });

      setCurrentUser(res.user);
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Registration failed. Please check your information.',
      };
    }
  };

  const signOut = () => {
    authApi.logout();
    setCurrentUser(null);
  };

  const requestOtp = async (
    email: string
  ): Promise<{ success: boolean; error?: string; providerConfigured?: boolean; message?: string }> => {
    try {
      const res = await authApi.forgotPassword(email.trim().toLowerCase());
      return {
        success: true,
        providerConfigured: false,
        message: res.message,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Unable to process password reset request.',
      };
    }
  };

  const verifyOtp = async (email: string, code: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await authApi.verifyOtp(email.trim().toLowerCase(), code.trim());
      if (res.verified) {
        setPendingOtpCode(code.trim());
        return { success: true };
      }
      return { success: false, error: 'Verification failed.' };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Incorrect verification code. Please check and try again.',
      };
    }
  };

  const resetPassword = async (
    email: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await authApi.resetPassword(email.trim().toLowerCase(), pendingOtpCode, newPassword);
      setPendingOtpCode('');
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Failed to update password.',
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        currentUser,
        signIn,
        signUpStudent,
        signUpStaff,
        signUpAdmin,
        signOut,
        requestOtp,
        verifyOtp,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
