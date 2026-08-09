"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { LoginRole } from './AuthShell';
import { mockAuthApi } from '@/lib/auth/mockApi';

const contentVariants = {
  enter: (direction: number) => ({ opacity: 0, x: direction > 0 ? 30 : -30 }),
  center: { opacity: 1, x: 0 },
  exit: (direction: number) => ({ opacity: 0, x: direction > 0 ? -30 : 30 }),
};

export function LoginPanel({ role, onBack }: { role: NonNullable<LoginRole>, onBack: () => void }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setIsLoading(true);
    // Simulate real auth call matching the role
    const res = await mockAuthApi.simulateDiscordOAuth(role);
    setIsLoading(false);
    
    if (res.success) {
      setShowWelcome(true);
      setTimeout(() => {
        router.push('/servers');
      }, 1500);
    }
  };

  return (
    <motion.div 
      variants={contentVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.35, ease: "easeOut" }}
      className="absolute inset-0 flex flex-col justify-center p-12 bg-white"
    >
      <AnimatePresence>
        {showWelcome && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="absolute inset-0 bg-white z-50 flex flex-col items-center justify-center"
          >
            <div className="w-16 h-16 border-4 border-slate-100 border-t-[#E11D2E] rounded-full animate-spin mb-6" />
            <h3 className="text-xl font-bold text-slate-900">Authenticating...</h3>
            <p className="text-slate-500 text-sm mt-2">Preparing your {role} dashboard</p>
          </motion.div>
        )}
      </AnimatePresence>

      <button onClick={onBack} className="text-slate-400 hover:text-slate-800 flex items-center gap-1.5 text-[13px] font-bold mb-8 transition-colors w-fit p-1 -ml-1">
        <ArrowLeft size={16} /> Back to login options
      </button>
      
      <h3 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight capitalize">{role} Login</h3>
      <p className="text-slate-500 text-[14px] mb-8 leading-relaxed">Enter your credentials to continue.</p>
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
        <div className="relative group">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#E11D2E] transition-colors" size={18} />
          <input 
            type="email" 
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email / Username"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#E11D2E]/50 focus:bg-white focus:ring-4 focus:ring-[#E11D2E]/5 transition-all font-medium text-[14px]"
          />
        </div>

        <div className="relative group">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#E11D2E] transition-colors" size={18} />
          <input 
            type={showPassword ? "text" : "password"} 
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-12 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#E11D2E]/50 focus:bg-white focus:ring-4 focus:ring-[#E11D2E]/5 transition-all font-medium text-[14px]"
          />
          <button 
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-md"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <div className="flex justify-end mb-2">
          <button type="button" className="text-[#E11D2E] text-[13px] font-semibold hover:underline">
            Forgot Password?
          </button>
        </div>

        <Button type="submit" isLoading={isLoading} size="lg" className="w-full h-12 rounded-xl text-[14px] bg-slate-900 hover:bg-slate-800 text-white shadow-md hover:shadow-lg">
          {!isLoading && `Login as ${role.charAt(0).toUpperCase() + role.slice(1)}`}
        </Button>
      </form>
    </motion.div>
  );
}
