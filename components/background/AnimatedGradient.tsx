"use client";
import { motion } from "framer-motion";

export const AnimatedGradient = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {/* Abstract curved shapes and glows */}
    <motion.div 
      animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
      transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      className="absolute -top-[40%] -right-[40%] w-[120%] h-[120%] bg-gradient-to-bl from-[#E11D2E] to-transparent blur-[120px] rounded-full mix-blend-screen"
    />
    <motion.div 
      animate={{ scale: [1, 1.1, 1], opacity: [0.05, 0.15, 0.05] }}
      transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      className="absolute -bottom-[40%] -left-[40%] w-[120%] h-[120%] bg-[#E11D2E] blur-[140px] rounded-full mix-blend-screen"
    />
    
    {/* Subtle noise texture */}
    <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E")' }} />
  </div>
);
