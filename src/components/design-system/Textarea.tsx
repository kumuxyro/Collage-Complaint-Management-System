import React, { forwardRef, useState } from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, helperText, error, className = '', disabled, id, rows = 3, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label htmlFor={textareaId} className="block text-xs font-medium text-slate-300">
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
            className={`relative bg-[#09090C] border rounded-lg overflow-hidden transition-all duration-200 ${
              error
                ? 'border-red-500/90'
                : isFocused
                ? 'border-red-500/90 shadow-[0_0_18px_-2px_rgba(229,9,20,0.35)]'
                : 'border-white/[0.09] hover:border-white/[0.18]'
            } ${disabled ? 'opacity-50 cursor-not-allowed bg-black/60' : ''}`}
          >
            <textarea
              ref={ref}
              id={textareaId}
              rows={rows}
              disabled={disabled}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className={`w-full bg-transparent px-3 py-2 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none disabled:cursor-not-allowed resize-none ${className}`}
              {...props}
            />
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

Textarea.displayName = 'Textarea';
