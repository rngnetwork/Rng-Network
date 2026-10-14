'use client';

import React from 'react';
import { Activity } from 'lucide-react';

export const ServerAnalyticsCoordinator: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="w-16 h-16 rounded-apple-xl bg-brand-red/10 border border-brand-red/20 flex items-center justify-center mb-4 shadow-crimson-glow">
        <Activity size={32} className="text-brand-red" />
      </div>
      <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">
        Analytics Engine
      </h3>
      <p className="text-xs md:text-sm text-zinc-400 mt-1 max-w-sm">
        Coming in next feature release.
      </p>
    </div>
  );
};
