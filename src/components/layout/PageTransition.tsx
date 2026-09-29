import React, { useEffect, useState } from 'react';

interface PageTransitionProps {
  children: React.ReactNode;
  transitionKey: string;
}

export function PageTransition({ children, transitionKey }: PageTransitionProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(false);
    const timeout = setTimeout(() => setIsVisible(true), 25);
    return () => clearTimeout(timeout);
  }, [transitionKey]);

  return (
    <div
      key={transitionKey}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0px) scale(1)' : 'translateY(6px) scale(0.995)',
        transition: 'opacity 220ms cubic-bezier(0.16, 1, 0.3, 1), transform 220ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      className="w-full h-full"
    >
      {children}
    </div>
  );
}
