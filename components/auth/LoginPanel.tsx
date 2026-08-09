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
  const [step, setStep] = useState<'email' | 'discord'>('email');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [direction, setDirection] = useState(1);

  const handleEmailAuth = async (e: React.FormEvent, isSignUp: boolean = false) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 800)); // mock network delay
    setIsLoading(false);
    
    // Proceed to discord step
    setDirection(1);
    setStep('discord');
  };

  const handleDiscordOAuth = async () => {
    setIsLoading(true);
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
      className="absolute inset-0 flex flex-col justify-center p-10 bg-white overflow-hidden"
    >
      <AnimatePresence mode="wait" custom={direction}>
        {showWelcome && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="absolute inset-0 bg-white z-50 flex flex-col items-center justify-center"
          >
            <div className="w-16 h-16 border-4 border-slate-100 border-t-[#E11D2E] rounded-full animate-spin mb-6" />
            <h3 className="text-xl font-bold text-slate-900">Authenticating...</h3>
            <p className="text-slate-500 text-sm mt-2">Preparing your dashboard</p>
          </motion.div>
        )}

        {step === 'email' && !showWelcome && (
          <motion.div
            key="email"
            custom={direction}
            variants={contentVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.35, ease: "easeOut" }}
            className="flex flex-col w-full h-full justify-center overflow-y-auto pt-2 pb-6"
          >
            <h3 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Sign In</h3>
            <p className="text-slate-500 text-[14px] mb-6 leading-relaxed">Enter your credentials or use Google to continue.</p>
            
            <form onSubmit={(e) => handleEmailAuth(e, false)} className="flex flex-col gap-3 w-full">
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#E11D2E] transition-colors" size={18} />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Network Email"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#E11D2E]/50 focus:bg-white focus:ring-4 focus:ring-[#E11D2E]/5 transition-all font-medium text-[13.5px]"
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-12 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#E11D2E]/50 focus:bg-white focus:ring-4 focus:ring-[#E11D2E]/5 transition-all font-medium text-[13.5px]"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-md"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="flex justify-end mb-1">
                <button type="button" className="text-[#E11D2E] text-[12px] font-bold hover:underline">
                  Forgot Password?
                </button>
              </div>

              <Button type="submit" isLoading={isLoading} className="w-full h-11 rounded-xl text-[13.5px] font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-md mt-1">
                {!isLoading && "Sign In"}
              </Button>
            </form>

            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-slate-100" />
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">OR</span>
              <div className="flex-1 h-px bg-slate-100" />
            </div>

            <Button 
              type="button" 
              onClick={(e) => handleEmailAuth(e, false)}
              disabled={isLoading}
              className="w-full h-11 rounded-xl text-[13.5px] font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none"><path d="M21.8 12.2c0-.7-.06-1.4-.19-2H12v3.8h5.5a4.7 4.7 0 0 1-2 3.1v2.6h3.3c1.9-1.8 3-4.4 3-7.5Z" fill="#4285F4"/><path d="M12 22c2.7 0 5-.9 6.7-2.4l-3.3-2.6c-.9.6-2.1 1-3.4 1-2.6 0-4.8-1.7-5.6-4.1H3v2.6A10 10 0 0 0 12 22Z" fill="#34A853"/><path d="M6.4 13.9a6 6 0 0 1 0-3.8V7.5H3a10 10 0 0 0 0 9l3.4-2.6Z" fill="#FBBC05"/><path d="M12 6.2c1.5 0 2.8.5 3.8 1.5l2.9-2.9C16.9 3.1 14.6 2 12 2 8.1 2 4.7 4.2 3 7.5l3.4 2.6c.8-2.4 3-4 5.6-4Z" fill="#EA4335"/></svg>
              Continue with Google
            </Button>

            <div className="mt-8 text-center mt-auto pb-2">
              <p className="text-slate-500 text-[13px]">
                Don't have an account?{' '}
                <button type="button" className="text-[#E11D2E] font-bold hover:underline transition-all">
                  Request Access
                </button>
              </p>
            </div>
          </motion.div>
        )}

        {step === 'discord' && !showWelcome && (
          <motion.div
            key="discord"
            custom={direction}
            variants={contentVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.35, ease: "easeOut" }}
            className="flex flex-col w-full h-full justify-center pt-2 pb-6"
          >
            <div className="w-14 h-14 bg-[#5865F2]/10 rounded-2xl flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-[#5865F2]" viewBox="0 0 24 24" fill="currentColor"><path d="M20.3 5.4A17.9 17.9 0 0 0 15.9 4l-.2.4c1.9.5 2.9 1.2 3 1.2a12.9 12.9 0 0 0-11.4 0s1-.8 3.1-1.2L10.2 4a18 18 0 0 0-4.5 1.4S2 10.6 2 17.5c1.9 2.1 4.7 3.4 4.7 3.4l1-1.3a9.6 9.6 0 0 1-2.5-1.3l.6-.4a13 13 0 0 0 12.4 0l.6.4a9.6 9.6 0 0 1-2.5 1.3l1 1.3s2.8-1.3 4.7-3.4c0-6.9-3.7-12.1-3.7-12.1ZM9.3 15.4c-.9 0-1.6-.9-1.6-1.9s.7-1.9 1.6-1.9 1.6.9 1.6 1.9-.7 1.9-1.6 1.9Zm5.4 0c-.9 0-1.6-.9-1.6-1.9s.7-1.9 1.6-1.9 1.6.9 1.6 1.9-.7 1.9-1.6 1.9Z"/></svg>
            </div>
            
            <h3 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Connect Discord</h3>
            <p className="text-slate-500 text-[14px] mb-8 leading-relaxed">Link your Discord account to finalize your authorization and load your servers.</p>
            
            <Button 
              type="button" 
              onClick={handleDiscordOAuth}
              isLoading={isLoading}
              className="w-full h-12 rounded-xl text-[14px] font-bold bg-[#5865F2] hover:bg-[#4752C4] text-white shadow-[0_4px_14px_rgba(88,101,242,0.4)] transition-all flex items-center justify-center gap-2"
            >
              {!isLoading && "Connect with Discord OAuth2"}
            </Button>
            
            <p className="text-slate-400 text-xs text-center mt-6">
              This is required by RNG Network security policies.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
