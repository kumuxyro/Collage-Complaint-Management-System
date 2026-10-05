import React from 'react';

export type StatusType =
  | 'submitted'
  | 'under_review'
  | 'assigned'
  | 'jira_created'
  | 'in_progress'
  | 'resolved'
  | 'breached'
  | 'closed';

interface StatusIndicatorProps {
  status: StatusType;
  label?: string;
  metadata?: string;
  className?: string;
  showDotGlow?: boolean;
}

const statusConfig: Record<
  StatusType,
  { defaultLabel: string; dotColor: string; glowColor: string; textColor: string }
> = {
  submitted: {
    defaultLabel: 'Submitted',
    dotColor: 'bg-zinc-400',
    glowColor: 'rgba(161, 161, 170, 0.4)',
    textColor: 'text-zinc-300',
  },
  under_review: {
    defaultLabel: 'Under Review',
    dotColor: 'bg-amber-400',
    glowColor: 'rgba(251, 191, 36, 0.5)',
    textColor: 'text-amber-300',
  },
  assigned: {
    defaultLabel: 'Assigned',
    dotColor: 'bg-zinc-300',
    glowColor: 'rgba(212, 212, 216, 0.4)',
    textColor: 'text-zinc-200',
  },
  jira_created: {
    defaultLabel: 'Jira Synced',
    dotColor: 'bg-red-500',
    glowColor: 'rgba(239, 68, 68, 0.6)',
    textColor: 'text-red-400',
  },
  in_progress: {
    defaultLabel: 'In Progress',
    dotColor: 'bg-amber-400',
    glowColor: 'rgba(245, 158, 11, 0.5)',
    textColor: 'text-amber-300',
  },
  resolved: {
    defaultLabel: 'Resolved',
    dotColor: 'bg-emerald-400',
    glowColor: 'rgba(52, 211, 153, 0.5)',
    textColor: 'text-emerald-300',
  },
  breached: {
    defaultLabel: 'SLA Breached',
    dotColor: 'bg-red-600',
    glowColor: 'rgba(220, 38, 38, 0.7)',
    textColor: 'text-red-400',
  },
  closed: {
    defaultLabel: 'Closed',
    dotColor: 'bg-zinc-500',
    glowColor: 'rgba(113, 113, 122, 0.3)',
    textColor: 'text-zinc-400',
  },
};

/**
 * Complies with Zero-Pill & Metadata Discipline:
 * Unboxed clean text with luminous micro-dot indicator and typographic separator.
 */
export function StatusIndicator({
  status,
  label,
  metadata,
  className = '',
  showDotGlow = true,
}: StatusIndicatorProps) {
  const config = statusConfig[status] || statusConfig.submitted;
  const displayText = label || config.defaultLabel;

  return (
    <div className={`inline-flex items-center gap-2 text-xs font-medium ${className}`}>
      {/* Micro Status Dot */}
      <span className="relative flex h-2 w-2 shrink-0 items-center justify-center">
        {showDotGlow && (
          <span
            className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
            style={{ backgroundColor: config.glowColor }}
          />
        )}
        <span
          className={`relative inline-flex h-1.5 w-1.5 rounded-full ${config.dotColor}`}
          style={{
            boxShadow: showDotGlow ? `0 0 6px 1px ${config.glowColor}` : 'none',
          }}
        />
      </span>

      <span className={`${config.textColor} select-none whitespace-nowrap`}>
        {displayText}
      </span>

      {metadata && (
        <>
          <span className="text-zinc-600 select-none" aria-hidden="true">
            ·
          </span>
          <span className="text-zinc-400 font-mono text-[11px] tabular-nums select-none whitespace-nowrap">
            {metadata}
          </span>
        </>
      )}
    </div>
  );
}
