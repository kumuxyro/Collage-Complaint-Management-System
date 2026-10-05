import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { StudentUser } from '../../types/auth.ts';
import { 
  ComplaintCategory, 
  ComplaintPriority, 
  Complaint, 
  ComplaintAttachment,
  CATEGORY_SLA_HOURS 
} from '../../types/studentDashboard.ts';
import { complaintsApi } from '../../services/api.ts';
import { SpatialCard } from '../design-system/SpatialCard.tsx';
import { Button } from '../design-system/Button.tsx';
import { Input } from '../design-system/Input.tsx';
import { Select } from '../design-system/Select.tsx';
import { Textarea } from '../design-system/Textarea.tsx';
import { 
  X, 
  Upload, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Clock, 
  MapPin, 
  ShieldCheck, 
  Eye, 
  ArrowRight, 
  ArrowLeft,
  Building,
  User,
  Mail,
  Flame,
  Check
} from 'lucide-react';

interface ComplaintSubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplaintSubmitted?: (newComplaint: Complaint) => void;
}

const CATEGORIES: ComplaintCategory[] = [
  'Classrooms',
  'Laboratories',
  'Fees & Accounts',
  'Library',
  'Hostel & Residential',
  'Transport',
  'IT & Network Services',
  'Facilities & Campus Life',
];

const CATEGORY_OPTIONS = CATEGORIES.map((cat) => ({
  value: cat,
  label: `${cat} (${CATEGORY_SLA_HOURS[cat]}h target SLA)`,
}));

const PRIORITY_OPTIONS: { value: ComplaintPriority; label: string; desc: string; color: string }[] = [
  { value: 'LOW', label: 'Low', desc: 'Routine inquiry or minor cosmetic issue', color: 'border-zinc-700 text-zinc-300' },
  { value: 'MEDIUM', label: 'Medium', desc: 'Standard equipment or facility malfunction', color: 'border-zinc-700 text-zinc-200' },
  { value: 'HIGH', label: 'High', desc: 'Impacting study, lab sessions, or campus utility', color: 'border-amber-500/40 text-amber-400' },
  { value: 'URGENT', label: 'Urgent', desc: 'Safety hazard, active leak, or major outage', color: 'border-red-500/50 text-red-400' },
];

export function ComplaintSubmitModal({
  isOpen,
  onClose,
  onComplaintSubmitted,
}: ComplaintSubmitModalProps) {
  const { currentUser } = useAuth();
  const student = currentUser as StudentUser | null;

  // View state: 'form' | 'review' | 'success'
  const [step, setStep] = useState<'form' | 'review' | 'success'>('form');

  // Form Fields
  const [category, setCategory] = useState<ComplaintCategory>('Classrooms');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [block, setBlock] = useState('');
  const [room, setRoom] = useState('');
  const [priority, setPriority] = useState<ComplaintPriority>('MEDIUM');
  const [attachment, setAttachment] = useState<ComplaintAttachment | undefined>(undefined);

  // Validation Errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Generated Complaint Result
  const [submittedComplaint, setSubmittedComplaint] = useState<Complaint | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Reset or initialize on open
  useEffect(() => {
    if (isOpen) {
      setStep('form');
      setErrors({});
      setUploadError(null);
      setSubmittedComplaint(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // File Upload Handler (with file type & max 5MB size validation)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Please select a valid image file (PNG, JPG, WEBP, or GIF).');
      return;
    }

    // Validate size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError('Image size exceeds 5MB. Please choose a smaller photo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setAttachment({
        name: file.name,
        size: file.size,
        type: file.type,
        dataUrl,
      });
    };
    reader.readAsDataURL(file);
  };

  const removeAttachment = () => {
    setAttachment(undefined);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Validate form before advancing to Review
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!category) {
      newErrors.category = 'Please select a complaint category.';
    }

    if (!title.trim()) {
      newErrors.title = 'Complaint title is required.';
    } else if (title.trim().length < 5) {
      newErrors.title = 'Title must be at least 5 characters.';
    } else if (title.trim().length > 100) {
      newErrors.title = 'Title must be under 100 characters.';
    }

    if (!description.trim()) {
      newErrors.description = 'Please provide a detailed description of the issue.';
    } else if (description.trim().length < 15) {
      newErrors.description = 'Description should be at least 15 characters to explain the issue.';
    }

    if (!block.trim()) {
      newErrors.block = 'Block or building is required.';
    }

    if (!room.trim()) {
      newErrors.room = 'Room number or specific area is required.';
    }

    if (!priority) {
      newErrors.priority = 'Please specify an urgency priority level.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProceedToReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setStep('review');
    }
  };

  const [submitError, setSubmitError] = useState<string | null>(null);

  // Final Submission Handler
  const handleFinalSubmit = async () => {
    if (!student) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const createdRecord = await complaintsApi.createComplaint({
        category,
        title: title.trim(),
        description: description.trim(),
        block: block.trim(),
        room: room.trim(),
        priority,
        attachment,
      });

      setSubmittedComplaint(createdRecord);
      setIsSubmitting(false);
      setStep('success');

      // Notify parent dashboard to update complaints & stats
      if (onComplaintSubmitted) {
        onComplaintSubmitted(createdRecord);
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setSubmitError(err.message || 'Failed to submit complaint. Please check your network and try again.');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity" 
        aria-hidden="true" 
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl border border-white/[0.12] bg-[#07070A] shadow-2xl z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.08] bg-[#0A0A0E] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-950/40 border border-red-500/30 text-red-500">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white font-display">
                Submit a New Complaint
              </h2>
              <p className="text-xs text-zinc-400">
                Tell us what happened and where it needs attention.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 border border-white/[0.08] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">

          {/* ========================================================================= */}
          {/* STEP 1: COMPLAINT ENTRY FORM */}
          {/* ========================================================================= */}
          {step === 'form' && (
            <form onSubmit={handleProceedToReview} className="space-y-6">

              {/* 1. REPORT / CONTACT IDENTITY (READ-ONLY) */}
              <div className="space-y-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-red-400 font-semibold flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  <span>Student Contact Identity (Read-Only)</span>
                </span>
                <div className="p-3.5 rounded-xl bg-[#0C0C11] border border-white/[0.08] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-zinc-500 block text-[10px] uppercase font-mono">Student Name</span>
                    <span className="text-white font-semibold">{student?.name || 'Authenticated Student'}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px] uppercase font-mono">College USN</span>
                    <span className="text-red-400 font-mono font-semibold">{student?.usn || 'Not provided'}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px] uppercase font-mono">Contact Email</span>
                    <span className="text-zinc-300 font-mono truncate block" title={student?.email}>{student?.email || 'Registered Email'}</span>
                  </div>
                </div>
              </div>

              {/* 2. CATEGORY SELECTOR */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
                  1. Issue Category *
                </span>
                <Select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ComplaintCategory)}
                  options={CATEGORY_OPTIONS}
                  error={errors.category}
                />
                <div className="flex items-center gap-2 pt-1 text-[11px] text-zinc-400">
                  <Clock className="w-3.5 h-3.5 text-red-500" />
                  <span>Guaranteed Institutional SLA Target: <strong className="text-white">{CATEGORY_SLA_HOURS[category]} hours</strong></span>
                </div>
              </div>

              {/* 3. DETAILS (TITLE & DETAILED DESCRIPTION) */}
              <div className="space-y-3.5">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
                  2. Complaint Details *
                </span>
                <Input
                  label="Complaint Title *"
                  type="text"
                  placeholder="Briefly describe the issue (e.g., Overhead Projector Lamp Failing)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  error={errors.title}
                  maxLength={100}
                />

                <Textarea
                  label="Describe the Issue *"
                  rows={4}
                  placeholder="Explain what happened, when it occurred, and any relevant circumstances that will help the technician resolve it quickly..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  error={errors.description}
                />
              </div>

              {/* 4. LOCATION DETAILS */}
              <div className="space-y-3">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>3. Location Details *</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <Input
                    label="Block / Building *"
                    type="text"
                    placeholder="Enter block or building (e.g. Science Block, Hostel B)"
                    value={block}
                    onChange={(e) => setBlock(e.target.value)}
                    error={errors.block}
                  />

                  <Input
                    label="Room / Area *"
                    type="text"
                    placeholder="Enter room number or area (e.g. Room 304, 2nd Floor West)"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    error={errors.room}
                  />
                </div>
              </div>

              {/* 5. PHOTO / EVIDENCE UPLOAD (OPTIONAL) */}
              <div className="space-y-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5" />
                  <span>4. Upload Photo / Evidence (Optional)</span>
                </span>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
                  onChange={handleFileChange}
                  className="hidden"
                  id="complaint-evidence-input"
                />

                {!attachment ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="p-5 border border-dashed border-white/[0.14] rounded-xl bg-[#09090E] hover:border-red-500/50 hover:bg-[#0E0E14] transition-all cursor-pointer text-center space-y-2 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#121217] border border-white/[0.08] flex items-center justify-center mx-auto text-zinc-400 group-hover:text-red-400 transition-colors">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-white">
                        Click to select an image or photo
                      </p>
                      <p className="text-[11px] text-zinc-500">
                        PNG, JPG, WEBP, or GIF up to 5MB
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl border border-white/[0.12] bg-[#0D0D12] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <img
                        src={attachment.dataUrl}
                        alt="Evidence preview"
                        className="w-12 h-12 rounded-lg object-cover border border-white/[0.1] shrink-0"
                      />
                      <div className="overflow-hidden space-y-0.5">
                        <span className="text-xs font-semibold text-white truncate block">
                          {attachment.name}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-400">
                          {formatFileSize(attachment.size)} · Image Attached
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeAttachment}
                      className="p-2 rounded-lg text-red-400 hover:text-white hover:bg-red-950/40 border border-transparent hover:border-red-500/30 transition-colors cursor-pointer shrink-0"
                      title="Remove attachment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {uploadError && (
                  <p className="text-[11px] text-red-400 flex items-center gap-1.5 pt-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{uploadError}</span>
                  </p>
                )}
              </div>

              {/* 6. URGENCY / PRIORITY SELECTOR */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
                    5. Priority / Urgency *
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    Helps departments triage critical issues
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {PRIORITY_OPTIONS.map((opt) => {
                    const isSelected = priority === opt.value;
                    return (
                      <div
                        key={opt.value}
                        onClick={() => setPriority(opt.value)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer text-left space-y-1 ${
                          isSelected
                            ? 'bg-red-500/15 border-red-500 shadow-[0_0_12px_rgba(229,9,20,0.3)]'
                            : 'bg-[#09090D] border-white/[0.08] hover:border-white/[0.18]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold ${isSelected ? 'text-white' : opt.color.split(' ')[1]}`}>
                            {opt.label}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                        </div>
                        <p className="text-[10px] text-zinc-400 leading-tight">
                          {opt.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Form Action Footer */}
              <div className="pt-4 border-t border-white/[0.08] flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={onClose}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                >
                  <span>Review Complaint</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: REVIEW COMPLAINT BEFORE SUBMISSION */}
          {/* ========================================================================= */}
          {step === 'review' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/30 text-xs text-red-300 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>
                  Please review your complaint details before registering. Once submitted, it will be assigned to the appropriate campus custodian under a guaranteed {CATEGORY_SLA_HOURS[category]}h SLA.
                </span>
              </div>

              {/* Review Card */}
              <div className="p-5 rounded-2xl border border-white/[0.1] bg-[#0A0A0E] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-red-400 font-semibold">{category}</span>
                    <span className="text-zinc-600">·</span>
                    <span className="text-xs font-mono text-zinc-400">{CATEGORY_SLA_HOURS[category]}h SLA</span>
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${
                    priority === 'URGENT' ? 'text-red-400 bg-red-950/40 border-red-500/30' :
                    priority === 'HIGH' ? 'text-amber-400 bg-amber-950/40 border-amber-500/30' :
                    'text-zinc-300 bg-zinc-900 border-zinc-700'
                  }`}>
                    Priority: {priority}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-mono text-zinc-500 uppercase">Complaint Title</span>
                  <h3 className="text-base font-bold text-white">{title}</h3>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-mono text-zinc-500 uppercase">Description</span>
                  <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">{description}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-[#0E0E14] border border-white/[0.06] space-y-0.5">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase">Location</span>
                    <span className="text-xs font-semibold text-white block">{block}, {room}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#0E0E14] border border-white/[0.06] space-y-0.5">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase">Registered Student Contact</span>
                    <span className="text-xs font-semibold text-white block truncate">{student?.email}</span>
                  </div>
                </div>

                {attachment && (
                  <div className="space-y-1 pt-2">
                    <span className="text-[11px] font-mono text-zinc-500 uppercase">Supporting Photo / Evidence</span>
                    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#0E0E14] border border-white/[0.08]">
                      <img
                        src={attachment.dataUrl}
                        alt="Attached evidence preview"
                        className="w-14 h-14 rounded-lg object-cover border border-white/[0.1] shrink-0"
                      />
                      <div className="text-xs">
                        <span className="font-semibold text-white block">{attachment.name}</span>
                        <span className="text-[11px] text-zinc-400 font-mono">{formatFileSize(attachment.size)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {submitError && (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 flex items-center gap-2 text-xs text-red-400">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Review Step Actions */}
              <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => setStep('form')}
                  className="flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Edit</span>
                </Button>

                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  isLoading={isSubmitting}
                  onClick={handleFinalSubmit}
                  className="shadow-lg"
                >
                  Submit Complaint
                </Button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: SUBMISSION SUCCESS RESULT */}
          {/* ========================================================================= */}
          {step === 'success' && submittedComplaint && (
            <div className="py-6 text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                <Check className="w-8 h-8" />
              </div>

              <div className="space-y-1.5 max-w-md mx-auto">
                <h3 className="text-xl font-bold text-white font-display">
                  Complaint submitted successfully.
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Your complaint has been registered and is ready for departmental processing.
                </p>
              </div>

              {/* Generated Dynamic Complaint Identifier Plaque */}
              <div className="p-5 rounded-2xl bg-[#0B0B10] border border-white/[0.1] max-w-md mx-auto space-y-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                    Assigned Complaint ID
                  </span>
                  <div className="text-2xl font-mono font-bold text-red-500 tracking-wider">
                    {submittedComplaint.id}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-white/[0.06] font-mono">
                  <div>
                    <span className="text-zinc-500 block text-[10px]">Initial Status:</span>
                    <span className="text-emerald-400 font-semibold">{submittedComplaint.status}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px]">Category SLA:</span>
                    <span className="text-white font-semibold">{submittedComplaint.targetSlaHours}h Turnaround</span>
                  </div>
                </div>
              </div>

              {/* Result Actions */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button
                  variant="primary"
                  size="md"
                  onClick={onClose}
                  className="w-full sm:w-auto"
                >
                  View Complaint
                </Button>

                <Button
                  variant="secondary"
                  size="md"
                  onClick={onClose}
                  className="w-full sm:w-auto"
                >
                  Back to Dashboard
                </Button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
