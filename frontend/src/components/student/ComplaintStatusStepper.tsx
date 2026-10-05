import React from 'react';
import { ComplaintStatus } from '../../types/studentDashboard.ts';
import { Check, Clock, CircleDot, AlertCircle } from 'lucide-react';

interface ComplaintStatusStepperProps {
  currentStatus: ComplaintStatus;
}

const STAGES: ComplaintStatus[] = ['SUBMITTED', 'ASSIGNED', 'IN PROGRESS', 'RESOLVED', 'CLOSED'];

export function ComplaintStatusStepper({ currentStatus }: ComplaintStatusStepperProps) {
  // If status is BLOCKED, treat it as in progress but with alert style
  const isBlocked = currentStatus === 'BLOCKED';
  const effectiveStage = isBlocked ? 'IN PROGRESS' : currentStatus;
  const currentIndex = STAGES.indexOf(effectiveStage as any);

  return (
    <div className="w-full py-2">
      <div className="flex items-center justify-between relative">
        {/* Connecting Line Track */}
        <div 
          className="absolute left-3 right-3 top-3.5 h-0.5 bg-zinc-800 -z-0" 
          aria-hidden="true"
        />

        {/* Progress Line Bar */}
        <div 
          className="absolute left-3 top-3.5 h-0.5 bg-[#E50914] transition-all duration-300 -z-0"
          style={{
            width: currentIndex >= 0 ? `${(currentIndex / (STAGES.length - 1)) * 100}%` : '0%',
            maxWidth: 'calc(100% - 24px)',
          }}
          aria-hidden="true"
        />

        {/* Stage Nodes */}
        {STAGES.map((stage, idx) => {
          const isCompleted = currentIndex > idx;
          const isCurrent = currentIndex === idx;

          return (
            <div key={stage} className="flex flex-col items-center gap-1.5 z-10 select-none">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all duration-200 border ${
                  isCurrent
                    ? 'bg-[#E50914] border-red-400 text-white shadow-[0_0_12px_rgba(229,9,20,0.85)] scale-110'
                    : isCompleted
                    ? 'bg-[#181820] border-red-500/60 text-red-400'
                    : 'bg-[#09090D] border-zinc-800 text-zinc-500'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-3.5 h-3.5" />
                ) : isCurrent ? (
                  <CircleDot className="w-3.5 h-3.5 animate-pulse" />
                ) : (
                  <span className="font-mono text-[10px]">{idx + 1}</span>
                )}
              </div>

              <span
                className={`text-[10px] font-mono tracking-tight whitespace-nowrap text-center ${
                  isCurrent
                    ? 'text-white font-bold'
                    : isCompleted
                    ? 'text-zinc-300 font-medium'
                    : 'text-zinc-500'
                }`}
              >
                {stage}
              </span>
            </div>
          );
        })}
      </div>

      {isBlocked && (
        <div className="mt-2 text-center">
          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-amber-400 bg-amber-950/30 px-2 py-0.5 rounded border border-amber-500/30">
            <AlertCircle className="w-3 h-3" />
            <span>Currently Blocked: Waiting for replacement parts</span>
          </span>
        </div>
      )}
    </div>
  );
}
