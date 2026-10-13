'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { RotateCcw } from 'lucide-react';
import { CyberWebCanvas } from './CyberWebCanvas';
import { CyberHexNode } from './CyberHexNode';
import { CYBER_NODES, type CyberNode } from './cyberWebData';

const STORAGE_KEY = 'rng_cyber_web_positions';

export const CyberWebCoordinator: React.FC = () => {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Load custom node positions from localStorage if available
  const [nodes, setNodes] = useState<CyberNode[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as Record<string, { x: number; y: number }>;
          return CYBER_NODES.map((n) => ({
            ...n,
            x: typeof parsed[n.id]?.x === 'number' ? parsed[n.id].x : n.x,
            y: typeof parsed[n.id]?.y === 'number' ? parsed[n.id].y : n.y,
          }));
        }
      } catch {
        // Fall back to default constellation positions
      }
    }
    return CYBER_NODES;
  });

  const [hasCustomPositions, setHasCustomPositions] = useState(false);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setHasCustomPositions(Boolean(localStorage.getItem(STORAGE_KEY)));
    }
  }, [nodes]);

  const handleNavigate = (route: string) => {
    router.push(route);
  };

  const handleResetLayout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    setNodes(CYBER_NODES);
    setHasCustomPositions(false);
  };

  const handleRightClickStart = useCallback((_e: React.MouseEvent, nodeId: string) => {
    setDraggingNodeId(nodeId);
  }, []);

  // Window-level mouse movement and mouse up listeners for smooth right-click dragging
  useEffect(() => {
    if (!draggingNodeId) return;

    const handleMouseMove = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const rawX = ((e.clientX - rect.left) / rect.width) * 100;
      const rawY = ((e.clientY - rect.top) / rect.height) * 100;

      // Keep nodes within comfortable bounds (5% to 95% horizontal, 10% to 88% vertical)
      const clampedX = Math.round(Math.max(5, Math.min(95, rawX)) * 10) / 10;
      const clampedY = Math.round(Math.max(10, Math.min(88, rawY)) * 10) / 10;

      setNodes((prev) =>
        prev.map((node) =>
          node.id === draggingNodeId ? { ...node, x: clampedX, y: clampedY } : node
        )
      );
    };

    const handleMouseUp = (e: MouseEvent) => {
      // Finalize drag on right mouse button release (or any button release)
      if (e.button === 2 || e.button === 0) {
        setDraggingNodeId(null);
        // Persist new layout to localStorage
        setNodes((currentNodes) => {
          if (typeof window !== 'undefined') {
            const posMap: Record<string, { x: number; y: number }> = {};
            currentNodes.forEach((n) => {
              posMap[n.id] = { x: n.x, y: n.y };
            });
            localStorage.setItem(STORAGE_KEY, JSON.stringify(posMap));
            setHasCustomPositions(true);
          }
          return currentNodes;
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingNodeId]);

  return (
    <div
      ref={containerRef}
      onContextMenu={(e) => e.preventDefault()}
      className="relative w-full min-h-[calc(100vh-5.5rem)] rounded-apple-2xl overflow-hidden border border-white/[0.06] bg-[#030305] select-none"
    >
      {/* 3D Cybernetic Neural Canvas with Laser Vectors, Photons & Starburst Filaments */}
      <CyberWebCanvas nodes={nodes} />

      {/* Cyber Grid Subtle Background Texture */}
      <div
        className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:5rem_5rem] pointer-events-none z-0"
        aria-hidden="true"
      />

      {/* Extreme Top-Right Telemetry & Reset Controls Anchor */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-30 flex items-center gap-2.5 pointer-events-auto">
        {hasCustomPositions && (
          <button
            type="button"
            onClick={handleResetLayout}
            className="px-2.5 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white border border-white/10 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer backdrop-blur-md"
            title="Reset nodes to default constellation coordinates"
          >
            <RotateCcw size={12} />
            <span>Reset Layout</span>
          </button>
        )}

        <div className="px-3 py-1.5 rounded-full bg-[#E11D2E]/10 border border-[#E11D2E]/30 text-[#E11D2E] text-xs font-mono font-bold flex items-center gap-2 shadow-[0_0_12px_rgba(225,29,46,0.3)] backdrop-blur-md">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>4 / 9 SYSTEMS LIVE</span>
        </div>
      </div>

      {/* Spatial Constellation Field - Floating Hexagonal Cyber Vertices */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <div className="relative w-full h-full pointer-events-auto">
          {nodes.map((node) => (
            <CyberHexNode
              key={node.id}
              node={node}
              isDragging={node.id === draggingNodeId}
              onNavigate={handleNavigate}
              onRightClickStart={handleRightClickStart}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
