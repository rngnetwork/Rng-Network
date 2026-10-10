'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { MotionConfig } from 'framer-motion';
import { Toast, ToastType } from './Toast';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

export interface ToastContextType {
  toast: (message: Omit<ToastMessage, 'id'>) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    setToasts((prev) => [...prev, { ...message, id }]);
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <ToastContext.Provider value={{ toast, dismiss }}>
        {children}
        <div
          className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
          aria-live="polite"
        >
          {toasts.map((item) => (
            <div key={item.id} className="pointer-events-auto">
              <Toast
                id={item.id}
                type={item.type}
                title={item.title}
                description={item.description}
                duration={item.duration}
                onDismiss={dismiss}
              />
            </div>
          ))}
        </div>
      </ToastContext.Provider>
    </MotionConfig>
  );
};

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
