'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import type { MonacoPayloadEditorProps } from './MonacoPayloadEditor';

export const MonacoDiscordJsonEditor = dynamic<MonacoPayloadEditorProps>(
  () => import('./MonacoPayloadEditor').then((m) => m.MonacoPayloadEditor),
  {
    ssr: false,
    loading: () => (
      <div className="h-[500px] w-full bg-zinc-900/80 animate-pulse rounded-apple-xl border border-white/[0.08]" />
    ),
  }
);
