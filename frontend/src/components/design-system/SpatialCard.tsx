import React, { useRef, useState } from 'react';

export interface SpatialCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  elevation?: 1 | 2 | 3;
  tiltIntensity?: 'subtle' | 'standard' | 'pronounced';
  glowColor?: string;
  enableSpecular?: boolean;
}

export function SpatialCard({
  children,
  elevation = 2,
  tiltIntensity = 'standard',
  glowColor = 'rgba(229, 9, 20, 0.16)',
  enableSpecular = true,
  className = '',
  style,
  ...props
}: SpatialCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [transform, setTransform] = useState('');
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const maxDegrees = {
    subtle: 3.5,
    standard: 5.5,
    pronounced: 8.5,
  }[tiltIntensity];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -maxDegrees;
    const rotateY = ((x - centerX) / centerX) * maxDegrees;

    const zDepth = elevation === 3 ? 12 : elevation === 2 ? 8 : 4;
    setTransform(
      `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateZ(${zDepth}px)`
    );

    setGlarePos({
      x: Math.round((x / rect.width) * 100),
      y: Math.round((y / rect.height) * 100),
    });
  };

  const handleMouseEnter = () => setIsHovered(true);

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)');
  };

  const elevationClasses = {
    1: 'bg-[#08080A] border-white/[0.08] shadow-lg',
    2: 'bg-[#0C0C0F] border-white/[0.09] hover:border-red-500/35 shadow-2xl',
    3: 'bg-[#121217] border-white/[0.12] hover:border-red-500/45 shadow-[0_24px_50px_-12px_rgba(0,0,0,0.95)]',
  }[elevation];

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: transform || 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)',
        transition: isHovered
          ? 'transform 0.08s ease-out'
          : 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        ...style,
      }}
      className={`relative overflow-hidden rounded-xl border transition-colors duration-200 ${elevationClasses} ${className}`}
      {...props}
    >
      {/* Subtle Red Specular Glint (Tracks cursor across the deep black surface) */}
      {enableSpecular && (
        <div
          className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition-opacity duration-300"
          style={{
            opacity: isHovered ? 1 : 0,
            background: `radial-gradient(450px circle at ${glarePos.x}% ${glarePos.y}%, ${glowColor}, transparent 65%)`,
          }}
          aria-hidden="true"
        />
      )}

      {/* Hairline subtle top light reflection with soft ruby sheen */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent"
        aria-hidden="true"
      />

      <div className="relative z-10">{children}</div>
    </div>
  );
}
