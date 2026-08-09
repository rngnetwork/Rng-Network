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
    const generated = Array.from({ length: 30 }).map((_, i) => ({
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
    <div className="absolute inset-0 pointer-events-none overflow-hidden bg-black">
      {/* Background Banner Gif */}
      <div 
        className="absolute inset-0 opacity-20 bg-cover bg-center"
        style={{ backgroundImage: 'url("/visuals/RNG_Bannerr.gif")' }}
      />
      
      {/* Dark vignette overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-black/80" />

      {/* Floating Embers */}
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
              boxShadow: '0 0 10px 2px rgba(225, 29, 46, 0.8)',
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
    x: direction > 0 ? 30 : -30,
  }),
  center: {
    opacity: 1,
    x: 0,
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? -30 : 30,
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
    <div className="min-h-screen w-full flex items-center justify-center bg-black relative overflow-hidden font-sans selection:bg-[#E11D2E]/30 selection:text-white">
      <BackgroundEffects />
      
      <AnimatePresence mode="wait">
        {!isTransitioning && (
          <div 
            className="w-full max-w-[1000px] mx-auto [perspective:2000px] z-20 px-4"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <motion.div 
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ 
                opacity: 1, 
                y: 0, 
                scale: 1,
                rotateY: mousePosition.x * 5,
                rotateX: -mousePosition.y * 5,
              }}
              exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)", transition: { duration: 0.5 } }}
              transition={{ 
                duration: 0.4, 
                ease: "easeOut",
                rotateY: { type: "spring", stiffness: 100, damping: 30 },
                rotateX: { type: "spring", stiffness: 100, damping: 30 },
                default: { duration: 0.8, type: "spring", bounce: 0.2 }
              }}
              className="w-full h-[500px] bg-white rounded-3xl shadow-[0_40px_100px_-20px_rgba(225,29,46,0.2)] overflow-hidden relative flex flex-col md:flex-row border border-white/20"
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* Left Side: Dark Aesthetic Red Roles */}
              <motion.div
                layout
                transition={panelTransition}
                className="w-full md:w-[45%] p-8 flex flex-col bg-gradient-to-b from-[#7A0C16] to-[#1a0104] z-20 relative h-[500px] shadow-[10px_0_30px_rgba(0,0,0,0.5)]"
                style={{ order: isFlipped ? 2 : 1 }}
              >
                {/* Red Side Noise Overlay */}
                <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E")' }} />

                <div className="flex items-center gap-3 mb-8 relative z-10">
                  <img src="/visuals/LOGO_FOR_STAFFS.png" alt="RNG Logo" className="w-8 h-8 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]" />
                  <h2 className="text-[13px] font-bold tracking-[0.25em] uppercase text-white/90">RNG Network</h2>
                </div>

                <div className="mb-8 relative z-10">
                  <h1 className="text-3xl font-extrabold text-white mb-2 leading-[1.1] tracking-tight drop-shadow-md">
                    RNG Security
                  </h1>
                  <p className="text-white/70 text-[13px] leading-relaxed max-w-[250px] font-medium">
                    Select your authorization level to continue.
                  </p>
                </div>

                <div className="flex flex-col gap-2 mt-auto relative z-10 pb-4">
                  <RoleButton 
                    title="Login as Staff" 
                    icon={<Shield size={18} strokeWidth={2.5} />} 
                    isActive={selectedRole === 'staff'} 
                    onClick={() => handleRoleSelect('staff')} 
                  />
                  <RoleButton 
                    title="Login as Manager" 
                    icon={<ShieldCheck size={18} strokeWidth={2.5} />} 
                    isActive={selectedRole === 'manager'} 
                    onClick={() => handleRoleSelect('manager')} 
                  />
                  <RoleButton 
                    title="Login as Owner" 
                    icon={<ShieldAlert size={18} strokeWidth={2.5} />} 
                    isActive={selectedRole === 'owner'} 
                    onClick={() => handleRoleSelect('owner')} 
                  />
                </div>
              </motion.div>

              {/* Right Side: Clean White Forms */}
              <motion.div
                layout
                transition={panelTransition}
                className="w-full md:w-[55%] relative bg-[#F8FAFC] z-10 h-[500px] overflow-hidden"
                style={{ order: isFlipped ? 1 : 2 }}
              >
                <AnimatePresence mode="wait" custom={direction}>
                  
                  {step === 'select' && (
                    <motion.div 
                      key="select"
                      custom={direction}
                      variants={contentVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.35, ease: "easeOut" }}
                      className="absolute inset-0 flex flex-col items-center justify-center p-10 text-center"
                    >
                      <div className="w-40 h-40 mb-6 relative flex items-center justify-center group">
                         <div className="absolute inset-0 bg-[#E11D2E] blur-[60px] opacity-10 rounded-full group-hover:scale-110 transition-transform duration-700" />
                         <Shield className="w-32 h-32 text-slate-200 relative z-10 group-hover:text-slate-300 transition-colors duration-500" strokeWidth={1} />
                         <img src="/visuals/LOGO_FOR_STAFFS.png" alt="RNG inside shield" className="w-14 h-14 absolute z-20 drop-shadow-xl" />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-800 mb-2 tracking-tight">Secure Gateway</h3>
                      <p className="text-slate-500 text-[14px] max-w-[260px] font-medium">Please choose a role from the red panel to authorize your access.</p>
                    </motion.div>
                  )}

                  {step === 'email' && (
                    <motion.div 
                      key="email"
                      custom={direction}
                      variants={contentVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.35, ease: "easeOut" }}
                      className="absolute inset-0 flex flex-col justify-center p-12 bg-white"
                    >
                      <button onClick={() => handleBack('select')} className="text-slate-400 hover:text-slate-800 flex items-center gap-1.5 text-[13px] font-bold mb-8 transition-colors w-fit p-1 -ml-1">
                        <ArrowLeft size={16} /> Back
                      </button>
                      <h3 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Verify Email</h3>
                      <p className="text-slate-500 text-[14px] mb-8 leading-relaxed max-w-[280px]">Enter your registered network email to verify your <strong className="text-slate-800 capitalize font-bold">{selectedRole}</strong> status.</p>
                      
                      <form onSubmit={handleEmailCheck} className="flex flex-col gap-4 w-full max-w-[320px]">
                        <div className="relative group">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#E11D2E] transition-colors" size={18} />
                          <input 
                            type="email" 
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="email@rngnetwork.com"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#E11D2E]/50 focus:bg-white focus:shadow-[0_0_15px_rgba(225,29,46,0.08)] transition-all font-medium text-[14px]"
                          />
                        </div>
                        <Button type="submit" isLoading={isLoading} size="lg" className="w-full h-12 rounded-xl text-[14px] bg-slate-900 hover:bg-[#E11D2E] text-white">
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
                      className="absolute inset-0 flex flex-col justify-center p-12 bg-white"
                    >
                      <button onClick={() => handleBack('email')} className="text-slate-400 hover:text-slate-800 flex items-center gap-1.5 text-[13px] font-bold mb-6 transition-colors w-fit p-1 -ml-1">
                        <ArrowLeft size={16} /> Back
                      </button>
                      <h3 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Create Account</h3>
                      <p className="text-slate-500 text-[14px] mb-6 max-w-[300px]">Email not found. Create a profile to request access.</p>
                      
                      <form onSubmit={handleRegister} className="flex flex-col gap-3 w-full max-w-[320px]">
                        <div className="relative group">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#E11D2E] transition-colors" size={18} />
                          <input 
                            type="text" required placeholder="Full Name" value={fullName} onChange={e => setFullName(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-11 pr-4 text-[14px] text-slate-800 focus:outline-none focus:border-[#E11D2E]/50 focus:bg-white transition-all"
                          />
                        </div>
                        <div className="relative group">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#E11D2E] transition-colors" size={18} />
                          <input 
                            type="password" required placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-11 pr-4 text-[14px] text-slate-800 focus:outline-none focus:border-[#E11D2E]/50 focus:bg-white transition-all"
                          />
                        </div>
                        <div className="relative group">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#E11D2E] transition-colors" size={18} />
                          <input 
                            type="password" required placeholder="Confirm Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-11 pr-4 text-[14px] text-slate-800 focus:outline-none focus:border-[#E11D2E]/50 focus:bg-white transition-all"
                          />
                        </div>
                        <Button type="submit" isLoading={isLoading} size="lg" className="mt-2 h-12 rounded-xl text-[14px] bg-slate-900 hover:bg-[#E11D2E] text-white">
                          {!isLoading && "Register"}
                        </Button>
                      </form>
                    </motion.div>
                  )}

                  {step === 'oauth' && (
                    <motion.div 
                      key="oauth"
                      custom={direction}
                      variants={contentVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.35, ease: "easeOut" }}
                      className="absolute inset-0 flex flex-col justify-center p-12 bg-white"
                    >
                       <button onClick={() => handleBack('email')} className="text-slate-400 hover:text-slate-800 flex items-center gap-1.5 text-[13px] font-bold mb-8 transition-colors w-fit p-1 -ml-1">
                        <ArrowLeft size={16} /> Back
                      </button>
                      <h3 className="text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">Link Discord</h3>
                      <p className="text-slate-500 text-[14px] mb-8 leading-relaxed max-w-[280px]">Connect your Discord account to finalize your authorization and load your accessible servers.</p>
                      
                      <Button 
                        variant="discord"
                        size="lg"
                        className="w-full max-w-[320px] h-12 rounded-xl text-[14px] shadow-md"
                        onClick={handleDiscordOAuth}
                        isLoading={isLoading}
                        leftIcon={
                          !isLoading && <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.3 5.4A17.9 17.9 0 0 0 15.9 4l-.2.4c1.9.5 2.9 1.2 3 1.2a12.9 12.9 0 0 0-11.4 0s1-.8 3.1-1.2L10.2 4a18 18 0 0 0-4.5 1.4S2 10.6 2 17.5c1.9 2.1 4.7 3.4 4.7 3.4l1-1.3a9.6 9.6 0 0 1-2.5-1.3l.6-.4a13 13 0 0 0 12.4 0l.6.4a9.6 9.6 0 0 1-2.5 1.3l1 1.3s2.8-1.3 4.7-3.4c0-6.9-3.7-12.1-3.7-12.1ZM9.3 15.4c-.9 0-1.6-.9-1.6-1.9s.7-1.9 1.6-1.9 1.6.9 1.6 1.9-.7 1.9-1.6 1.9Zm5.4 0c-.9 0-1.6-.9-1.6-1.9s.7-1.9 1.6-1.9 1.6.9 1.6 1.9-.7 1.9-1.6 1.9Z"/></svg>
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
                      className="absolute inset-0 flex flex-col justify-center p-12 bg-white"
                    >
                      <div className="w-16 h-16 bg-[#E11D2E]/10 rounded-[1.25rem] flex items-center justify-center mb-6 border border-[#E11D2E]/20 relative">
                        <ShieldAlert className="text-[#E11D2E] relative z-10" size={32} strokeWidth={2} />
                      </div>
                      <h3 className="text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">Access Denied</h3>
                      <p className="text-slate-500 text-[14px] leading-relaxed mb-8 max-w-[280px] font-medium">
                        Your account is not whitelisted for the <strong className="text-slate-900 uppercase tracking-wide">{selectedRole}</strong> role.
                        <br/><br/>
                        Contact an administrator.
                      </p>
                      <Button variant="outline" onClick={() => handleBack('select')} className="w-fit px-6 h-10 rounded-xl text-[13px] border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900">
                        Return
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
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm"
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
              className="mb-8 relative z-10"
            >
              <div className="relative">
                <img src={userData.avatar} alt="Avatar" className="w-28 h-28 rounded-full border-[3px] border-white/10 shadow-[0_0_40px_rgba(225,29,46,0.3)] object-cover" />
                <div className="absolute bottom-1 right-1 w-6 h-6 bg-[#23a559] rounded-full border-[3px] border-black" />
              </div>
            </motion.div>
            
            <motion.div
              initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="text-center z-10"
            >
              <h3 className="text-[2rem] font-extrabold text-white mb-2 tracking-tight">Welcome back,</h3>
              <p className="text-white/70 text-lg font-medium mb-12 flex items-center justify-center gap-2">
                {userData.username} 
                <span className="w-1 h-1 rounded-full bg-white/20" /> 
                <span className="text-[#E11D2E] font-bold tracking-widest uppercase text-xs">{selectedRole}</span>
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 200 }} transition={{ delay: 0.9, duration: 0.8, ease: "easeInOut" }}
              className="h-[3px] bg-white/10 rounded-full overflow-hidden z-10 relative"
            >
              <motion.div 
                initial={{ x: "-100%" }} animate={{ x: "0%" }} transition={{ delay: 1.4, duration: 1.8, ease: "easeInOut" }}
                className="absolute inset-y-0 left-0 w-full bg-[#E11D2E] rounded-full shadow-[0_0_10px_rgba(225,29,46,0.8)]"
              />
            </motion.div>
            
            <motion.div
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 0.6 }}
               className="mt-5 text-white/50 text-[10px] uppercase tracking-[0.2em] font-bold z-10"
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
      className={`group relative w-full flex items-center gap-4 p-3.5 rounded-xl transition-all duration-300 border outline-none overflow-hidden ${
        isActive 
          ? 'bg-black/40 border-[#E11D2E]/40 shadow-[0_0_20px_rgba(0,0,0,0.5)]' 
          : 'bg-transparent border-transparent hover:border-white/10 hover:bg-black/20'
      }`}
    >
      <div className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-500 ${
        isActive ? 'bg-[#E11D2E] text-white shadow-[0_0_15px_rgba(225,29,46,0.5)] scale-105' : 'bg-black/40 text-white/50 group-hover:text-white/90 group-hover:bg-black/60'
      }`}>
        {icon}
      </div>
      <span className={`font-semibold text-[14px] transition-colors duration-300 ${
        isActive ? 'text-white' : 'text-white/60 group-hover:text-white'
      }`}>
        {title}
      </span>
      {isActive && (
        <motion.div layoutId="active-indicator" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} className="absolute right-4 w-2 h-2 rounded-full bg-[#E11D2E] shadow-[0_0_8px_rgba(225,29,46,0.9)]" />
      )}
    </button>
  );
}
