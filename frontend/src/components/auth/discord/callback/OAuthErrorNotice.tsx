'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Card } from '@/components/common/containers/Card';
import { Button } from '@/components/common/input/Button';

export interface OAuthErrorNoticeProps {
  message: string;
  onRetry: () => void;
}

export const OAuthErrorNotice: React.FC<OAuthErrorNoticeProps> = ({ message, onRetry }) => {
  return (
    <Card className="w-full max-w-md p-8 text-center">
      <div className="flex flex-col items-center">
        <div className="w-16 h-16 bg-red-500/15 border border-red-500/30 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="text-red-400" size={34} />
        </div>
        <h2 className="text-2xl font-bold text-content-primary tracking-tight mb-2">
          Authentication Error
        </h2>
        <p className="text-red-400 text-sm mb-6">{message}</p>
        <Button type="button" variant="secondary" onClick={onRetry} className="w-full min-h-[44px]">
          Back to Sign In
        </Button>
      </div>
    </Card>
  );
};
