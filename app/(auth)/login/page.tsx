"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ShieldAlert, ShieldCheck, Mail, ArrowRight, ArrowLeft, User, Lock } from 'lucide-react';
import { mockAuthApi } from '../../../lib/auth/mockApi';
import { Button } from '@/components/ui/Button';

type Role = 'staff' | 'manager' | 'owner' | null;
type AuthStep = 'select' | 'email' | 'register' | 'oauth' | 'welcome' | 'denied';

const BackgroundEffects = () => {
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; size: number; duration: number }[]>([]);

  useEffect(() => {
    // Generate random particles only on client to avoid hydration mismatch
    const generated = Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 1,
      duration: Math.random() * 20 + 10,
    }));
    setParticles(generated);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Fog/Glow */}
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#E11D2E] opacity-[0.04] blur-[120px] rounded-full" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#E11D2E] opacity-[0.03] blur-[150px] rounded-full" />
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
      <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,0.9)]" />
      
      {/* Embers */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute bg-[#E11D2E] rounded-full"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
            boxShadow: '0 0 10px 2px rgba(225, 29, 46, 0.3)',
          }}
          animate={{
            y: ['0%', '-1000%'],
            opacity: [0, 0.8, 0],
            x: p.x % 2 === 0 ? ['0%', '50%'] : ['0%', '-50%']
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: "linear",
            delay: p.id * 0.5,
          }}
        />
      ))}
    </div>
  );
};

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<Role>(null);
  const [step, setStep] = useState<AuthStep>('select');
  const [email, setEmail] = useState('');
  
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    setStep('email');
  };

  const handleEmailCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setIsLoading(false);

    if (email.includes('new')) {
      setStep('register');
    } else {
      setStep('oauth');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) return;
    
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setIsLoading(false);
    
    setStep('oauth');
  };

  const handleDiscordOAuth = async () => {
    setIsLoading(true);
    const res = await mockAuthApi.simulateDiscordOAuth(selectedRole || 'staff');
    setIsLoading(false);
    
    if (res.success && res.data?.user?.whitelisted) {
      setUserData(res.data.user);
      setIsTransitioning(true);
      setTimeout(() => setStep('welcome'), 800);
    } else {
      setStep('denied');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#090909] relative overflow-hidden font-sans">
      <BackgroundEffects />
      
      <AnimatePresence>
        {!isTransitioning && (
          <motion.div 
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className={`w-[1100px] h-[650px] bg-[#111111]/80 backdrop-blur-2xl border border-white/5 rounded-[2rem] shadow-[0_30px_100px_-20px_rgba(225,29,46,0.15)] flex overflow-hidden relative z-10 transition-colors duration-500`}
          >
            <div className="w-1/2 p-14 flex flex-col bg-[#151515]/50 z-20 border-r border-white/5 relative">
              <div className="flex items-center gap-4 mb-14">
                <img src="/visuals/LOGO_FOR_STAFFS.png" alt="RNG Logo" className="w-12 h-12 object-contain drop-shadow-[0_0_15px_rgba(225,29,46,0.4)]" />
                <h2 className="text-xl font-bold tracking-widest uppercase text-white font-display">RNG Network</h2>
              </div>

              <div className="mb-10">
                <h1 className="text-4xl font-bold text-white mb-4 leading-tight tracking-tight">Welcome to <br/>RNG Management</h1>
                <p className="text-[#A0A0A0] text-sm leading-relaxed max-w-[280px]">
                  Manage your Discord infrastructure securely through our enterprise dashboard. Select your authorization level to proceed.
                </p>
              </div>

              <div className="flex flex-col gap-3 mt-auto">
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
            </div>

            <div className="w-1/2 relative bg-transparent z-10">
              <AnimatePresence mode="wait">
                
                {step === 'select' && (
                  <motion.div 
                    key="select"
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute inset-0 flex flex-col items-center justify-center p-14 text-center"
                  >
                    <div className="w-48 h-48 mb-8 opacity-20 relative flex items-center justify-center">
                       <div className="absolute inset-0 bg-[#E11D2E] blur-[80px] rounded-full" />
                       <Shield className="w-32 h-32 text-white relative z-10" strokeWidth={1} />
                    </div>
                    <h3 className="text-2xl font-semibold text-white mb-3">Secure Enterprise Dashboard</h3>
                    <p className="text-[#A0A0A0] text-sm max-w-[250px]">Please choose a role from the left to continue.</p>
                  </motion.div>
                )}

                {step === 'email' && (
                  <motion.div 
                    key="email"
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute inset-0 flex flex-col justify-center p-14"
                  >
                    <Button variant="ghost" size="sm" onClick={() => { setStep('select'); setSelectedRole(null); }} className="w-fit mb-12 -ml-4">
                      <ArrowLeft size={16} /> Back
                    </Button>
                    <h3 className="text-3xl font-bold text-white mb-3 tracking-tight">Email Verification</h3>
                    <p className="text-[#A0A0A0] text-sm mb-8 leading-relaxed">Enter your registered network email to verify your <strong className="text-white capitalize">{selectedRole}</strong> status. (Type 'new' to trigger registration flow)</p>
                    
                    <form onSubmit={handleEmailCheck} className="flex flex-col gap-5">
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A0A0A0]" size={20} />
                        <input 
                          type="email" 
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="email@rngnetwork.com"
                          className="w-full bg-[#151515] border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-[#555] focus:outline-none focus:border-[#E11D2E] focus:bg-[#1A1A1A] transition-all"
                        />
                      </div>
                      <Button 
                        type="submit" 
                        isLoading={isLoading} 
                        size="lg"
                        rightIcon={!isLoading ? <ArrowRight size={18} /> : undefined}
                      >
                        Continue
                      </Button>
                    </form>
                  </motion.div>
                )}

                {step === 'register' && (
                  <motion.div 
                    key="register"
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute inset-0 flex flex-col justify-center p-14"
                  >
                    <Button variant="ghost" size="sm" onClick={() => setStep('email')} className="w-fit mb-8 -ml-4">
                      <ArrowLeft size={16} /> Back
                    </Button>
                    <h3 className="text-3xl font-bold text-white mb-2 tracking-tight">Register Account</h3>
                    <p className="text-[#A0A0A0] text-sm mb-6">Your email was not found. Please create an account.</p>
                    
                    <form onSubmit={handleRegister} className="flex flex-col gap-4">
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A0A0A0]" size={18} />
                        <input 
                          type="text" required placeholder="Full Name" value={fullName} onChange={e => setFullName(e.target.value)}
                          className="w-full bg-[#151515] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder:text-[#555] focus:outline-none focus:border-[#E11D2E] transition-all"
                        />
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A0A0A0]" size={18} />
                        <input 
                          type="password" required placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
                          className="w-full bg-[#151515] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder:text-[#555] focus:outline-none focus:border-[#E11D2E] transition-all"
                        />
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A0A0A0]" size={18} />
                        <input 
                          type="password" required placeholder="Confirm Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                          className="w-full bg-[#151515] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder:text-[#555] focus:outline-none focus:border-[#E11D2E] transition-all"
                        />
                      </div>
                      <Button type="submit" isLoading={isLoading} className="mt-2 w-full">
                        Create Account
                      </Button>
                    </form>
                  </motion.div>
                )}

                {step === 'oauth' && (
                  <motion.div 
                    key="oauth"
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute inset-0 flex flex-col justify-center p-14"
                  >
                     <Button variant="ghost" size="sm" onClick={() => setStep('email')} className="w-fit mb-12 -ml-4">
                      <ArrowLeft size={16} /> Back
                    </Button>
                    <h3 className="text-3xl font-bold text-white mb-3 tracking-tight">Link Discord</h3>
                    <p className="text-[#A0A0A0] text-sm mb-10 leading-relaxed">Connect your Discord account to finalize your authorization and load your accessible servers.</p>
                    
                    <Button 
                      variant="discord"
                      size="lg"
                      className="w-full"
                      onClick={handleDiscordOAuth}
                      isLoading={isLoading}
                      leftIcon={
                        !isLoading && <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M20.3 5.4A17.9 17.9 0 0 0 15.9 4l-.2.4c1.9.5 2.9 1.2 3 1.2a12.9 12.9 0 0 0-11.4 0s1-.8 3.1-1.2L10.2 4a18 18 0 0 0-4.5 1.4S2 10.6 2 17.5c1.9 2.1 4.7 3.4 4.7 3.4l1-1.3a9.6 9.6 0 0 1-2.5-1.3l.6-.4a13 13 0 0 0 12.4 0l.6.4a9.6 9.6 0 0 1-2.5 1.3l1 1.3s2.8-1.3 4.7-3.4c0-6.9-3.7-12.1-3.7-12.1ZM9.3 15.4c-.9 0-1.6-.9-1.6-1.9s.7-1.9 1.6-1.9 1.6.9 1.6 1.9-.7 1.9-1.6 1.9Zm5.4 0c-.9 0-1.6-.9-1.6-1.9s.7-1.9 1.6-1.9 1.6.9 1.6 1.9-.7 1.9-1.6 1.9Z"/></svg>
                      }
                    >
                      Continue with Discord
                    </Button>
                  </motion.div>
                )}

                {step === 'denied' && (
                  <motion.div 
                    key="denied"
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute inset-0 flex flex-col justify-center p-14 bg-[#150505]"
                  >
                    <div className="w-16 h-16 bg-[#E11D2E]/10 rounded-2xl flex items-center justify-center mb-6 border border-[#E11D2E]/20 shadow-[0_0_30px_rgba(225,29,46,0.15)]">
                      <ShieldAlert className="text-[#E11D2E]" size={32} />
                    </div>
                    <h3 className="text-3xl font-bold text-[#FF3B4D] mb-3">Access Denied</h3>
                    <p className="text-[#A0A0A0] text-sm leading-relaxed mb-10">
                      Your Discord account has not been approved by management or is not found on the whitelist for the <strong>{selectedRole}</strong> role.
                      <br/><br/>
                      Contact an administrator if you believe this is an error.
                    </p>
                    <Button variant="outline" onClick={() => { setStep('select'); setSelectedRole(null); }} className="w-fit">
                      Return to Start
                    </Button>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {step === 'welcome' && userData && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#090909]"
          >
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.15 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="absolute w-[800px] h-[800px] bg-[#E11D2E] blur-[150px] rounded-full pointer-events-none"
            />
            
            <motion.div 
              initial={{ scale: 0.8, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="mb-8 relative z-10"
            >
              <div className="relative">
                <img src={userData.avatar} alt="Avatar" className="w-28 h-28 rounded-full border-[3px] border-[#333] shadow-[0_0_50px_rgba(225,29,46,0.3)] object-cover" />
                <div className="absolute bottom-1 right-1 w-6 h-6 bg-[#23a559] rounded-full border-4 border-[#090909]" />
              </div>
            </motion.div>
            
            <motion.div
              initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="text-center z-10"
            >
              <h3 className="text-4xl font-bold text-white mb-2 tracking-tight">Welcome back,</h3>
              <p className="text-[#A0A0A0] text-xl font-medium mb-12">{userData.username} <span className="text-white/20 mx-2">•</span> <span className="text-[#E11D2E] capitalize">{selectedRole}</span></p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 200 }} transition={{ delay: 0.8, duration: 0.8, ease: "easeInOut" }}
              className="h-1 bg-[#1A1A1A] rounded-full overflow-hidden z-10 relative"
            >
              <motion.div 
                initial={{ x: "-100%" }} animate={{ x: "0%" }} transition={{ delay: 1.2, duration: 1.5, ease: "easeInOut" }}
                className="absolute inset-y-0 left-0 w-full bg-[#E11D2E] rounded-full"
              />
            </motion.div>
            
            <motion.div
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 0.5 }}
               className="mt-4 text-[#A0A0A0] text-xs uppercase tracking-widest font-semibold z-10"
            >
              Checking permissions...
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RoleButton({ title, icon, isActive, onClick }: { title: string, icon: React.ReactNode, isActive: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`group relative w-full flex items-center gap-4 p-5 rounded-2xl transition-all duration-300 border overflow-hidden ${
        isActive 
          ? 'bg-[#E11D2E]/10 border-[#E11D2E]/40 shadow-[0_0_30px_-5px_rgba(225,29,46,0.15)]' 
          : 'bg-transparent border-transparent hover:border-white/5 hover:bg-[#1A1A1A]'
      }`}
    >
      <div className={`flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-300 ${
        isActive ? 'bg-[#E11D2E] text-white shadow-[0_0_15px_rgba(225,29,46,0.4)]' : 'bg-[#222] text-[#A0A0A0] group-hover:text-white group-hover:bg-[#333]'
      }`}>
        {icon}
      </div>
      <span className={`font-semibold text-lg transition-colors duration-300 ${
        isActive ? 'text-white' : 'text-[#A0A0A0] group-hover:text-white'
      }`}>
        {title}
      </span>
      {isActive && (
        <motion.div layoutId="active-indicator" className="absolute right-6 w-2 h-2 rounded-full bg-[#E11D2E] shadow-[0_0_10px_rgba(225,29,46,0.8)]" />
      )}
    </button>
  );
}
