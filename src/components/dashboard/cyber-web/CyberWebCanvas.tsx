'use client';

import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  z: number;
  radius: number;
  baseRadius: number;
  alpha: number;
  baseAlpha: number;
  speedX: number;
  speedY: number;
  pulseSpeed: number;
  pulseOffset: number;
}

interface HubBurst {
  x: number;
  y: number;
  rayCount: number;
  radius: number;
  angle: number;
  rotationSpeed: number;
}

interface EnergyPacket {
  lineIndex: number;
  progress: number;
  speed: number;
  size: number;
}

export const CyberWebCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    // High DPI setup
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.parentElement.clientWidth;
      height = canvas.parentElement.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    window.addEventListener('resize', handleResize);

    // Mouse parallax
    let targetMouseX = 0;
    let targetMouseY = 0;
    let currentMouseX = 0;
    let currentMouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      targetMouseX = ((e.clientX - rect.left) / width - 0.5) * 40;
      targetMouseY = ((e.clientY - rect.top) / height - 0.5) * 30;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Initialize 60 floating depth bokeh particles
    const particles: Particle[] = Array.from({ length: 65 }, () => {
      const baseRadius = Math.random() * 4 + 1.5;
      const baseAlpha = Math.random() * 0.45 + 0.15;
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        z: Math.random() * 0.8 + 0.2,
        radius: baseRadius,
        baseRadius,
        alpha: baseAlpha,
        baseAlpha,
        speedX: (Math.random() - 0.5) * 0.35,
        speedY: (Math.random() - 0.5) * 0.25,
        pulseSpeed: Math.random() * 0.02 + 0.01,
        pulseOffset: Math.random() * Math.PI * 2,
      };
    });

    // Main Neural Hubs with starburst bursts (inspired by the reference image)
    const hubs: HubBurst[] = [
      { x: width * 0.22, y: height * 0.3, rayCount: 16, radius: 45, angle: 0, rotationSpeed: 0.002 },
      { x: width * 0.78, y: height * 0.28, rayCount: 14, radius: 40, angle: 1.2, rotationSpeed: -0.0025 },
      { x: width * 0.25, y: height * 0.68, rayCount: 15, radius: 42, angle: 2.1, rotationSpeed: 0.0018 },
      { x: width * 0.76, y: height * 0.72, rayCount: 18, radius: 48, angle: 0.8, rotationSpeed: -0.002 },
      { x: width * 0.5, y: height * 0.48, rayCount: 22, radius: 60, angle: 3.4, rotationSpeed: 0.003 },
    ];

    // Hub interconnection lines
    const hubPairs: [number, number][] = [
      [0, 4],
      [1, 4],
      [2, 4],
      [3, 4],
      [0, 1],
      [0, 2],
      [1, 3],
      [2, 3],
    ];

    // Animated packets travelling on lines
    const packets: EnergyPacket[] = hubPairs.map((_, index) => ({
      lineIndex: index,
      progress: Math.random(),
      speed: Math.random() * 0.006 + 0.004,
      size: Math.random() * 2.5 + 2.5,
    }));

    let frame = 0;

    const render = () => {
      frame++;
      // Smooth mouse lerp
      currentMouseX += (targetMouseX - currentMouseX) * 0.05;
      currentMouseY += (targetMouseY - currentMouseY) * 0.05;

      // Dark obsidian background clear
      ctx.fillStyle = '#050508';
      ctx.fillRect(0, 0, width, height);

      // Deep perspective radial dark ambient vignette
      const bgGrad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.5,
        50,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.75
      );
      bgGrad.addColorStop(0, 'rgba(225, 29, 46, 0.06)');
      bgGrad.addColorStop(0.5, 'rgba(10, 10, 15, 0.4)');
      bgGrad.addColorStop(1, 'rgba(3, 3, 5, 0.95)');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.translate(currentMouseX, currentMouseY);

      // 1. Draw interconnected laser lines
      hubPairs.forEach(([i, j]) => {
        const h1 = hubs[i];
        const h2 = hubs[j];
        if (!h1 || !h2) return;

        const lineGrad = ctx.createLinearGradient(h1.x, h1.y, h2.x, h2.y);
        lineGrad.addColorStop(0, 'rgba(225, 29, 46, 0.45)');
        lineGrad.addColorStop(0.5, 'rgba(225, 29, 46, 0.18)');
        lineGrad.addColorStop(1, 'rgba(225, 29, 46, 0.45)');

        ctx.strokeStyle = lineGrad;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(h1.x, h1.y);
        ctx.lineTo(h2.x, h2.y);
        ctx.stroke();

        // Glow pass
        ctx.strokeStyle = 'rgba(225, 29, 46, 0.12)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(h1.x, h1.y);
        ctx.lineTo(h2.x, h2.y);
        ctx.stroke();
      });

      // 2. Draw moving energy pulses on lines
      packets.forEach((p) => {
        p.progress += p.speed;
        if (p.progress > 1) p.progress = 0;

        const pair = hubPairs[p.lineIndex];
        if (!pair) return;
        const h1 = hubs[pair[0]];
        const h2 = hubs[pair[1]];
        if (!h1 || !h2) return;

        const currX = h1.x + (h2.x - h1.x) * p.progress;
        const currY = h1.y + (h2.y - h1.y) * p.progress;

        const pulseGlow = ctx.createRadialGradient(currX, currY, 0, currX, currY, p.size * 3);
        pulseGlow.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
        pulseGlow.addColorStop(0.3, 'rgba(225, 29, 46, 0.85)');
        pulseGlow.addColorStop(1, 'rgba(225, 29, 46, 0)');

        ctx.fillStyle = pulseGlow;
        ctx.beginPath();
        ctx.arc(currX, currY, p.size * 3, 0, Math.PI * 2);
        ctx.fill();
      });

      // 3. Draw starburst hubs with ray spokes & micro-stardust particles
      hubs.forEach((hub) => {
        hub.angle += hub.rotationSpeed;

        // Radiating laser rays
        for (let r = 0; r < hub.rayCount; r++) {
          const rayAngle = hub.angle + (r * (Math.PI * 2)) / hub.rayCount;
          const rayLength = hub.radius * (0.8 + 0.3 * Math.sin(frame * 0.05 + r));
          const rx = hub.x + Math.cos(rayAngle) * rayLength;
          const ry = hub.y + Math.sin(rayAngle) * rayLength;

          ctx.strokeStyle = 'rgba(225, 29, 46, 0.25)';
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(hub.x, hub.y);
          ctx.lineTo(rx, ry);
          ctx.stroke();
        }

        // Stardust cloud
        for (let s = 0; s < 12; s++) {
          const sAngle = hub.angle * 1.5 + (s * (Math.PI * 2)) / 12;
          const sDist = hub.radius * 0.5 + ((s * 7) % (hub.radius * 0.5));
          const sx = hub.x + Math.cos(sAngle) * sDist;
          const sy = hub.y + Math.sin(sAngle) * sDist;

          ctx.fillStyle = 'rgba(255, 200, 200, 0.65)';
          ctx.beginPath();
          ctx.arc(sx, sy, 0.9, 0, Math.PI * 2);
          ctx.fill();
        }

        // Central radiant hub glow
        const hubGrad = ctx.createRadialGradient(hub.x, hub.y, 0, hub.x, hub.y, hub.radius * 1.2);
        hubGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
        hubGrad.addColorStop(0.25, 'rgba(225, 29, 46, 0.85)');
        hubGrad.addColorStop(0.65, 'rgba(225, 29, 46, 0.2)');
        hubGrad.addColorStop(1, 'rgba(225, 29, 46, 0)');

        ctx.fillStyle = hubGrad;
        ctx.beginPath();
        ctx.arc(hub.x, hub.y, hub.radius * 1.2, 0, Math.PI * 2);
        ctx.fill();

        // Core bright center pin
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(hub.x, hub.y, 3.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // 4. Draw floating bokeh particles
      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        const pulse = Math.sin(frame * p.pulseSpeed + p.pulseOffset);
        p.radius = p.baseRadius * (1 + pulse * 0.2);
        p.alpha = p.baseAlpha * (1 + pulse * 0.3);

        const pGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 2);
        pGrad.addColorStop(0, `rgba(255, 220, 220, ${p.alpha})`);
        pGrad.addColorStop(0.4, `rgba(225, 29, 46, ${p.alpha * 0.8})`);
        pGrad.addColorStop(1, 'rgba(225, 29, 46, 0)');

        ctx.fillStyle = pGrad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 2, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
      aria-hidden="true"
    />
  );
};
