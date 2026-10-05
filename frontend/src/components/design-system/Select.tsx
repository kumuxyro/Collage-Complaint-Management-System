import React, { forwardRef, useState } from 'react';

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  options: SelectOption[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, helperText, error, options, className = '', disabled, id, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label htmlFor={selectId} className="block text-xs font-medium text-slate-300">
            {label}
          </label>
        )}

        <div className="relative rounded-lg group">
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
            <select
              ref={ref}
              id={selectId}
              disabled={disabled}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className={`w-full bg-transparent px-3 py-2 text-xs sm:text-sm text-slate-100 focus:outline-none appearance-none cursor-pointer disabled:cursor-not-allowed ${className}`}
              {...props}
            >
              {options.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-[#101014] text-slate-100 py-1">
                  {opt.label}
                </option>
              ))}
            </select>

            <div className="pointer-events-none pr-3 text-slate-400 flex items-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
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

Select.displayName = 'Select';
