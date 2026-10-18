"use client";

import React, { forwardRef } from 'react';
import styles from './scrollbar.module.css';

interface CustomScrollbarProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  maxHeight?: string | number;
}

export const CustomScrollbar = forwardRef<HTMLDivElement, CustomScrollbarProps>(
  ({ children, className = '', maxHeight, style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`${styles.redScrollbar} overflow-y-auto overflow-x-hidden ${className}`}
        style={{
          maxHeight: maxHeight !== undefined ? maxHeight : undefined,
          ...style,
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CustomScrollbar.displayName = 'CustomScrollbar';
