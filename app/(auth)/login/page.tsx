"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ShieldAlert, ShieldCheck, Mail, ArrowRight, Loader2, ArrowLeft } from 'lucide-react';
import { mockAuthApi } from '../../../lib/auth/mockApi';

type Role = 'staff' | 'manager' | 'owner' | null;
type AuthStep = 'select' | 'email' | 'oauth' | 'welcome' | 'denied';

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<Role>(null);
  const [step, setStep] = useState<AuthStep>('select');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    setStep('email');
  };

  const handleEmailCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsLoading(true);
    // API Call: GET /staff/check-email
    const res = await mockAuthApi.checkEmail(email);
    setIsLoading(false);

    if (res.success) {
      setStep('oauth');
    } else {
      setStep('denied');
    }
  };

  const handleDiscordOAuth = async () => {
    setIsLoading(true);
    // API Call: Backend redirect to Discord OAuth
    const res = await mockAuthApi.simulateDiscordOAuth(selectedRole || 'staff');
    setIsLoading(false);
    
    if (res.success && res.data?.user?.whitelisted) {
      setUserData(res.data.user);
      setStep('welcome');
      // In a real app, we would redirect to /dashboard here after the animation
    } else {
      setStep('denied');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#090909] relative overflow-hidden font-sans">
      {/* Cinematic Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#E11D2E]/10 via-[#090909]/0 to-[#090909]/0 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-[#E11D2E]/5 via-[#090909]/0 to-[#090909]/0 pointer-events-none" />
      
      {/* The Main Authentication Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`w-[1100px] h-[650px] bg-[#111111]/80 backdrop-blur-2xl border border-white/5 rounded-3xl shadow-[0_30px_100px_-20px_rgba(225,29,46,0.15)] flex overflow-hidden relative z-10 transition-colors duration-500 ${step !== 'select' ? 'flex-row-reverse' : 'flex-row'}`}
      >
        {/* Left Side: Role Selection */}
        <motion.div layout transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className={`w-1/2 p-14 flex flex-col bg-[#151515]/50 z-20 ${step !== 'select' ? 'border-l border-white/5' : 'border-r border-white/5'}`}>
          <div className="flex items-center gap-4 mb-16">
            <img src="/visuals/LOGO_FOR_STAFFS.png" alt="RNG Logo" className="w-12 h-12 object-contain" />
            <h2 className="text-xl font-bold tracking-widest uppercase text-white font-display">RNG Network</h2>
          </div>

          <div className="mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">Welcome to <br/>RNG Management</h1>
            <p className="text-[#A0A0A0] text-sm leading-relaxed max-w-sm">
              Manage your Discord infrastructure securely through our enterprise dashboard. Select your authorization level to proceed.
            </p>
          </div>

          <div className="flex flex-col gap-4 mt-auto">
            <RoleButton 
              title="Login as Staff" 
              icon={<Shield size={20} />} 
              isActive={selectedRole === 'staff'} 
              onClick={() => handleRoleSelect('staff')} 
            />
            <RoleButton 
              title="Login as Manager" 
              icon={<ShieldCheck size={20} />} 
              isActive={selectedRole === 'manager'} 
              onClick={() => handleRoleSelect('manager')} 
            />
            <RoleButton 
              title="Login as Owner" 
              icon={<ShieldAlert size={20} />} 
              isActive={selectedRole === 'owner'} 
              onClick={() => handleRoleSelect('owner')} 
            />
          </div>
        </motion.div>

        {/* Right Side: Dynamic Content */}
        <motion.div layout transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="w-1/2 relative bg-[#111111] z-10">
          <AnimatePresence mode="wait">
            
            {/* Step: Select Role */}
            {step === 'select' && (
              <motion.div 
                key="select"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0 flex flex-col items-center justify-center p-14 text-center"
              >
                <div className="w-48 h-48 mb-8 opacity-20 relative">
                   <div className="absolute inset-0 bg-[#E11D2E] blur-[100px] rounded-full" />
                   <Shield className="w-full h-full text-white relative z-10" />
                </div>
                <h3 className="text-2xl font-semibold text-white mb-3">Secure Enterprise Dashboard</h3>
                <p className="text-[#A0A0A0] text-sm">Please choose a role from the left to continue.</p>
              </motion.div>
            )}

            {/* Step: Email Verification */}
            {step === 'email' && (
              <motion.div 
                key="email"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0 flex flex-col justify-center p-14"
              >
                <button onClick={() => setStep('select')} className="text-[#A0A0A0] hover:text-white flex items-center gap-2 text-sm mb-12 w-fit transition-colors">
                  <ArrowLeft size={16} /> Back
                </button>
                <h3 className="text-3xl font-bold text-white mb-3">Email Verification</h3>
                <p className="text-[#A0A0A0] text-sm mb-8">Enter your registered network email to verify your {selectedRole} status.</p>
                
                <form onSubmit={handleEmailCheck} className="flex flex-col gap-6">
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A0A0A0]" size={20} />
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@rngnetwork.com"
                      className="w-full bg-[#151515] border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-[#A0A0A0] focus:outline-none focus:border-[#E11D2E] transition-colors"
                    />
                  </div>
                  <button 
                    disabled={isLoading}
                    type="submit" 
                    className="w-full bg-[#E11D2E] hover:bg-[#FF3B4D] text-white font-semibold rounded-xl py-4 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="animate-spin" /> : 'Continue'} 
                    {!isLoading && <ArrowRight size={18} />}
                  </button>
                </form>
              </motion.div>
            )}

            {/* Step: Discord OAuth */}
            {step === 'oauth' && (
              <motion.div 
                key="oauth"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0 flex flex-col justify-center p-14"
              >
                 <button onClick={() => setStep('email')} className="text-[#A0A0A0] hover:text-white flex items-center gap-2 text-sm mb-12 w-fit transition-colors">
                  <ArrowLeft size={16} /> Back
                </button>
                <h3 className="text-3xl font-bold text-white mb-3">Link Discord</h3>
                <p className="text-[#A0A0A0] text-sm mb-10">Connect your Discord account to finalize your authorization and load your accessible servers.</p>
                
                <button 
                  onClick={handleDiscordOAuth}
                  disabled={isLoading}
                  className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold rounded-xl py-4 flex items-center justify-center gap-3 transition-all shadow-[0_10px_30px_-10px_rgba(88,101,242,0.5)] disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="animate-spin" /> : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M20.3 5.4A17.9 17.9 0 0 0 15.9 4l-.2.4c1.9.5 2.9 1.2 3 1.2a12.9 12.9 0 0 0-11.4 0s1-.8 3.1-1.2L10.2 4a18 18 0 0 0-4.5 1.4S2 10.6 2 17.5c1.9 2.1 4.7 3.4 4.7 3.4l1-1.3a9.6 9.6 0 0 1-2.5-1.3l.6-.4a13 13 0 0 0 12.4 0l.6.4a9.6 9.6 0 0 1-2.5 1.3l1 1.3s2.8-1.3 4.7-3.4c0-6.9-3.7-12.1-3.7-12.1ZM9.3 15.4c-.9 0-1.6-.9-1.6-1.9s.7-1.9 1.6-1.9 1.6.9 1.6 1.9-.7 1.9-1.6 1.9Zm5.4 0c-.9 0-1.6-.9-1.6-1.9s.7-1.9 1.6-1.9 1.6.9 1.6 1.9-.7 1.9-1.6 1.9Z"/></svg>
                  )}
                  Continue with Discord
                </button>
              </motion.div>
            )}

            {/* Step: Access Denied */}
            {step === 'denied' && (
              <motion.div 
                key="denied"
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0 flex flex-col justify-center p-14 bg-[#1A0505]"
              >
                <div className="w-16 h-16 bg-[#E11D2E]/20 rounded-2xl flex items-center justify-center mb-6 border border-[#E11D2E]/30">
                  <ShieldAlert className="text-[#E11D2E]" size={32} />
                </div>
                <h3 className="text-3xl font-bold text-[#FF3B4D] mb-3">Access Denied</h3>
                <p className="text-[#A0A0A0] text-sm leading-relaxed mb-8">
                  Your account has not been approved by management or is not found on the whitelist for the <strong>{selectedRole}</strong> role.
                  <br/><br/>
                  Contact an administrator if you believe this is an error.
                </p>
                <button 
                  onClick={() => setStep('select')}
                  className="w-fit border border-white/10 hover:bg-white/5 text-white font-medium rounded-lg px-6 py-3 transition-colors"
                >
                  Return to Start
                </button>
              </motion.div>
            )}

            {/* Step: Welcome Animation */}
            {step === 'welcome' && userData && (
              <motion.div 
                key="welcome"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
                className="absolute inset-0 flex flex-col items-center justify-center p-14 text-center bg-[#E11D2E]"
              >
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3, duration: 0.6 }}
                  className="mb-6 relative"
                >
                  <img src={userData.avatar} alt="Avatar" className="w-24 h-24 rounded-full border-4 border-white shadow-2xl" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 rounded-full border-4 border-[#E11D2E]" />
                </motion.div>
                
                <motion.h3 
                  initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5, duration: 0.6 }}
                  className="text-3xl font-bold text-white mb-2"
                >
                  Welcome back,
                </motion.h3>
                <motion.p 
                  initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6, duration: 0.6 }}
                  className="text-white/80 text-lg mb-8"
                >
                  {userData.username}
                </motion.p>

                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
                  className="flex flex-col items-center gap-3"
                >
                  <Loader2 className="animate-spin text-white w-6 h-6" />
                  <span className="text-white/70 text-sm font-medium tracking-wide">Checking permissions...</span>
                </motion.div>
              </motion.div>
            )}

          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  );
}

// Subcomponent for the Role Selection buttons
function RoleButton({ title, icon, isActive, onClick }: { title: string, icon: React.ReactNode, isActive: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`group relative w-full flex items-center gap-4 p-5 rounded-2xl transition-all duration-300 border ${
        isActive 
          ? 'bg-[#E11D2E]/10 border-[#E11D2E]/50 shadow-[0_0_20px_-5px_rgba(225,29,46,0.2)]' 
          : 'bg-[#111111] border-white/5 hover:border-white/15 hover:bg-[#151515]'
      }`}
    >
      <div className={`flex items-center justify-center w-10 h-10 rounded-xl transition-colors ${
        isActive ? 'bg-[#E11D2E] text-white' : 'bg-white/5 text-[#A0A0A0] group-hover:text-white group-hover:bg-white/10'
      }`}>
        {icon}
      </div>
      <span className={`font-semibold text-lg transition-colors ${
        isActive ? 'text-white' : 'text-[#A0A0A0] group-hover:text-white'
      }`}>
        {title}
      </span>
      {isActive && (
        <motion.div layoutId="active-indicator" className="absolute right-5 w-2 h-2 rounded-full bg-[#E11D2E]" />
      )}
    </button>
  );
}
