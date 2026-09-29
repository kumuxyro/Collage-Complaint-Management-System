import React, { forwardRef, useState } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, helperText, error, startIcon, endIcon, className = '', disabled, id, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-medium text-slate-300">
            {label}
          </label>
        )}

        <div className="relative rounded-lg group">
          {/* Subtle Dynamic Ambient Focus Glow */}
          <div
            className={`pointer-events-none absolute -inset-0.5 rounded-lg transition-opacity duration-300 ${
              error
                ? 'bg-red-500/30 opacity-100'
                : isFocused
                ? 'bg-red-500/20 opacity-100'
                : 'opacity-0'
            }`}
            aria-hidden="true"
          />

          <div
            className={`relative flex items-center bg-[#09090C] border rounded-lg overflow-hidden transition-all duration-200 ${
              error
                ? 'border-red-500/90'
                : isFocused
                ? 'border-red-500/90 shadow-[0_0_18px_-2px_rgba(229,9,20,0.35)]'
                : 'border-white/[0.09] hover:border-white/[0.18]'
            } ${disabled ? 'opacity-50 cursor-not-allowed bg-black/60' : ''}`}
          >
            {startIcon && (
              <div className="pl-3 pr-1 text-slate-400 flex items-center pointer-events-none shrink-0">
                {startIcon}
              </div>
            )}

            <input
              ref={ref}
              id={inputId}
              disabled={disabled}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className={`w-full bg-transparent px-3 py-2 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none disabled:cursor-not-allowed ${className}`}
              {...props}
            />

            {endIcon && (
              <div className="pr-3 pl-1 text-slate-400 flex items-center pointer-events-none shrink-0">
                {endIcon}
              </div>
            )}
          </div>
        </div>

        {error ? (
          <p className="text-[11px] font-medium text-red-400 flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-red-400" />
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p className="text-[11px] text-slate-400">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
