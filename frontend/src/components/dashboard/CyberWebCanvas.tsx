'use client';

import React, { useEffect, useRef } from 'react';
import { CYBER_NODES, CYBER_LINKS, type CyberNode } from './cyberWebData';

export interface CyberWebCanvasProps {
  nodes?: CyberNode[];
}

interface BokehParticle {
  x: number;
  y: number;
  radius: number;
  baseRadius: number;
  alpha: number;
  baseAlpha: number;
  speedX: number;
  speedY: number;
  pulseSpeed: number;
  pulseOffset: number;
}

interface PhotonPacket {
  linkIndex: number;
  progress: number;
  speed: number;
  size: number;
}

export const CyberWebCanvas: React.FC<CyberWebCanvasProps> = ({ nodes = CYBER_NODES }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const nodesRef = useRef<CyberNode[]>(nodes);

  // Keep live reference to current node positions so the render loop recalculates in real-time
  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

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
      targetMouseX = ((e.clientX - rect.left) / width - 0.5) * 35;
      targetMouseY = ((e.clientY - rect.top) / height - 0.5) * 25;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // 1. Initialize floating bokeh depth particles
    const particles: BokehParticle[] = Array.from({ length: 80 }, () => {
      const baseRadius = Math.random() * 4.5 + 1.2;
      const baseAlpha = Math.random() * 0.45 + 0.12;
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        radius: baseRadius,
        baseRadius,
        alpha: baseAlpha,
        baseAlpha,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: (Math.random() - 0.5) * 0.2,
        pulseSpeed: Math.random() * 0.02 + 0.01,
        pulseOffset: Math.random() * Math.PI * 2,
      };
    });

    // 2. Active links photon packets
    const activeLinks = CYBER_LINKS.filter((l) => l.status === 'active');
    const photons: PhotonPacket[] = activeLinks.map((_, index) => ({
      linkIndex: index,
      progress: Math.random(),
      speed: Math.random() * 0.005 + 0.004,
      size: Math.random() * 2.2 + 2.5,
    }));

    // Active nodes mapping for starbursts
    const starburstAngles = [0, 0, 0, 0];

    let frame = 0;

    const render = () => {
      frame++;
      // Smooth mouse lerp
      currentMouseX += (targetMouseX - currentMouseX) * 0.04;
      currentMouseY += (targetMouseY - currentMouseY) * 0.04;

      // Dark pitch-black void clear
      ctx.fillStyle = '#030305';
      ctx.fillRect(0, 0, width, height);

      // Deep perspective vignette
      const bgGrad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.5,
        60,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.8
      );
      bgGrad.addColorStop(0, 'rgba(225, 29, 46, 0.05)');
      bgGrad.addColorStop(0.5, 'rgba(5, 5, 8, 0.3)');
      bgGrad.addColorStop(1, 'rgba(2, 2, 4, 0.95)');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.translate(currentMouseX, currentMouseY);

      // Read live node coordinates from nodesRef
      const liveNodes = nodesRef.current;
      const nodePos = new Map<string, { x: number; y: number; active: boolean }>();
      liveNodes.forEach((n) => {
        nodePos.set(n.id, {
          x: (n.x / 100) * width,
          y: (n.y / 100) * height,
          active: n.status === 'active',
        });
      });

      // 1. Draw Laser Vector Lines between nodes
      CYBER_LINKS.forEach((link) => {
        const from = nodePos.get(link.from);
        const to = nodePos.get(link.to);
        if (!from || !to) return;

        const isLinkActive = link.status === 'active' && from.active && to.active;

        if (isLinkActive) {
          // Outer Glow Beam
          ctx.strokeStyle = 'rgba(225, 29, 46, 0.22)';
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.moveTo(from.x, from.y);
          ctx.lineTo(to.x, to.y);
          ctx.stroke();

          // Intense Core Laser
          const lineGrad = ctx.createLinearGradient(from.x, from.y, to.x, to.y);
          lineGrad.addColorStop(0, 'rgba(225, 29, 46, 0.85)');
          lineGrad.addColorStop(0.5, 'rgba(255, 60, 80, 0.5)');
          lineGrad.addColorStop(1, 'rgba(225, 29, 46, 0.85)');

          ctx.strokeStyle = lineGrad;
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(from.x, from.y);
          ctx.lineTo(to.x, to.y);
          ctx.stroke();
        } else {
          // Inactive Subtle Trace
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(from.x, from.y);
          ctx.lineTo(to.x, to.y);
          ctx.stroke();
        }
      });

      // 2. Draw animated photon energy packets on active links
      photons.forEach((p) => {
        p.progress += p.speed;
        if (p.progress > 1) p.progress = 0;

        const link = activeLinks[p.linkIndex];
        if (!link) return;

        const from = nodePos.get(link.from);
        const to = nodePos.get(link.to);
        if (!from || !to || !from.active || !to.active) return;

        const currX = from.x + (to.x - from.x) * p.progress;
        const currY = from.y + (to.y - from.y) * p.progress;

        const photonGlow = ctx.createRadialGradient(currX, currY, 0, currX, currY, p.size * 3.5);
        photonGlow.addColorStop(0, 'rgba(255, 255, 255, 0.98)');
        photonGlow.addColorStop(0.35, 'rgba(225, 29, 46, 0.85)');
        photonGlow.addColorStop(1, 'rgba(225, 29, 46, 0)');

        ctx.fillStyle = photonGlow;
        ctx.beginPath();
        ctx.arc(currX, currY, p.size * 3.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // 3. Draw starburst filament spokes and stardust around active nodes
      const liveActiveNodes = liveNodes.filter((n) => n.status === 'active');
      liveActiveNodes.forEach((node, idx) => {
        const pos = nodePos.get(node.id);
        if (!pos) return;

        starburstAngles[idx] = (starburstAngles[idx] || 0) + 0.002;
        const currentAngle = starburstAngles[idx];
        const rayCount = 18;
        const rayRadius = 55;

        // Radiating filament rays
        for (let r = 0; r < rayCount; r++) {
          const rayAngle = currentAngle + (r * (Math.PI * 2)) / rayCount;
          const rayLength = rayRadius * (0.8 + 0.3 * Math.sin(frame * 0.04 + r));
          const rx = pos.x + Math.cos(rayAngle) * rayLength;
          const ry = pos.y + Math.sin(rayAngle) * rayLength;

          ctx.strokeStyle = 'rgba(225, 29, 46, 0.3)';
          ctx.lineWidth = 0.9;
          ctx.beginPath();
          ctx.moveTo(pos.x, pos.y);
          ctx.lineTo(rx, ry);
          ctx.stroke();
        }

        // Orbiting stardust micro-particles
        for (let s = 0; s < 14; s++) {
          const sAngle = currentAngle * 1.6 + (s * (Math.PI * 2)) / 14;
          const sDist = rayRadius * 0.4 + ((s * 9) % (rayRadius * 0.5));
          const sx = pos.x + Math.cos(sAngle) * sDist;
          const sy = pos.y + Math.sin(sAngle) * sDist;

          ctx.fillStyle = 'rgba(255, 220, 220, 0.75)';
          ctx.beginPath();
          ctx.arc(sx, sy, 1, 0, Math.PI * 2);
          ctx.fill();
        }

        // Central vibrant radial halo
        const haloGrad = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, rayRadius * 1.1);
        haloGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        haloGrad.addColorStop(0.25, 'rgba(225, 29, 46, 0.7)');
        haloGrad.addColorStop(0.65, 'rgba(225, 29, 46, 0.15)');
        haloGrad.addColorStop(1, 'rgba(225, 29, 46, 0)');

        ctx.fillStyle = haloGrad;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, rayRadius * 1.1, 0, Math.PI * 2);
        ctx.fill();
      });

      // 4. Draw drifting 3D bokeh particles
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
        pGrad.addColorStop(0, `rgba(255, 230, 230, ${p.alpha})`);
        pGrad.addColorStop(0.4, `rgba(225, 29, 46, ${p.alpha * 0.75})`);
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
