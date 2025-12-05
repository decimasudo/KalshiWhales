'use client';

import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  opacity: number;
  color: string;
}

export default function CyberpunkBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);

  // Use your theme colors from tailwind.config.js
  const colors = ['#00d4ff', '#0ea5e9', '#06b6d4']; // cyan-electric, blue-vibrant, cyan-teal
  const bgColor = 'rgba(15, 20, 25, 0.05)'; // navy-deep with low alpha for trails

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const setCanvasDimensions = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    setCanvasDimensions();

    const createParticle = (): Particle => {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const size = Math.random() * 2 + 1; // 1px to 3px
      const speedY = (Math.random() - 0.5) * 0.2; // Slow vertical drift
      const speedX = (Math.random() - 0.5) * 0.2; // Slow horizontal drift
      const opacity = Math.random() * 0.3 + 0.1; // Start subtle
      const color = colors[Math.floor(Math.random() * colors.length)];

      return { x, y, size, speedY, speedX, opacity, color };
    };

    const initParticles = () => {
      const particleCount = Math.floor((canvas.width * canvas.height) / 10000);
      particles.current = [];
      for (let i = 0; i < particleCount; i++) {
        particles.current.push(createParticle());
      }
    };

    const animate = () => {
      if (!ctx || !canvas) return;

      // Create long, fading trails
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.current.forEach((p, index) => {
        // 1. Update particle position
        p.y += p.speedY;
        p.x += p.speedX;
        p.opacity += 0.001; // Slowly fade in

        // 2. Recycle particles that drift off-screen or get too bright
        if (p.y < -p.size || 
            p.y > canvas.height + p.size || 
            p.x < -p.size || 
            p.x > canvas.width + p.size ||
            p.opacity > 0.8) 
        {
          particles.current[index] = createParticle();
        }

        // 3. Draw the particle
        ctx.beginPath();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10; // This adds the "glow"
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
      });

      ctx.globalAlpha = 1.0; // Reset global alpha
      ctx.shadowBlur = 0;
      animationFrameId = requestAnimationFrame(animate);
    };

    initParticles();
    animate();

    const handleResize = () => {
      setCanvasDimensions();
      initParticles(); 
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [colors, bgColor]);

  return (
    <canvas
      ref={canvasRef}
      className="cyberpunk-bg"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: -1, 
        pointerEvents: 'none',
        backgroundColor: '#0f1419', // Match navy-deep
      }}
    />
  );
}