import React from 'react';

export type DepthLevel = 0 | 1 | 2 | 3 | 4;

interface DepthLayerProps {
  level: DepthLevel;
  title?: string;
  badge?: string;
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
}

export function DepthLayer({
  level,
  title,
  badge,
  children,
  className = '',
  interactive = false,
}: DepthLayerProps) {
  const levelStyles: Record<
    DepthLevel,
    { bg: string; border: string; shadow: string; zIndex: string }
  > = {
    0: {
      bg: 'bg-[#000000]',
      border: 'border-transparent',
      shadow: 'shadow-none',
      zIndex: 'z-0',
    },
    1: {
      bg: 'bg-[#060608]',
      border: 'border-white/[0.08]',
      shadow: 'shadow-sm',
      zIndex: 'z-10',
    },
    2: {
      bg: 'bg-[#0C0C10]',
      border: 'border-white/[0.09]',
      shadow: 'shadow-xl',
      zIndex: 'z-20',
    },
    3: {
      bg: 'bg-[#121216]',
      border: 'border-white/[0.12]',
      shadow: 'shadow-2xl',
      zIndex: 'z-30',
    },
    4: {
      bg: 'bg-[#18181F]',
      border: 'border-red-500/40',
      shadow: 'shadow-[0_24px_60px_-10px_rgba(0,0,0,0.95)]',
      zIndex: 'z-40',
    },
  };

  const current = levelStyles[level];

  return (
    <div
      className={`relative rounded-xl border p-5 transition-all duration-300 ${current.bg} ${current.border} ${current.shadow} ${current.zIndex} ${
        interactive ? 'hover:-translate-y-1 hover:border-red-500/40' : ''
      } ${className}`}
    >
      {(title || badge) && (
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.06] text-xs">
          {title && <span className="font-semibold text-slate-200">{title}</span>}
          {badge && (
            <span className="font-mono text-[11px] text-red-400 tabular-nums">
              {badge}
            </span>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
