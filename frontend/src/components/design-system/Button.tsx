import React, { useRef, useState } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  isLoading?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  isLoading = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [glintPos, setGlintPos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    setGlintPos({ x, y });
  };

  const sizeClasses = {
    sm: 'text-xs py-1.5 px-3 rounded-md gap-1.5 min-h-[32px]',
    md: 'text-xs font-semibold py-2 px-4 rounded-lg gap-2 min-h-[40px]',
    lg: 'text-sm font-semibold py-2.5 px-5 rounded-xl gap-2.5 min-h-[46px]',
  }[size];

  const variantClasses = {
    primary:
      'bg-gradient-to-b from-[#FF2633] to-[#E50914] text-white font-semibold shadow-[0_2px_18px_-2px_rgba(229,9,20,0.55)] hover:from-[#FF3844] hover:to-[#F40612] border border-red-400/40 active:translate-y-px',
    secondary:
      'bg-[#0E0E12] text-slate-100 border border-white/[0.12] hover:bg-[#16161C] hover:border-red-500/40 shadow-md active:translate-y-px',
    outline:
      'bg-transparent text-red-400 border border-red-500/40 hover:bg-red-950/25 hover:border-red-400 active:translate-y-px',
    ghost:
      'bg-transparent text-slate-300 hover:text-white hover:bg-white/[0.06] border border-transparent active:translate-y-px',
    danger:
      'bg-red-950/50 text-red-300 border border-red-600/60 hover:bg-red-900/60 hover:border-red-500 active:translate-y-px',
  }[variant];

  return (
    <button
      ref={buttonRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={disabled || isLoading}
      className={`relative overflow-hidden inline-flex items-center justify-center transition-all duration-200 cursor-pointer select-none whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#040405] disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {/* Dynamic specular light trail on hover */}
      {variant !== 'ghost' && (
        <span
          className="pointer-events-none absolute -inset-px rounded-[inherit] opacity-0 transition-opacity duration-200"
          style={{
            opacity: isHovered ? 1 : 0,
            background: `radial-gradient(110px circle at ${glintPos.x}% ${glintPos.y}%, rgba(255, 255, 255, 0.28), transparent 70%)`,
          }}
          aria-hidden="true"
        />
      )}

      {/* Loading Spinner */}
      {isLoading ? (
        <svg
          className="animate-spin -ml-1 mr-2 h-3.5 w-3.5 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>
      )}

      <span className="relative z-10">{children}</span>

      {!isLoading && icon && iconPosition === 'right' && <span className="shrink-0">{icon}</span>}
    </button>
  );
}
