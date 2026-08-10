"use client";

import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'discord' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = "relative flex items-center justify-center gap-2 font-semibold transition-all overflow-hidden outline-none";
  
  const variants = {
    primary: "bg-[#E11D2E] hover:bg-[#FF3B4D] text-white shadow-[0_0_20px_rgba(225,29,46,0.3)] hover:shadow-[0_0_30px_rgba(255,59,77,0.5)]",
    secondary: "bg-[#151515] hover:bg-[#1A1A1A] text-white border border-white/10 hover:border-white/20",
    discord: "bg-[#5865F2] hover:bg-[#4752C4] text-white shadow-[0_10px_30px_-10px_rgba(88,101,242,0.5)]",
    outline: "bg-transparent border border-white/10 hover:border-white/20 hover:bg-white/5 text-white",
    ghost: "bg-transparent hover:bg-white/5 text-[#A0A0A0] hover:text-white"
  };

  const sizes = {
    sm: "py-2 px-4 text-sm rounded-lg",
    md: "py-3 px-6 text-base rounded-xl",
    lg: "py-4 px-8 text-lg rounded-xl"
  };

  const isDisabled = disabled || isLoading;

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-[0.98]'} ${className}`}
      disabled={isDisabled}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <>
          {leftIcon && <span className="flex items-center justify-center">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="flex items-center justify-center">{rightIcon}</span>}
        </>
      )}
    </button>
  );
}
