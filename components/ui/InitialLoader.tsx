"use client";
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';

export function InitialLoader() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate initial app loading time
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/80 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex flex-col items-center"
          >
            <div className="relative w-24 h-24 mb-6">
              <div className="absolute inset-0 rounded-full border-t-2 border-l-2 border-[#E11D2E] animate-spin" style={{ animationDuration: '1.5s' }} />
              <div className="absolute inset-2 rounded-full border-b-2 border-r-2 border-white/30 animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }} />
              <div className="absolute inset-2">
                <Image src="/visuals/MAIN_LOGO.png" alt="RNG Network Logo" fill unoptimized className="object-cover rounded-full drop-shadow-[0_0_15px_rgba(225,29,46,0.6)]" />
              </div>
            </div>
            <h2 className="text-white font-display font-bold tracking-widest text-lg uppercase mb-2">RNG Network</h2>
            <p className="text-slate-400 font-mono text-xs tracking-[0.2em] uppercase flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin text-[#E11D2E]" /> Initializing RAC...
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
