import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { UserRole } from '../../types/auth.ts';
import { SpatialCard } from '../design-system/SpatialCard.tsx';
import { Button } from '../design-system/Button.tsx';
import { Input } from '../design-system/Input.tsx';
import { Select } from '../design-system/Select.tsx';
import { OtpInputBoxes } from './OtpInputBoxes.tsx';
import { CinematicCanvas } from '../canvas/CinematicCanvas.tsx';
import { 
  GraduationCap, 
  Wrench, 
  ShieldAlert, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  Mail, 
  User as UserIcon, 
  KeyRound, 
  Building2, 
  ShieldCheck,
  RotateCcw
} from 'lucide-react';

type AuthView = 
  | 'landing'
  | 'chooseRole'
  | 'signIn'
  | 'studentSignUp'
  | 'staffSignUp'
  | 'adminSignUp'
  | 'forgotPassword';

const BRANCH_OPTIONS = [
  { value: 'Computer Science & Engineering', label: 'Computer Science & Engineering' },
  { value: 'Electronics & Communication Engineering', label: 'Electronics & Communication Engineering' },
  { value: 'Information Science & Engineering', label: 'Information Science & Engineering' },
  { value: 'Mechanical Engineering', label: 'Mechanical Engineering' },
  { value: 'Civil Engineering', label: 'Civil Engineering' },
  { value: 'Electrical & Electronics Engineering', label: 'Electrical & Electronics Engineering' },
  { value: 'Biotechnology', label: 'Biotechnology' },
  { value: 'Artificial Intelligence & Data Science', label: 'Artificial Intelligence & Data Science' },
];

const SEMESTER_OPTIONS = [
  { value: 'Semester 1', label: 'Semester 1' },
  { value: 'Semester 2', label: 'Semester 2' },
  { value: 'Semester 3', label: 'Semester 3' },
  { value: 'Semester 4', label: 'Semester 4' },
  { value: 'Semester 5', label: 'Semester 5' },
  { value: 'Semester 6', label: 'Semester 6' },
  { value: 'Semester 7', label: 'Semester 7' },
  { value: 'Semester 8', label: 'Semester 8' },
];

const STAFF_DEPARTMENT_OPTIONS = [
  { value: 'Estate & Infrastructure Maintenance', label: 'Estate & Infrastructure Maintenance' },
  { value: 'IT & Network Services', label: 'IT & Network Services' },
  { value: 'Laboratory & Technical Safety', label: 'Laboratory & Technical Safety' },
  { value: 'Hostel & Residential Services', label: 'Hostel & Residential Services' },
  { value: 'Transport & Fleet Operations', label: 'Transport & Fleet Operations' },
  { value: 'Library Operations', label: 'Library Operations' },
  { value: 'Finance & Accounts', label: 'Finance & Accounts' },
  { value: 'General Administration', label: 'General Administration' },
];

export function AuthLanding() {
  const { 
    signIn, 
    signUpStudent, 
    signUpStaff, 
    signUpAdmin, 
    requestOtp, 
    verifyOtp, 
    resetPassword 
  } = useAuth();

  const [view, setView] = useState<AuthView>('landing');
  const [selectedRoleForSignup, setSelectedRoleForSignup] = useState<UserRole | null>(null);
  const [signInRole, setSignInRole] = useState<UserRole>('student');

  // Form States
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Sign In Inputs (ONLY Email & Password)
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Student Sign Up Inputs
  const [stdName, setStdName] = useState('');
  const [stdEmail, setStdEmail] = useState('');
  const [stdUsn, setStdUsn] = useState('');
  const [stdBranch, setStdBranch] = useState(BRANCH_OPTIONS[0].value);
  const [stdSemester, setStdSemester] = useState(SEMESTER_OPTIONS[0].value);
  const [stdPassword, setStdPassword] = useState('');
  const [stdConfirmPassword, setStdConfirmPassword] = useState('');

  // Staff Sign Up Inputs
  const [stfName, setStfName] = useState('');
  const [stfEmail, setStfEmail] = useState('');
  const [stfEmployeeId, setStfEmployeeId] = useState('');
  const [stfDepartment, setStfDepartment] = useState(STAFF_DEPARTMENT_OPTIONS[0].value);
  const [stfPassword, setStfPassword] = useState('');
  const [stfConfirmPassword, setStfConfirmPassword] = useState('');

  // Admin Sign Up Inputs
  const [admName, setAdmName] = useState('');
  const [admEmail, setAdmEmail] = useState('');
  const [admId, setAdmId] = useState('');
  const [admUnit, setAdmUnit] = useState('Institutional Planning & Governance');
  const [admPassword, setAdmPassword] = useState('');
  const [admConfirmPassword, setAdmConfirmPassword] = useState('');

  // Forgot Password / OTP States
  const [fpStep, setFpStep] = useState<1 | 2 | 3 | 4>(1); // 1: Email, 2: OTP, 3: Verified Choice, 4: Reset Pass
  const [fpEmail, setFpEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [fpNewPassword, setFpNewPassword] = useState('');
  const [fpConfirmPassword, setFpConfirmPassword] = useState('');
  const [deliveryNote, setDeliveryNote] = useState<string | null>(null);

  // Clear notices on view change
  const navigateTo = (newView: AuthView) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setDeliveryNote(null);
    setView(newView);
  };

  /* -------------------------------------------------------------
   * SIGN IN HANDLER
   * ------------------------------------------------------------- */
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!signInEmail.trim() || !signInPassword) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    const result = await signIn(signInEmail, signInPassword, signInRole);
    setIsLoading(false);

    if (!result.success) {
      setErrorMsg(result.error || 'Sign in failed.');
    }
  };

  /* -------------------------------------------------------------
   * STUDENT SIGN UP HANDLER
   * ------------------------------------------------------------- */
  const handleStudentSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!stdName.trim() || !stdEmail.trim() || !stdUsn.trim() || !stdPassword || !stdConfirmPassword) {
      setErrorMsg('All fields are required.');
      return;
    }

    if (!stdEmail.includes('@') || !stdEmail.includes('.')) {
      setErrorMsg('Please enter a valid student email address.');
      return;
    }

    if (stdPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    if (stdPassword !== stdConfirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    const result = await signUpStudent({
      name: stdName,
      email: stdEmail,
      usn: stdUsn,
      branch: stdBranch,
      semester: stdSemester,
      password: stdPassword,
    });
    setIsLoading(false);

    if (!result.success) {
      setErrorMsg(result.error || 'Registration failed.');
    }
  };

  /* -------------------------------------------------------------
   * STAFF SIGN UP HANDLER
   * ------------------------------------------------------------- */
  const handleStaffSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!stfName.trim() || !stfEmail.trim() || !stfEmployeeId.trim() || !stfPassword || !stfConfirmPassword) {
      setErrorMsg('All fields are required.');
      return;
    }

    if (!stfEmail.includes('@') || !stfEmail.includes('.')) {
      setErrorMsg('Please enter a valid official staff email address.');
      return;
    }

    if (stfPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    if (stfPassword !== stfConfirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    const result = await signUpStaff({
      name: stfName,
      email: stfEmail,
      employeeId: stfEmployeeId,
      department: stfDepartment,
      password: stfPassword,
    });
    setIsLoading(false);

    if (!result.success) {
      setErrorMsg(result.error || 'Registration failed.');
    }
  };

  /* -------------------------------------------------------------
   * ADMIN SIGN UP HANDLER
   * ------------------------------------------------------------- */
  const handleAdminSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!admName.trim() || !admEmail.trim() || !admId.trim() || !admUnit.trim() || !admPassword || !admConfirmPassword) {
      setErrorMsg('All fields are required.');
      return;
    }

    if (!admEmail.includes('@') || !admEmail.includes('.')) {
      setErrorMsg('Please enter a valid official admin email address.');
      return;
    }

    if (admPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    if (admPassword !== admConfirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    const result = await signUpAdmin({
      name: admName,
      email: admEmail,
      adminId: admId,
      adminUnit: admUnit,
      password: admPassword,
    });
    setIsLoading(false);

    if (!result.success) {
      setErrorMsg(result.error || 'Registration failed.');
    }
  };

  /* -------------------------------------------------------------
   * FORGOT PASSWORD / OTP DISPATCH HANDLER
   * ------------------------------------------------------------- */
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setDeliveryNote(null);

    if (!fpEmail.trim()) {
      setErrorMsg('Please enter your registered email address.');
      return;
    }

    setIsLoading(true);
    const result = await requestOtp(fpEmail);
    setIsLoading(false);

    if (!result.success) {
      setErrorMsg(result.error || 'Failed to dispatch verification code.');
      return;
    }

    // Set delivery notice
    setDeliveryNote(result.message || 'Verification code dispatched.');
    setFpStep(2);
    setOtpCode('');
  };

  /* -------------------------------------------------------------
   * VERIFY OTP HANDLER
   * ------------------------------------------------------------- */
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (otpCode.length !== 6) {
      setErrorMsg('Please enter all 6 digits of the verification code.');
      return;
    }

    setIsLoading(true);
    const result = await verifyOtp(fpEmail, otpCode);
    setIsLoading(false);

    if (!result.success) {
      setErrorMsg(result.error || 'Invalid verification code.');
      return;
    }

    setFpStep(3); // OTP Verified Choices
  };

  /* -------------------------------------------------------------
   * UPDATE PASSWORD HANDLER
   * ------------------------------------------------------------- */
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fpNewPassword || !fpConfirmPassword) {
      setErrorMsg('Please enter and confirm your new password.');
      return;
    }

    if (fpNewPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (fpNewPassword !== fpConfirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    const result = await resetPassword(fpEmail, fpNewPassword);
    setIsLoading(false);

    if (!result.success) {
      setErrorMsg(result.error || 'Password update failed.');
      return;
    }

    setSuccessMsg('Password updated successfully. You can now sign in with your new credentials.');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 relative selection:bg-red-600/30 selection:text-red-200">
      {/* Background 3D Particle & Orb Physics */}
      <CinematicCanvas interactive={true} lightingIntensity={0.85} particleDensity="balanced" />

      <div className="w-full max-w-xl mx-auto space-y-6 relative z-10">

        {/* Global Brand Header Beacon */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0F0F14] border border-white/[0.08] text-xs text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-[#E50914] shadow-[0_0_8px_rgba(229,9,20,0.9)]" />
            <span className="font-mono uppercase tracking-wider font-semibold">COLLEGE CMS</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white font-display">
            College Complaint Management System
          </h1>

          <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
            Institutional grievance tracking, departmental workflows, and Jira Service Management resolution gateway.
          </p>
        </div>

        {/* ========================================================================= */}
        {/* VIEW 1: AUTHENTICATION LANDING PAGE */}
        {/* ========================================================================= */}
        {view === 'landing' && (
          <SpatialCard elevation={3} className="space-y-6 p-6 sm:p-8">
            <div className="space-y-2 text-center pb-4 border-b border-white/[0.08]">
              <h2 className="text-lg sm:text-xl font-bold text-white font-display">
                Authentication & Portal Access
              </h2>
              <p className="text-xs text-zinc-400">
                Sign in to your authenticated account or create a new student, staff, or admin dashboard.
              </p>
            </div>

            {/* Primary Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigateTo('signIn')}
                className="w-full shadow-lg"
              >
                Sign In
              </Button>

              <Button
                variant="secondary"
                size="lg"
                onClick={() => navigateTo('chooseRole')}
                className="w-full"
              >
                Create Account
              </Button>
            </div>

            {/* Feature Assurance Badges */}
            <div className="pt-4 border-t border-white/[0.07] grid grid-cols-3 gap-2 text-center text-[11px] text-zinc-400 font-mono">
              <div className="space-y-1">
                <span className="text-white block font-semibold">Role-Based</span>
                <span className="text-zinc-500">Student, Staff, Admin</span>
              </div>
              <div className="space-y-1">
                <span className="text-white block font-semibold">Audited</span>
                <span className="text-zinc-500">Jira Synchronized</span>
              </div>
              <div className="space-y-1">
                <span className="text-white block font-semibold">Secure</span>
                <span className="text-zinc-500">Zero Fake Profiles</span>
              </div>
            </div>
          </SpatialCard>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: CHOOSE YOUR DASHBOARD (ROLE SELECTION) */}
        {/* ========================================================================= */}
        {view === 'chooseRole' && (
          <SpatialCard elevation={3} className="space-y-6 p-6 sm:p-8">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <button
                onClick={() => navigateTo('landing')}
                className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <span className="text-xs font-mono text-red-500 font-semibold uppercase">
                Step 1 of 2 · Choose Dashboard
              </span>
            </div>

            <div className="text-center space-y-1">
              <h2 className="text-xl sm:text-2xl font-bold text-white font-display">
                Choose your dashboard
              </h2>
              <p className="text-xs text-zinc-400">
                Select your operational role to open the corresponding registration form.
              </p>
            </div>

            {/* The Exactly THREE Role Cards */}
            <div className="grid grid-cols-1 gap-3.5">
              {/* 1. STUDENT DASHBOARD */}
              <div
                onClick={() => setSelectedRoleForSignup('student')}
                className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-between relative group ${
                  selectedRoleForSignup === 'student'
                    ? 'bg-red-500/10 border-red-500 text-white shadow-[0_0_15px_rgba(229,9,20,0.25)]'
                    : 'bg-[#0A0A0E] border-white/[0.09] hover:border-red-500/40 hover:bg-[#101015] text-zinc-300'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${
                    selectedRoleForSignup === 'student'
                      ? 'bg-red-500/20 border-red-500 text-red-400'
                      : 'bg-[#0E0E12] border-white/[0.08] text-red-500 group-hover:text-red-400'
                  }`}>
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white font-display">STUDENT DASHBOARD</h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Submit complaints, monitor live progress timeline, and submit CSAT verification.
                    </p>
                  </div>
                </div>
                {selectedRoleForSignup === 'student' && (
                  <span className="w-6 h-6 rounded-full bg-[#E50914] text-white flex items-center justify-center shrink-0 ml-2">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>

              {/* 2. STAFF DASHBOARD */}
              <div
                onClick={() => setSelectedRoleForSignup('staff')}
                className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-between relative group ${
                  selectedRoleForSignup === 'staff'
                    ? 'bg-red-500/10 border-red-500 text-white shadow-[0_0_15px_rgba(229,9,20,0.25)]'
                    : 'bg-[#0A0A0E] border-white/[0.09] hover:border-red-500/40 hover:bg-[#101015] text-zinc-300'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${
                    selectedRoleForSignup === 'staff'
                      ? 'bg-red-500/20 border-red-500 text-red-400'
                      : 'bg-[#0E0E12] border-white/[0.08] text-red-500 group-hover:text-red-400'
                  }`}>
                    <Wrench className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white font-display">STAFF DASHBOARD</h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Triage departmental queues, claim workorders, and upload resolution evidence.
                    </p>
                  </div>
                </div>
                {selectedRoleForSignup === 'staff' && (
                  <span className="w-6 h-6 rounded-full bg-[#E50914] text-white flex items-center justify-center shrink-0 ml-2">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>

              {/* 3. ADMIN DASHBOARD */}
              <div
                onClick={() => setSelectedRoleForSignup('admin')}
                className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-between relative group ${
                  selectedRoleForSignup === 'admin'
                    ? 'bg-red-500/10 border-red-500 text-white shadow-[0_0_15px_rgba(229,9,20,0.25)]'
                    : 'bg-[#0A0A0E] border-white/[0.09] hover:border-red-500/40 hover:bg-[#101015] text-zinc-300'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${
                    selectedRoleForSignup === 'admin'
                      ? 'bg-red-500/20 border-red-500 text-red-400'
                      : 'bg-[#0E0E12] border-white/[0.08] text-red-500 group-hover:text-red-400'
                  }`}>
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white font-display">ADMIN DASHBOARD</h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Institutional governance, SLA radar, category routing, and Jira synchronization.
                    </p>
                  </div>
                </div>
                {selectedRoleForSignup === 'admin' && (
                  <span className="w-6 h-6 rounded-full bg-[#E50914] text-white flex items-center justify-center shrink-0 ml-2">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
            </div>

            {/* Next Button */}
            <div className="pt-2">
              <Button
                variant="primary"
                size="lg"
                disabled={!selectedRoleForSignup}
                onClick={() => {
                  if (selectedRoleForSignup === 'student') navigateTo('studentSignUp');
                  else if (selectedRoleForSignup === 'staff') navigateTo('staffSignUp');
                  else if (selectedRoleForSignup === 'admin') navigateTo('adminSignUp');
                }}
                className="w-full"
              >
                <span>Continue to Registration</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            <div className="text-center pt-2">
              <button
                onClick={() => navigateTo('signIn')}
                className="text-xs text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
              >
                Already have an account? <strong className="text-white">Sign In</strong>
              </button>
            </div>
          </SpatialCard>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: STUDENT SIGN UP FORM */}
        {/* ========================================================================= */}
        {view === 'studentSignUp' && (
          <SpatialCard elevation={3} className="space-y-5 p-6 sm:p-8">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <button
                onClick={() => navigateTo('chooseRole')}
                className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Change Role</span>
              </button>

              <span className="text-xs font-mono text-red-500 font-semibold uppercase">
                Student Registration
              </span>
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white font-display">
                Create Student Account
              </h2>
              <p className="text-xs text-zinc-400">
                Register with your academic credentials to file and track campus complaints.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-lg bg-red-950/30 border border-red-500/40 text-xs text-red-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleStudentSignUp} className="space-y-3.5">
              <Input
                label="Full Name *"
                type="text"
                placeholder="Enter your full name"
                value={stdName}
                onChange={(e) => setStdName(e.target.value)}
                required
              />

              <Input
                label="Student College Email *"
                type="email"
                placeholder="Enter your college email"
                value={stdEmail}
                onChange={(e) => setStdEmail(e.target.value)}
                required
              />

              <Input
                label="College USN *"
                type="text"
                placeholder="Enter your USN"
                value={stdUsn}
                onChange={(e) => setStdUsn(e.target.value)}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Select
                  label="Branch *"
                  value={stdBranch}
                  onChange={(e) => setStdBranch(e.target.value)}
                  options={BRANCH_OPTIONS}
                />

                <Select
                  label="Semester *"
                  value={stdSemester}
                  onChange={(e) => setStdSemester(e.target.value)}
                  options={SEMESTER_OPTIONS}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Password *"
                  type="password"
                  placeholder="Create a password"
                  value={stdPassword}
                  onChange={(e) => setStdPassword(e.target.value)}
                  required
                />

                <Input
                  label="Confirm Password *"
                  type="password"
                  placeholder="Confirm your password"
                  value={stdConfirmPassword}
                  onChange={(e) => setStdConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isLoading}
                  className="w-full"
                >
                  Create Student Account
                </Button>
              </div>
            </form>

            <div className="text-center pt-2 border-t border-white/[0.08]">
              <button
                onClick={() => navigateTo('signIn')}
                className="text-xs text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
              >
                Already have an account? <strong className="text-white">Sign In</strong>
              </button>
            </div>
          </SpatialCard>
        )}

        {/* ========================================================================= */}
        {/* VIEW 4: STAFF SIGN UP FORM */}
        {/* ========================================================================= */}
        {view === 'staffSignUp' && (
          <SpatialCard elevation={3} className="space-y-5 p-6 sm:p-8">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <button
                onClick={() => navigateTo('chooseRole')}
                className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Change Role</span>
              </button>

              <span className="text-xs font-mono text-red-500 font-semibold uppercase">
                Staff Registration
              </span>
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white font-display">
                Create Staff Account
              </h2>
              <p className="text-xs text-zinc-400">
                Register as department technician or facilities manager.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-lg bg-red-950/30 border border-red-500/40 text-xs text-red-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleStaffSignUp} className="space-y-3.5">
              <Input
                label="Full Name *"
                type="text"
                placeholder="Enter your full name"
                value={stfName}
                onChange={(e) => setStfName(e.target.value)}
                required
              />

              <Input
                label="Official Staff Email *"
                type="email"
                placeholder="Enter your official staff email"
                value={stfEmail}
                onChange={(e) => setStfEmail(e.target.value)}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Employee ID *"
                  type="text"
                  placeholder="Enter your employee ID"
                  value={stfEmployeeId}
                  onChange={(e) => setStfEmployeeId(e.target.value)}
                  required
                />

                <Select
                  label="Department *"
                  value={stfDepartment}
                  onChange={(e) => setStfDepartment(e.target.value)}
                  options={STAFF_DEPARTMENT_OPTIONS}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Password *"
                  type="password"
                  placeholder="Create a password"
                  value={stfPassword}
                  onChange={(e) => setStfPassword(e.target.value)}
                  required
                />

                <Input
                  label="Confirm Password *"
                  type="password"
                  placeholder="Confirm your password"
                  value={stfConfirmPassword}
                  onChange={(e) => setStfConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isLoading}
                  className="w-full"
                >
                  Create Staff Account
                </Button>
              </div>
            </form>

            <div className="text-center pt-2 border-t border-white/[0.08]">
              <button
                onClick={() => navigateTo('signIn')}
                className="text-xs text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
              >
                Already have an account? <strong className="text-white">Sign In</strong>
              </button>
            </div>
          </SpatialCard>
        )}

        {/* ========================================================================= */}
        {/* VIEW 5: ADMIN SIGN UP FORM */}
        {/* ========================================================================= */}
        {view === 'adminSignUp' && (
          <SpatialCard elevation={3} className="space-y-5 p-6 sm:p-8">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <button
                onClick={() => navigateTo('chooseRole')}
                className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Change Role</span>
              </button>

              <span className="text-xs font-mono text-red-500 font-semibold uppercase">
                Admin Registration
              </span>
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white font-display">
                Create Admin Account
              </h2>
              <p className="text-xs text-zinc-400">
                Register as dean or campus infrastructure authority.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-lg bg-red-950/30 border border-red-500/40 text-xs text-red-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleAdminSignUp} className="space-y-3.5">
              <Input
                label="Full Name *"
                type="text"
                placeholder="Enter your full name"
                value={admName}
                onChange={(e) => setAdmName(e.target.value)}
                required
              />

              <Input
                label="Official Admin Email *"
                type="email"
                placeholder="Enter your official admin email"
                value={admEmail}
                onChange={(e) => setAdmEmail(e.target.value)}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Admin ID *"
                  type="text"
                  placeholder="Enter your admin ID"
                  value={admId}
                  onChange={(e) => setAdmId(e.target.value)}
                  required
                />

                <Input
                  label="Department / Administration Unit *"
                  type="text"
                  placeholder="e.g. Dean Office, Estate Governance"
                  value={admUnit}
                  onChange={(e) => setAdmUnit(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Password *"
                  type="password"
                  placeholder="Create a password"
                  value={admPassword}
                  onChange={(e) => setAdmPassword(e.target.value)}
                  required
                />

                <Input
                  label="Confirm Password *"
                  type="password"
                  placeholder="Confirm your password"
                  value={admConfirmPassword}
                  onChange={(e) => setAdmConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isLoading}
                  className="w-full"
                >
                  Create Admin Account
                </Button>
              </div>
            </form>

            <div className="text-center pt-2 border-t border-white/[0.08]">
              <button
                onClick={() => navigateTo('signIn')}
                className="text-xs text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
              >
                Already have an account? <strong className="text-white">Sign In</strong>
              </button>
            </div>
          </SpatialCard>
        )}

        {/* ========================================================================= */}
        {/* VIEW 6: SIGN IN (ASK ONLY EMAIL & PASSWORD) */}
        {/* ========================================================================= */}
        {view === 'signIn' && (
          <SpatialCard elevation={3} className="space-y-5 p-6 sm:p-8">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <button
                onClick={() => navigateTo('landing')}
                className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Home</span>
              </button>

              <span className="text-xs font-mono text-red-500 font-semibold uppercase">
                Sign In
              </span>
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white font-display">
                Sign In to Your Dashboard
              </h2>
              <p className="text-xs text-zinc-400">
                Select your role and authenticate with your email and password.
              </p>
            </div>

            {/* Role Switcher for Sign In */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                Select Operational Role:
              </label>
              <div className="grid grid-cols-3 gap-2 p-1 bg-[#07070A] border border-white/[0.08] rounded-xl">
                {(['student', 'staff', 'admin'] as const).map((r) => {
                  const isActive = signInRole === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setSignInRole(r)}
                      className={`py-2 px-2.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#E50914] text-white shadow-sm'
                          : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
                      }`}
                    >
                      {r}
                    </button>
                  );
                })}
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-lg bg-red-950/30 border border-red-500/40 text-xs text-red-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Sign In Form: ONLY Email & Password */}
            <form onSubmit={handleSignIn} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="Enter your registered email"
                value={signInEmail}
                onChange={(e) => setSignInEmail(e.target.value)}
                required
                startIcon={<Mail className="w-4 h-4" />}
              />

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-300">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setFpEmail(signInEmail);
                      setFpStep(1);
                      navigateTo('forgotPassword');
                    }}
                    className="text-[11px] text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <Input
                  type="password"
                  placeholder="Enter your password"
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                  required
                  startIcon={<Lock className="w-4 h-4" />}
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isLoading}
                  className="w-full"
                >
                  Sign In
                </Button>
              </div>
            </form>

            <div className="text-center pt-2 border-t border-white/[0.08]">
              <button
                onClick={() => navigateTo('chooseRole')}
                className="text-xs text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
              >
                Don&apos;t have an account? <strong className="text-white">Create Account</strong>
              </button>
            </div>
          </SpatialCard>
        )}

        {/* ========================================================================= */}
        {/* VIEW 7: FORGOT PASSWORD & OTP FLOW */}
        {/* ========================================================================= */}
        {view === 'forgotPassword' && (
          <SpatialCard elevation={3} className="space-y-5 p-6 sm:p-8">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <button
                onClick={() => navigateTo('signIn')}
                className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </button>

              <span className="text-xs font-mono text-red-500 font-semibold uppercase">
                Password Recovery
              </span>
            </div>

            {/* STEP 1: ENTER EMAIL */}
            {fpStep === 1 && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-white font-display">
                    Forgot Password
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Enter your registered email address. We will verify your account and dispatch a 6-digit OTP.
                  </p>
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-lg bg-red-950/30 border border-red-500/40 text-xs text-red-300 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleRequestOtp} className="space-y-4">
                  <Input
                    label="Registered Email Address"
                    type="email"
                    placeholder="Enter your registered email"
                    value={fpEmail}
                    onChange={(e) => setFpEmail(e.target.value)}
                    required
                    startIcon={<Mail className="w-4 h-4" />}
                  />

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    isLoading={isLoading}
                    className="w-full"
                  >
                    Send OTP
                  </Button>
                </form>
              </div>
            )}

            {/* STEP 2: 6 SEPARATE OTP BOXES */}
            {fpStep === 2 && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-white font-display">
                    Verify Security Code
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Enter the 6-digit verification code sent to your email.
                  </p>
                </div>

                {deliveryNote && (
                  <div className="p-3 rounded-lg bg-zinc-900 border border-white/[0.09] text-xs text-zinc-300 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{deliveryNote}</span>
                  </div>
                )}

                {errorMsg && (
                  <div className="p-3 rounded-lg bg-red-950/30 border border-red-500/40 text-xs text-red-300 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleVerifyOtp} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-slate-300 text-center">
                      6-Digit Verification Code
                    </label>
                    <OtpInputBoxes value={otpCode} onChange={setOtpCode} />
                    <p className="text-[11px] text-zinc-500 text-center">
                      Expires in 5 minutes · Single-use code
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      disabled={otpCode.length !== 6}
                      className="w-full"
                    >
                      Verify OTP
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="md"
                      onClick={handleRequestOtp}
                      className="w-full text-zinc-400 hover:text-white"
                    >
                      Resend OTP
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* STEP 3: OTP VERIFIED SUCCESS CHOICES */}
            {fpStep === 3 && (
              <div className="space-y-5 text-center py-2">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center">
                  <Check className="w-6 h-6" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-white font-display">
                    OTP verified successfully.
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Your identity has been authenticated. Choose your next action below.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => setFpStep(4)}
                    className="w-full"
                  >
                    Reset Password
                  </Button>

                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={() => navigateTo('signIn')}
                    className="w-full"
                  >
                    Continue to Sign In
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 4: RESET PASSWORD */}
            {fpStep === 4 && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-white font-display">
                    Set New Password
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Choose a strong, secure password for your account.
                  </p>
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-lg bg-red-950/30 border border-red-500/40 text-xs text-red-300 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {successMsg ? (
                  <div className="space-y-4 text-center py-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center">
                      <Check className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-white">
                      Password updated successfully.
                    </p>
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={() => navigateTo('signIn')}
                      className="w-full"
                    >
                      Sign In
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleUpdatePassword} className="space-y-4">
                    <Input
                      label="New Password"
                      type="password"
                      placeholder="Enter new password"
                      value={fpNewPassword}
                      onChange={(e) => setFpNewPassword(e.target.value)}
                      required
                    />

                    <Input
                      label="Confirm New Password"
                      type="password"
                      placeholder="Confirm new password"
                      value={fpConfirmPassword}
                      onChange={(e) => setFpConfirmPassword(e.target.value)}
                      required
                    />

                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      className="w-full"
                    >
                      Update Password
                    </Button>
                  </form>
                )}
              </div>
            )}
          </SpatialCard>
        )}

      </div>
    </div>
  );
}
