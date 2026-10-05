import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  baseAlpha: number;
  alpha: number;
}

export function InteractiveCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    const particles: Particle[] = [];
    const count = Math.min(Math.floor((width * height) / 22000), 65);

    for (let i = 0; i < count; i++) {
      const radius = Math.random() * 1.8 + 0.6;
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        baseAlpha: Math.random() * 0.35 + 0.15,
        alpha: Math.random() * 0.35 + 0.15,
      });
    }

    const mouse = { x: -1000, y: -1000, targetX: -1000, targetY: -1000 };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
    };

    window.addEventListener('mousemove', handleMouseMove);

    const render = () => {
      // Smooth mouse follow
      mouse.x += (mouse.targetX - mouse.x) * 0.08;
      mouse.y += (mouse.targetY - mouse.y) * 0.08;

      ctx.clearRect(0, 0, width, height);

      // Subtle cursor spotlight ambient gradient
      if (mouse.x > 0 && mouse.y > 0) {
        const spotGrad = ctx.createRadialGradient(
          mouse.x,
          mouse.y,
          0,
          mouse.x,
          mouse.y,
          450
        );
        spotGrad.addColorStop(0, 'rgba(30, 58, 138, 0.09)');
        spotGrad.addColorStop(0.5, 'rgba(14, 165, 233, 0.03)');
        spotGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = spotGrad;
        ctx.fillRect(0, 0, width, height);
      }

      // Draw subtle spatial grid lines (depth layer)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.015)';
      ctx.lineWidth = 1;
      const gridSize = 80;
      const offsetX = (mouse.x - width / 2) * 0.015;
      const offsetY = (mouse.y - height / 2) * 0.015;

      ctx.beginPath();
      for (let x = (offsetX % gridSize) - gridSize; x < width + gridSize; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = (offsetY % gridSize) - gridSize; y < height + gridSize; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // Update & render particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Mouse distance reactivity
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let drawAlpha = p.alpha;
        if (dist < 140) {
          drawAlpha = Math.min(1, p.baseAlpha + (1 - dist / 140) * 0.5);
          p.x -= (dx / dist) * 0.4;
          p.y -= (dy / dist) * 0.4;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(148, 163, 184, ${drawAlpha})`;
        ctx.fill();

        // Connect nearby particles with subtle hairlines
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const pdist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (pdist < 90) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(100, 116, 139, ${(1 - pdist / 90) * 0.08})`;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      aria-hidden="true"
    />
  );
}
