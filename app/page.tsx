"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ShieldAlert, ShieldCheck, Mail, ArrowRight, ArrowLeft, User, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { mockAuthApi } from '@/lib/auth/mockApi';
import { Button } from '@/components/ui/Button';

type Role = 'staff' | 'manager' | 'owner' | null;
type AuthStep = 'select' | 'email' | 'register' | 'oauth' | 'welcome' | 'denied';

const BackgroundEffects = () => {
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; size: number; duration: number; delay: number }[]>([]);

  useEffect(() => {
    const generated = Array.from({ length: 45 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 15 + 10,
      delay: Math.random() * 5,
    }));
    setParticles(generated);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden bg-[#090909]">
      <motion.div 
        animate={{ scale: [1, 1.05, 1], opacity: [0.03, 0.05, 0.03] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#E11D2E] blur-[140px] rounded-full" 
      />
      <motion.div 
        animate={{ scale: [1, 1.1, 1], opacity: [0.02, 0.04, 0.02] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute bottom-[-20%] left-[-10%] w-[70%] h-[70%] bg-[#E11D2E] blur-[160px] rounded-full" 
      />
      <div className="absolute inset-0 shadow-[inset_0_0_200px_rgba(0,0,0,1)] z-0" />
      
      <div className="absolute inset-0 z-10">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute bg-[#E11D2E] rounded-full"
            style={{
              width: p.size,
              height: p.size,
              left: `${p.x}%`,
              top: `${p.y}%`,
              boxShadow: '0 0 12px 2px rgba(225, 29, 46, 0.6)',
            }}
            animate={{
              y: ['0%', '-1500%'],
              opacity: [0, 1, 0],
              x: p.x % 2 === 0 ? ['0%', '100%'] : ['0%', '-100%']
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              ease: "linear",
              delay: p.delay,
            }}
          />
        ))}
      </div>
    </div>
  );
};

const panelTransition = {
  type: "spring" as const,
  stiffness: 260,
  damping: 30,
  mass: 1,
};

const contentVariants = {
  enter: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? 40 : -40,
  }),
  center: {
    opacity: 1,
    x: 0,
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? -40 : 40,
  }),
};

export default function LandingAuthPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<Role>(null);
  const [step, setStep] = useState<AuthStep>('select');
  const [direction, setDirection] = useState(1);
  const [email, setEmail] = useState('');
  
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const isFlipped = step !== 'select';

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePosition({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePosition({ x: 0, y: 0 });
  };

  const handleRoleSelect = (role: Role) => {
    setDirection(1);
    setSelectedRole(role);
    setStep('email');
  };

  const handleBack = (toStep: AuthStep) => {
    setDirection(-1);
    setStep(toStep);
    if (toStep === 'select') setSelectedRole(null);
  };

  const handleEmailCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 600));
    setIsLoading(false);

    setDirection(1);
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
    await new Promise(r => setTimeout(r, 800));
    setIsLoading(false);
    
    setDirection(1);
    setStep('oauth');
  };

  const handleDiscordOAuth = async () => {
    setIsLoading(true);
    const res = await mockAuthApi.simulateDiscordOAuth(selectedRole || 'staff');
    setIsLoading(false);
    
    if (res.success && res.data?.user?.whitelisted) {
      setUserData(res.data.user);
      setIsTransitioning(true);
      setTimeout(() => {
        setStep('welcome');
        setTimeout(() => {
          router.push('/servers');
        }, 2000);
      }, 600);
    } else {
      setDirection(1);
      setStep('denied');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#090909] relative overflow-hidden font-sans selection:bg-[#E11D2E]/30 selection:text-white">
      <BackgroundEffects />
      
      <AnimatePresence mode="wait">
        {!isTransitioning && (
          <div 
            className="w-full max-w-[1100px] mx-auto [perspective:2000px] z-20 px-4"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <motion.div 
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ 
                opacity: 1, 
                y: 0, 
                scale: 1,
                rotateY: mousePosition.x * 8,
                rotateX: -mousePosition.y * 8,
              }}
              exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)", transition: { duration: 0.5 } }}
              transition={{ 
                duration: 0.4, 
                ease: "easeOut",
                rotateY: { type: "spring", stiffness: 100, damping: 30 },
                rotateX: { type: "spring", stiffness: 100, damping: 30 },
                default: { duration: 0.8, type: "spring", bounce: 0.2 }
              }}
              className="w-full min-h-[650px] bg-[#0c0c0c]/80 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.05)] overflow-hidden relative flex flex-col md:flex-row"
              style={{ transformStyle: "preserve-3d" }}
            >
              <div className="absolute inset-0 opacity-[0.015] pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />

              {/* Roles / Welcome Side */}
              <motion.div
                layout
                transition={panelTransition}
                className="w-full md:w-[45%] p-14 flex flex-col bg-gradient-to-br from-[#121212]/90 to-[#0a0a0a]/90 z-20 border-r border-white/5 relative min-h-[650px]"
                style={{ order: isFlipped ? 2 : 1 }}
              >
                <div className="flex items-center gap-4 mb-16">
                  <img src="/visuals/LOGO_FOR_STAFFS.png" alt="RNG Logo" className="w-12 h-12 object-contain drop-shadow-[0_0_20px_rgba(225,29,46,0.5)]" />
                  <h2 className="text-xl font-bold tracking-[0.25em] uppercase text-white/90">RNG Network</h2>
                </div>

                <div className="mb-12">
                  <h1 className="text-4xl font-extrabold text-white mb-5 leading-[1.1] tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white to-white/60">
                    Welcome to <br/>RNG Management
                  </h1>
                  <p className="text-[#888] text-[15px] leading-relaxed max-w-[280px] font-medium">
                    Manage your Discord infrastructure securely through our enterprise dashboard. Select your authorization level.
                  </p>
                </div>

                <div className="flex flex-col gap-3.5 mt-auto relative z-10">
                  <RoleButton 
                    title="Login as Staff" 
                    icon={<Shield size={20} strokeWidth={2.5} />} 
                    isActive={selectedRole === 'staff'} 
                    onClick={() => handleRoleSelect('staff')} 
                  />
                  <RoleButton 
                    title="Login as Manager" 
                    icon={<ShieldCheck size={20} strokeWidth={2.5} />} 
                    isActive={selectedRole === 'manager'} 
                    onClick={() => handleRoleSelect('manager')} 
                  />
                  <RoleButton 
                    title="Login as Owner" 
                    icon={<ShieldAlert size={20} strokeWidth={2.5} />} 
                    isActive={selectedRole === 'owner'} 
                    onClick={() => handleRoleSelect('owner')} 
                  />
                </div>
              </motion.div>

              {/* Dynamic Action Forms */}
              <motion.div
                layout
                transition={panelTransition}
                className="w-full md:w-[55%] relative bg-transparent z-10 min-h-[650px] overflow-hidden"
                style={{ order: isFlipped ? 1 : 2 }}
              >
                <AnimatePresence mode="wait" custom={direction}>
                  
                  {step === 'select' && (
                    <motion.div 
                      key="select"
                      custom={direction}
                      variants={contentVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.35, ease: "easeOut" }}
                      className="absolute inset-0 flex flex-col items-center justify-center p-14 text-center"
                    >
                      <div className="w-48 h-48 mb-10 opacity-20 relative flex items-center justify-center">
                         <div className="absolute inset-0 bg-[#E11D2E] blur-[90px] rounded-full mix-blend-screen" />
                         <Shield className="w-32 h-32 text-white relative z-10" strokeWidth={0.5} />
                      </div>
                      <h3 className="text-3xl font-semibold text-white mb-4 tracking-tight">Secure Enterprise Dashboard</h3>
                      <p className="text-[#777] text-[15px] max-w-[280px]">Please choose a role from the panel to continue.</p>
                    </motion.div>
                  )}

                  {step === 'email' && (
                    <motion.div 
                      key="email"
                      custom={direction}
                      variants={contentVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.35, ease: "easeOut" }}
                      className="absolute inset-0 flex flex-col justify-center p-16"
                    >
                      <button onClick={() => handleBack('select')} className="text-[#777] hover:text-white flex items-center gap-2 text-sm font-semibold mb-12 transition-colors w-fit -ml-2 p-2">
                        <ArrowLeft size={18} /> Back
                      </button>
                      <h3 className="text-4xl font-extrabold text-white mb-4 tracking-tight">Email Verification</h3>
                      <p className="text-[#888] text-[15px] mb-10 leading-relaxed max-w-sm">Enter your registered network email to verify your <strong className="text-white capitalize font-semibold">{selectedRole}</strong> status.</p>
                      
                      <form onSubmit={handleEmailCheck} className="flex flex-col gap-6 w-full max-w-sm">
                        <div className="relative group">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#666] group-focus-within:text-[#E11D2E] transition-colors" size={20} />
                          <input 
                            type="email" 
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="email@rngnetwork.com"
                            className="w-full bg-[#111] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-[#555] focus:outline-none focus:border-[#E11D2E]/50 focus:bg-[#151515] focus:shadow-[0_0_20px_rgba(225,29,46,0.1)] transition-all font-medium text-[15px]"
                          />
                        </div>
                        <Button type="submit" isLoading={isLoading} size="lg" className="w-full h-14 rounded-2xl text-[15px]">
                          {!isLoading && "Continue"}
                        </Button>
                      </form>
                    </motion.div>
                  )}

                  {step === 'register' && (
                    <motion.div 
                      key="register"
                      custom={direction}
                      variants={contentVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.35, ease: "easeOut" }}
                      className="absolute inset-0 flex flex-col justify-center p-16"
                    >
                      <button onClick={() => handleBack('email')} className="text-[#777] hover:text-white flex items-center gap-2 text-sm font-semibold mb-10 transition-colors w-fit -ml-2 p-2">
                        <ArrowLeft size={18} /> Back
                      </button>
                      <h3 className="text-4xl font-extrabold text-white mb-3 tracking-tight">Register Account</h3>
                      <p className="text-[#888] text-[15px] mb-8 max-w-sm">Your email was not found in the system. Please create an account to request access.</p>
                      
                      <form onSubmit={handleRegister} className="flex flex-col gap-4 w-full max-w-sm">
                        <div className="relative group">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#666] group-focus-within:text-[#E11D2E] transition-colors" size={18} />
                          <input 
                            type="text" required placeholder="Full Name" value={fullName} onChange={e => setFullName(e.target.value)}
                            className="w-full bg-[#111] border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 text-[15px] text-white placeholder:text-[#555] focus:outline-none focus:border-[#E11D2E]/50 focus:bg-[#151515] transition-all"
                          />
                        </div>
                        <div className="relative group">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#666] group-focus-within:text-[#E11D2E] transition-colors" size={18} />
                          <input 
                            type="password" required placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
                            className="w-full bg-[#111] border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 text-[15px] text-white placeholder:text-[#555] focus:outline-none focus:border-[#E11D2E]/50 focus:bg-[#151515] transition-all"
                          />
                        </div>
                        <div className="relative group">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#666] group-focus-within:text-[#E11D2E] transition-colors" size={18} />
                          <input 
                            type="password" required placeholder="Confirm Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                            className="w-full bg-[#111] border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 text-[15px] text-white placeholder:text-[#555] focus:outline-none focus:border-[#E11D2E]/50 focus:bg-[#151515] transition-all"
                          />
                        </div>
                        <Button type="submit" isLoading={isLoading} size="lg" className="mt-2 h-14 rounded-2xl text-[15px]">
                          {!isLoading && "Create Account"}
                        </Button>
                      </form>
                    </motion.div>
                  )}

                  {step === 'oauth' && (
                    <motion.div 
                      key="oauth"
                      custom={direction}
                      variants={contentVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.35, ease: "easeOut" }}
                      className="absolute inset-0 flex flex-col justify-center p-16"
                    >
                       <button onClick={() => handleBack('email')} className="text-[#777] hover:text-white flex items-center gap-2 text-sm font-semibold mb-12 transition-colors w-fit -ml-2 p-2">
                        <ArrowLeft size={18} /> Back
                      </button>
                      <h3 className="text-4xl font-extrabold text-white mb-4 tracking-tight">Link Discord</h3>
                      <p className="text-[#888] text-[15px] mb-12 leading-relaxed max-w-sm">Connect your Discord account to finalize your authorization and load your accessible servers.</p>
                      
                      <Button 
                        variant="discord"
                        size="lg"
                        className="w-full max-w-sm h-14 rounded-2xl text-[15px]"
                        onClick={handleDiscordOAuth}
                        isLoading={isLoading}
                        leftIcon={
                          !isLoading && <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M20.3 5.4A17.9 17.9 0 0 0 15.9 4l-.2.4c1.9.5 2.9 1.2 3 1.2a12.9 12.9 0 0 0-11.4 0s1-.8 3.1-1.2L10.2 4a18 18 0 0 0-4.5 1.4S2 10.6 2 17.5c1.9 2.1 4.7 3.4 4.7 3.4l1-1.3a9.6 9.6 0 0 1-2.5-1.3l.6-.4a13 13 0 0 0 12.4 0l.6.4a9.6 9.6 0 0 1-2.5 1.3l1 1.3s2.8-1.3 4.7-3.4c0-6.9-3.7-12.1-3.7-12.1ZM9.3 15.4c-.9 0-1.6-.9-1.6-1.9s.7-1.9 1.6-1.9 1.6.9 1.6 1.9-.7 1.9-1.6 1.9Zm5.4 0c-.9 0-1.6-.9-1.6-1.9s.7-1.9 1.6-1.9 1.6.9 1.6 1.9-.7 1.9-1.6 1.9Z"/></svg>
                        }
                      >
                        Continue with Discord
                      </Button>
                    </motion.div>
                  )}

                  {step === 'denied' && (
                    <motion.div 
                      key="denied"
                      custom={direction}
                      variants={contentVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.35, ease: "easeOut" }}
                      className="absolute inset-0 flex flex-col justify-center p-16 bg-[#110404]"
                    >
                      <div className="w-20 h-20 bg-[#E11D2E]/10 rounded-[1.5rem] flex items-center justify-center mb-8 border border-[#E11D2E]/20 shadow-[0_0_40px_rgba(225,29,46,0.15)] relative">
                        <div className="absolute inset-0 bg-[#E11D2E] blur-[30px] opacity-20" />
                        <ShieldAlert className="text-[#E11D2E] relative z-10" size={40} strokeWidth={2} />
                      </div>
                      <h3 className="text-4xl font-extrabold text-[#FF3B4D] mb-4 tracking-tight">Access Denied</h3>
                      <p className="text-[#A0A0A0] text-[15px] leading-relaxed mb-12 max-w-md font-medium">
                        Your Discord account has not been approved by management or is not found on the whitelist for the <strong className="text-white uppercase tracking-wide">{selectedRole}</strong> role.
                        <br/><br/>
                        Contact an administrator if you believe this is an error.
                      </p>
                      <Button variant="outline" onClick={() => handleBack('select')} className="w-fit px-8 h-12 rounded-xl text-[14px]">
                        Return to Start
                      </Button>
                    </motion.div>
                  )}

                </AnimatePresence>
              </motion.div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cinematic Welcome Animation */}
      <AnimatePresence>
        {step === 'welcome' && userData && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#090909]"
          >
            <motion.div 
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.15 }}
              transition={{ duration: 2, ease: "easeOut" }}
              className="absolute w-[900px] h-[900px] bg-[#E11D2E] blur-[180px] rounded-full pointer-events-none mix-blend-screen"
            />
            
            <motion.div 
              initial={{ scale: 0.8, opacity: 0, y: 30 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              transition={{ delay: 0.2, duration: 1, type: "spring", bounce: 0.3 }}
              className="mb-10 relative z-10"
            >
              <div className="relative">
                <img src={userData.avatar} alt="Avatar" className="w-32 h-32 rounded-full border-[3px] border-[#222] shadow-[0_0_60px_rgba(225,29,46,0.4)] object-cover" />
                <div className="absolute bottom-2 right-2 w-7 h-7 bg-[#23a559] rounded-full border-[4px] border-[#090909]" />
              </div>
            </motion.div>
            
            <motion.div
              initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="text-center z-10"
            >
              <h3 className="text-[2.75rem] font-extrabold text-white mb-3 tracking-tight">Welcome back,</h3>
              <p className="text-[#A0A0A0] text-xl font-medium mb-16 flex items-center justify-center gap-3">
                {userData.username} 
                <span className="w-1.5 h-1.5 rounded-full bg-white/20" /> 
                <span className="text-[#E11D2E] font-bold tracking-widest uppercase text-sm">{selectedRole}</span>
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 240 }} transition={{ delay: 0.9, duration: 0.8, ease: "easeInOut" }}
              className="h-1 bg-[#1A1A1A] rounded-full overflow-hidden z-10 relative"
            >
              <motion.div 
                initial={{ x: "-100%" }} animate={{ x: "0%" }} transition={{ delay: 1.4, duration: 1.8, ease: "easeInOut" }}
                className="absolute inset-y-0 left-0 w-full bg-[#E11D2E] rounded-full shadow-[0_0_15px_rgba(225,29,46,0.8)]"
              />
            </motion.div>
            
            <motion.div
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 0.6 }}
               className="mt-6 text-[#777] text-[11px] uppercase tracking-[0.3em] font-bold z-10"
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
      className={`group relative w-full flex items-center gap-5 p-5 rounded-2xl transition-all duration-300 border outline-none overflow-hidden ${
        isActive 
          ? 'bg-[#E11D2E]/[0.08] border-[#E11D2E]/40 shadow-[0_0_40px_-10px_rgba(225,29,46,0.15)]' 
          : 'bg-transparent border-transparent hover:border-white/10 hover:bg-[#1A1A1A]/80'
      }`}
    >
      <div className={`flex items-center justify-center w-[3.25rem] h-[3.25rem] rounded-[1rem] transition-all duration-500 ${
        isActive ? 'bg-[#E11D2E] text-white shadow-[0_0_25px_rgba(225,29,46,0.5)] scale-105' : 'bg-[#181818] text-[#777] group-hover:text-white group-hover:bg-[#222]'
      }`}>
        {icon}
      </div>
      <span className={`font-semibold text-[17px] transition-colors duration-300 ${
        isActive ? 'text-white' : 'text-[#888] group-hover:text-white'
      }`}>
        {title}
      </span>
      {isActive && (
        <motion.div layoutId="active-indicator" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} className="absolute right-6 w-2.5 h-2.5 rounded-full bg-[#E11D2E] shadow-[0_0_12px_rgba(225,29,46,0.9)]" />
      )}
    </button>
  );
}
