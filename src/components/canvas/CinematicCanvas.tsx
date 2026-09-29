import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  baseAlpha: number;
  alpha: number;
  type: 'dust' | 'bubble' | 'spark';
  wobbleSpeed?: number;
  wobbleAmp?: number;
  phase?: number;
}

interface Orb {
  x: number;
  y: number;
  radius: number;
  targetRadius: number;
  color: string;
  vx: number;
  vy: number;
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  speed: number;
}

interface CinematicCanvasProps {
  interactive?: boolean;
  lightingIntensity?: number; // 0 to 1
  particleDensity?: 'light' | 'balanced' | 'rich';
}

export function CinematicCanvas({
  interactive = true,
  lightingIntensity = 0.85,
  particleDensity = 'balanced',
}: CinematicCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Mouse tracking with smooth lerp
    const mouse = {
      x: width / 2,
      y: height / 2,
      targetX: width / 2,
      targetY: height / 2,
      speed: 0,
      lastMoveTime: Date.now(),
    };

    let prevMouseX = width / 2;
    let prevMouseY = height / 2;

    const handleMouseMove = (e: MouseEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
      const dx = e.clientX - prevMouseX;
      const dy = e.clientY - prevMouseY;
      mouse.speed = Math.min(Math.sqrt(dx * dx + dy * dy), 40);
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
      mouse.lastMoveTime = Date.now();
    };

    const ripples: Ripple[] = [];

    const handleClick = (e: MouseEvent) => {
      if (!interactive) return;
      ripples.push({
        x: e.clientX,
        y: e.clientY,
        radius: 4,
        maxRadius: Math.min(width, height) * 0.28,
        alpha: 0.5,
        speed: 3.5,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('pointerdown', handleClick);

    // Dynamic Crimson & Scarlet Orbs (Spatial Light Depth)
    const orbs: Orb[] = [
      {
        x: width * 0.2,
        y: height * 0.25,
        radius: 380,
        targetRadius: 380,
        color: 'rgba(229, 9, 20, ', // Bright Red
        vx: 0.22,
        vy: 0.16,
      },
      {
        x: width * 0.82,
        y: height * 0.65,
        radius: 440,
        targetRadius: 440,
        color: 'rgba(185, 28, 28, ', // Deep Crimson
        vx: -0.19,
        vy: -0.14,
      },
      {
        x: width * 0.48,
        y: height * 0.88,
        radius: 320,
        targetRadius: 320,
        color: 'rgba(255, 46, 59, ', // Vibrant Scarlet
        vx: 0.14,
        vy: -0.18,
      },
    ];

    // Particles & Bubbles Initialization
    const particles: Particle[] = [];
    const countMultiplier = particleDensity === 'light' ? 0.6 : particleDensity === 'rich' ? 1.4 : 1.0;
    const particleCount = Math.min(Math.floor((width * height) / 18000 * countMultiplier), 85);

    for (let i = 0; i < particleCount; i++) {
      const isBubble = Math.random() < 0.25;
      const isSpark = !isBubble && Math.random() < 0.25;
      const radius = isBubble
        ? Math.random() * 4.5 + 2.5
        : isSpark
        ? Math.random() * 2 + 1.2
        : Math.random() * 1.5 + 0.5;

      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius,
        vx: (Math.random() - 0.5) * (isBubble ? 0.3 : 0.45),
        vy: (Math.random() - 0.5) * (isBubble ? 0.25 : 0.45) - (isBubble ? 0.12 : 0),
        baseAlpha: isBubble ? Math.random() * 0.35 + 0.15 : Math.random() * 0.4 + 0.15,
        alpha: Math.random() * 0.3 + 0.15,
        type: isBubble ? 'bubble' : isSpark ? 'spark' : 'dust',
        wobbleSpeed: Math.random() * 0.03 + 0.01,
        wobbleAmp: Math.random() * 0.8 + 0.4,
        phase: Math.random() * Math.PI * 2,
      });
    }

    let time = 0;

    const render = () => {
      time += 0.016;

      // Mouse position easing (lerp)
      mouse.x += (mouse.targetX - mouse.x) * 0.065;
      mouse.y += (mouse.targetY - mouse.y) * 0.065;

      // Deep cinematic black base
      ctx.fillStyle = '#020203';
      ctx.fillRect(0, 0, width, height);

      // Render Ambient Spatial Orbs (Layer 0 Background Lighting)
      for (const orb of orbs) {
        orb.x += orb.vx;
        orb.y += orb.vy;

        if (orb.x - orb.radius < -200 || orb.x + orb.radius > width + 200) orb.vx *= -1;
        if (orb.y - orb.radius < -200 || orb.y + orb.radius > height + 200) orb.vy *= -1;

        const dx = mouse.x - orb.x;
        const dy = mouse.y - orb.y;
        orb.x += dx * 0.001;
        orb.y += dy * 0.001;

        const orbGrad = ctx.createRadialGradient(
          orb.x,
          orb.y,
          0,
          orb.x,
          orb.y,
          orb.radius
        );
        const orbAlpha = 0.075 * lightingIntensity;
        orbGrad.addColorStop(0, `${orb.color}${orbAlpha})`);
        orbGrad.addColorStop(0.5, `${orb.color}${orbAlpha * 0.35})`);
        orbGrad.addColorStop(1, 'rgba(2, 2, 3, 0)');

        ctx.fillStyle = orbGrad;
        ctx.fillRect(orb.x - orb.radius, orb.y - orb.radius, orb.radius * 2, orb.radius * 2);
      }

      // Cursor Reactive Dynamic Red Spotlight
      if (interactive && mouse.x > 0 && mouse.y > 0) {
        const spotRadius = 450;
        const spotGrad = ctx.createRadialGradient(
          mouse.x,
          mouse.y,
          0,
          mouse.x,
          mouse.y,
          spotRadius
        );
        spotGrad.addColorStop(0, `rgba(229, 9, 20, ${0.07 * lightingIntensity})`);
        spotGrad.addColorStop(0.4, `rgba(153, 27, 27, ${0.03 * lightingIntensity})`);
        spotGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = spotGrad;
        ctx.fillRect(mouse.x - spotRadius, mouse.y - spotRadius, spotRadius * 2, spotRadius * 2);
      }

      // Render Expanding Interactive Red Ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.radius += r.speed;
        r.alpha -= 0.008;

        if (r.alpha <= 0 || r.radius >= r.maxRadius) {
          ripples.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 30, 45, ${r.alpha * 0.5})`;
        ctx.lineWidth = 1.25;
        ctx.stroke();

        if (r.radius > 20) {
          ctx.beginPath();
          ctx.arc(r.x, r.y, r.radius * 0.65, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(185, 28, 28, ${r.alpha * 0.3})`;
          ctx.lineWidth = 0.75;
          ctx.stroke();
        }
      }

      // Subtle 3D Depth Grid with Parallax
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.015)';
      ctx.lineWidth = 1;
      const gridSize = 90;
      const parallaxX = (mouse.x - width / 2) * 0.02;
      const parallaxY = (mouse.y - height / 2) * 0.02;

      ctx.beginPath();
      for (let x = (parallaxX % gridSize) - gridSize; x < width + gridSize; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = (parallaxY % gridSize) - gridSize; y < height + gridSize; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // Render Particles & Bubbles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (p.phase !== undefined && p.wobbleSpeed && p.wobbleAmp) {
          p.phase += p.wobbleSpeed;
          p.x += Math.sin(p.phase) * p.wobbleAmp * 0.3;
        }

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;

        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const repelRadius = 140;

        let renderAlpha = p.alpha;

        if (dist < repelRadius && dist > 0) {
          const force = (1 - dist / repelRadius);
          renderAlpha = Math.min(0.9, p.baseAlpha + force * 0.45);
          p.x -= (dx / dist) * force * 1.5;
          p.y -= (dy / dist) * force * 1.5;
        }

        ctx.beginPath();
        if (p.type === 'bubble') {
          // Translucent bubble with crimson glint
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(229, 9, 20, ${renderAlpha * 0.12})`;
          ctx.fill();
          ctx.strokeStyle = `rgba(254, 202, 202, ${renderAlpha * 0.4})`;
          ctx.lineWidth = 0.85;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(p.x - p.radius * 0.35, p.y - p.radius * 0.35, p.radius * 0.25, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${renderAlpha * 0.7})`;
          ctx.fill();
        } else if (p.type === 'spark') {
          // Luminous bright red spark
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 50, 65, ${renderAlpha * 0.85})`;
          ctx.fill();
        } else {
          // Ambient soft dust
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(161, 161, 170, ${renderAlpha * 0.35})`;
          ctx.fill();
        }

        // Webbing connections
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const neighborDist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (neighborDist < 85) {
            const lineAlpha = (1 - neighborDist / 85) * 0.07;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(220, 38, 38, ${lineAlpha})`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('pointerdown', handleClick);
      cancelAnimationFrame(animId);
    };
  }, [interactive, lightingIntensity, particleDensity]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      aria-hidden="true"
    />
  );
}
