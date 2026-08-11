"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, User, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';

const contentVariants = {
  enter: (direction: number) => ({ opacity: 0, x: direction > 0 ? 30 : -30 }),
  center: { opacity: 1, x: 0 },
  exit: (direction: number) => ({ opacity: 0, x: direction > 0 ? -30 : 30 }),
};

export function LoginPanel({ mode, onBack }: { mode: 'login' | 'register', onBack: () => void }) {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'whitelist' | 'discord'>('email');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // States for end of flow
  const [showWelcome, setShowWelcome] = useState(false);
  const [showRegisterSuccess, setShowRegisterSuccess] = useState(false);
  
  const [direction, setDirection] = useState(1);
  const [isWhitelisted, setIsWhitelisted] = useState<boolean | null>(null);

  const handleEmailSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !password || (mode === 'register' && !username)) return;
    
    setIsLoading(true);
    let res;
    if (mode === 'register') {
      res = await api.submitRegister(email, username, password);
    } else {
      res = await api.submitEmailLogin(email, password);
    }
    setIsLoading(false);
    
    if (res.success) {
      if (mode === 'register') {
        // Skip whitelist check for register
        setDirection(1);
        setStep('discord');
      } else {
        setIsWhitelisted(res.isWhitelisted ?? true);
        setDirection(1);
        setStep('whitelist');
      }
    }
  };

  const handleGoogleSubmit = async () => {
    setIsLoading(true);
    let res;
    if (mode === 'register') {
      res = await api.submitRegister(email, username, password); // just simulating
    } else {
      res = await api.submitGoogleLogin();
    }
    setIsLoading(false);

    if (res.success) {
      if (mode === 'register') {
        setDirection(1);
        setStep('discord');
      } else {
        setIsWhitelisted(res.isWhitelisted ?? true);
        setDirection(1);
        setStep('whitelist');
      }
    }
  };

  const handleDiscordSubmit = async () => {
    setIsLoading(true);
    const res = await api.connectDiscord(mode);
    setIsLoading(false);
    
    if (res.success) {
      if (mode === 'register') {
        setShowRegisterSuccess(true);
      } else {
        setShowWelcome(true);
        setTimeout(() => {
          router.push('/servers');
        }, 1500);
      }
    }
  };

  const handleBack = () => {
    if (step === 'discord') {
      setDirection(-1);
      if (mode === 'register') {
        setStep('email'); // skipped whitelist
      } else {
        setStep('whitelist');
      }
    } else if (step === 'whitelist') {
      setDirection(-1);
      setStep('email');
    } else {
      onBack();
    }
  };

  return (
    <motion.div 
      className="w-full h-full flex-1 flex flex-col justify-center p-6 md:p-10 bg-white relative overflow-hidden"
    >
      <div className="relative z-10 flex flex-col w-full h-full">
      <AnimatePresence mode="wait" custom={direction}>
        {showWelcome && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="absolute inset-0 bg-white/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center"
          >
            <div className="w-16 h-16 border-4 border-slate-100 border-t-[#E11D2E] rounded-full animate-spin mb-6" />
            <h3 className="text-xl font-bold text-slate-900">Authenticating...</h3>
            <p className="text-slate-500 text-sm mt-2">Preparing your dashboard</p>
          </motion.div>
        )}

        {showRegisterSuccess && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="absolute inset-0 bg-white/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6 md:p-10 text-center"
          >
            <div className="w-16 h-16 bg-[#3BA55D]/10 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="text-[#3BA55D] w-10 h-10" />
            </div>
            <h3 className="text-2xl font-extrabold text-slate-900 mb-2">Request Submitted</h3>
            <p className="text-slate-500 text-[14.5px] leading-relaxed max-w-sm mb-8">
              Your request has been submitted to the manager. You will receive an email when your account is approved or disapproved.
            </p>
            <Button 
              type="button" 
              onClick={onBack}
              className="w-full h-11 bg-slate-900 hover:bg-slate-800 !text-white font-semibold shadow-md"
            >
              Back to Main Menu
            </Button>
          </motion.div>
        )}

        {step === 'email' && !showWelcome && !showRegisterSuccess && (
          <motion.div
            key="email"
            custom={direction}
            variants={contentVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.35, ease: "easeOut" }}
            className="flex flex-col w-full h-full justify-center overflow-y-auto pt-10 pb-6 relative"
          >
            <button 
              onClick={handleBack} 
              className="absolute top-0 left-0 text-slate-400 hover:text-slate-800 flex items-center gap-1.5 text-[14px] font-bold transition-colors w-fit p-2 -ml-2"
            >
              <ArrowLeft size={16} strokeWidth={3} /> Back
            </button>

            <h3 className="text-3xl font-extrabold text-slate-900 mb-1 tracking-tight mt-4">
              {mode === 'register' ? 'Request Access' : 'Sign In'}
            </h3>
            <p className="text-slate-500 text-[14px] mb-6 leading-relaxed">
              {mode === 'register' ? 'Apply for a network account with your details.' : 'Use your network email, or continue with Google.'}
            </p>
            
            <Button 
              type="button" 
              onClick={handleGoogleSubmit}
              disabled={isLoading}
              className="w-full h-11 bg-white hover:bg-slate-50 border border-slate-200 !text-slate-700 font-semibold"
              leftIcon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none"><path d="M21.8 12.2c0-.7-.06-1.4-.19-2H12v3.8h5.5a4.7 4.7 0 0 1-2 3.1v2.6h3.3c1.9-1.8 3-4.4 3-7.5Z" fill="#4285F4"/><path d="M12 22c2.7 0 5-.9 6.7-2.4l-3.3-2.6c-.9.6-2.1 1-3.4 1-2.6 0-4.8-1.7-5.6-4.1H3v2.6A10 10 0 0 0 12 22Z" fill="#34A853"/><path d="M6.4 13.9a6 6 0 0 1 0-3.8V7.5H3a10 10 0 0 0 0 9l3.4-2.6Z" fill="#FBBC05"/><path d="M12 6.2c1.5 0 2.8.5 3.8 1.5l2.9-2.9C16.9 3.1 14.6 2 12 2 8.1 2 4.7 4.2 3 7.5l3.4 2.6c.8-2.4 3-4 5.6-4Z" fill="#EA4335"/></svg>}
            >
              Continue with Google
            </Button>

            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-slate-100" />
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">OR</span>
              <div className="flex-1 h-px bg-slate-100" />
            </div>

            <form onSubmit={handleEmailSubmit} className="flex flex-col gap-3 w-full">
              {mode === 'register' && (
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#E11D2E] transition-colors" size={18} />
                  <input 
                    type="text" 
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Desired Username"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#E11D2E]/50 focus:bg-white focus:ring-4 focus:ring-[#E11D2E]/5 transition-all font-medium text-[13.5px]"
                  />
                </div>
              )}

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

              {mode === 'login' && (
                <div className="flex justify-end mb-1">
                  <button type="button" className="text-[#E11D2E] text-[12px] font-bold hover:underline">
                    Forgot Password?
                  </button>
                </div>
              )}
              
              <Button 
                type="submit" 
                isLoading={isLoading} 
                className={`w-full h-11 bg-slate-900 hover:bg-slate-800 !text-white font-semibold shadow-md ${mode === 'register' ? 'mt-2' : 'mt-1'}`}
              >
                {!isLoading && "Continue"}
              </Button>
            </form>
          </motion.div>
        )}

        {step === 'whitelist' && !showWelcome && !showRegisterSuccess && (
          <motion.div
            key="whitelist"
            custom={direction}
            variants={contentVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.35, ease: "easeOut" }}
            className="flex flex-col w-full h-full justify-center pt-10 pb-6 relative"
          >
            <button 
              onClick={handleBack} 
              className="absolute top-0 left-0 text-slate-400 hover:text-slate-800 flex items-center gap-1.5 text-[14px] font-bold transition-colors w-fit p-2 -ml-2"
            >
              <ArrowLeft size={16} strokeWidth={3} /> Back
            </button>
            <h3 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight mt-4">Checking access</h3>
            <p className="text-slate-500 text-[14px] mb-8 leading-relaxed">Verifying your account against the network whitelist.</p>
            
            {isWhitelisted ? (
              <div>
                <div className="flex items-center gap-3 p-4 bg-[#3BA55D]/10 border border-[#3BA55D]/30 rounded-xl mb-6">
                  <div className="w-2 h-2 rounded-full bg-[#3BA55D] shadow-[0_0_8px_#3BA55D]" />
                  <span className="text-[13px] text-[#3BA55D] font-bold">You&apos;re whitelisted — access granted</span>
                </div>
                
                <Button 
                  type="button" 
                  onClick={() => { setDirection(1); setStep('discord'); }}
                  className="w-full h-11 bg-slate-900 hover:bg-slate-800 !text-white font-semibold shadow-md"
                >
                  Continue to Discord
                </Button>
              </div>
            ) : (
              <div>
                <div className="bg-[#A71D1D]/10 border border-[#ED4245]/30 rounded-xl p-5 mb-5">
                  <h2 className="font-bold text-[15px] text-[#FF8789] mb-1.5 tracking-tight">You aren&apos;t whitelisted</h2>
                  <p className="text-[12.5px] text-[#FF8789]/80 font-medium mb-1 uppercase tracking-wider">Access Revoked</p>
                  <p className="text-[12.5px] text-slate-600 leading-relaxed">Your account isn&apos;t on the network whitelist. Ask a network admin to add your credentials, then try again.</p>
                </div>
                
                <Button 
                  type="button" 
                  onClick={handleBack}
                  className="w-full h-11 bg-white hover:bg-slate-50 border border-slate-200 !text-slate-700 font-semibold"
                >
                  Back to sign in
                </Button>
              </div>
            )}
          </motion.div>
        )}

        {step === 'discord' && !showWelcome && !showRegisterSuccess && (
          <motion.div
            key="discord"
            custom={direction}
            variants={contentVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.35, ease: "easeOut" }}
            className="flex flex-col w-full h-full justify-center pt-10 pb-6 relative"
          >
            <button 
              onClick={handleBack} 
              className="absolute top-0 left-0 text-slate-400 hover:text-slate-800 flex items-center gap-1.5 text-[14px] font-bold transition-colors w-fit p-2 -ml-2"
            >
              <ArrowLeft size={16} strokeWidth={3} /> Back
            </button>

            <div className="w-14 h-14 bg-[#5865F2]/10 rounded-2xl flex items-center justify-center mb-6 mt-4">
              <svg className="w-8 h-8 text-[#5865F2]" viewBox="0 0 24 24" fill="currentColor"><path d="M20.3 5.4A17.9 17.9 0 0 0 15.9 4l-.2.4c1.9.5 2.9 1.2 3 1.2a12.9 12.9 0 0 0-11.4 0s1-.8 3.1-1.2L10.2 4a18 18 0 0 0-4.5 1.4S2 10.6 2 17.5c1.9 2.1 4.7 3.4 4.7 3.4l1-1.3a9.6 9.6 0 0 1-2.5-1.3l.6-.4a13 13 0 0 0 12.4 0l.6.4a9.6 9.6 0 0 1-2.5 1.3l1 1.3s2.8-1.3 4.7-3.4c0-6.9-3.7-12.1-3.7-12.1ZM9.3 15.4c-.9 0-1.6-.9-1.6-1.9s.7-1.9 1.6-1.9 1.6.9 1.6 1.9-.7 1.9-1.6 1.9Zm5.4 0c-.9 0-1.6-.9-1.6-1.9s.7-1.9 1.6-1.9 1.6.9 1.6 1.9-.7 1.9-1.6 1.9Z"/></svg>
            </div>
            
            <h3 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Connect Discord</h3>
            <p className="text-slate-500 text-[14px] mb-8 leading-relaxed">
              {mode === 'register' 
                ? 'Link your Discord account to submit your access request.' 
                : 'Link your Discord account to finalize your authorization and load your servers.'}
            </p>
            
            <Button 
              type="button" 
              onClick={handleDiscordSubmit}
              isLoading={isLoading}
              className="w-full h-12 bg-[#5865F2] hover:bg-[#4752C4] !text-white font-bold shadow-[0_4px_14px_rgba(88,101,242,0.4)]"
            >
              {!isLoading && "Connect with Discord OAuth2"}
            </Button>
            
            <p className="text-slate-400 text-xs text-center mt-6">
              This is required by RNG Network security policies.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </motion.div>
  );
}
