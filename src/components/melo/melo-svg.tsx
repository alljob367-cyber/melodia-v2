"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ===== MELO MASCOT SVG — Personnage animé =====
// Melo est une note de musique anthropomorphisée avec des yeux expressifs,
// un casque DJ, et des bras qui bougent

interface MeloSVGProps {
  expression?: "happy" | "thinking" | "talking" | "waving" | "dancing" | "sleeping";
  size?: number;
  className?: string;
}

export function MeloSVG({ expression = "happy", size = 120, className = "" }: MeloSVGProps) {
  const [blink, setBlink] = useState(false);

  // Clignement automatique des yeux
  useEffect(() => {
    const interval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 150);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const eyeScaleY = blink ? 0.1 : 1;
  const mouthPath =
    expression === "happy" || expression === "dancing"
      ? "M42 62 Q50 72 58 62" // Sourire
      : expression === "thinking"
      ? "M45 62 Q50 65 55 62" // Bouche neutre/pensif
      : expression === "talking"
      ? "M44 60 Q50 70 56 60 Q50 66 44 60" // Bouche ouverte
      : expression === "waving"
      ? "M42 60 Q50 68 58 60" // Sourire large
      : expression === "sleeping"
      ? "M45 63 Q50 63 55 63" // Bouche endormie
      : "M42 62 Q50 72 58 62";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Aura/Glow */}
      <circle cx="50" cy="50" r="48" fill="url(#meloGlow)" opacity="0.3" />

      {/* Corps — Note de musique ronde */}
      <ellipse cx="50" cy="52" rx="28" ry="30" fill="url(#meloBody)" />

      {/* Casque DJ */}
      <path
        d="M25 38 Q25 18 50 18 Q75 18 75 38"
        stroke="#A855F7"
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
      />
      {/* Oreillette gauche */}
      <ellipse cx="25" cy="38" rx="6" ry="8" fill="#7C3AED" />
      <ellipse cx="25" cy="38" rx="3" ry="5" fill="#A855F7" />
      {/* Oreillette droite */}
      <ellipse cx="75" cy="38" rx="6" ry="8" fill="#7C3AED" />
      <ellipse cx="75" cy="38" rx="3" ry="5" fill="#A855F7" />
      {/* Micro casque */}
      <path d="M25 42 Q20 55 30 58" stroke="#A855F7" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="30" cy="58" r="2.5" fill="#EC4899" />

      {/* Yeux */}
      <g transform={`translate(40, 48) scale(1, ${eyeScaleY})`}>
        <ellipse cx="0" cy="0" rx="4" ry="4.5" fill="white" />
        <ellipse cx="1" cy="-0.5" rx="2" ry="2.5" fill="#1a1a2e" />
        <circle cx="2" cy="-1.5" r="1" fill="white" opacity="0.8" />
      </g>
      <g transform={`translate(60, 48) scale(1, ${eyeScaleY})`}>
        <ellipse cx="0" cy="0" rx="4" ry="4.5" fill="white" />
        <ellipse cx="1" cy="-0.5" rx="2" ry="2.5" fill="#1a1a2e" />
        <circle cx="2" cy="-1.5" r="1" fill="white" opacity="0.8" />
      </g>

      {/* Joues rosées */}
      <ellipse cx="34" cy="56" rx="4" ry="2.5" fill="#EC4899" opacity="0.2" />
      <ellipse cx="66" cy="56" rx="4" ry="2.5" fill="#EC4899" opacity="0.2" />

      {/* Bouche */}
      <path d={mouthPath} stroke="#EC4899" strokeWidth="2" fill="none" strokeLinecap="round" />

      {/* Bras gauche */}
      <motion.g
        animate={{
          rotate: expression === "waving" ? [0, -20, 0, -20, 0] : expression === "dancing" ? [0, -10, 0] : 0,
        }}
        transition={{ repeat: Infinity, duration: expression === "waving" ? 0.8 : 1.2 }}
        style={{ originX: "22px", originY: "55px" }}
      >
        <path d="M22 55 Q12 50 8 44" stroke="url(#meloBody)" strokeWidth="5" strokeLinecap="round" />
        {expression === "waving" && <text x="2" y="42" fontSize="10">👋</text>}
      </motion.g>

      {/* Bras droit */}
      <motion.g
        animate={{
          rotate: expression === "dancing" ? [0, 15, 0] : expression === "waving" ? [0, 10, 0] : 0,
        }}
        transition={{ repeat: Infinity, duration: 1.2, delay: 0.3 }}
        style={{ originX: "78px", originY: "55px" }}
      >
        <path d="M78 55 Q88 50 92 44" stroke="url(#meloBody)" strokeWidth="5" strokeLinecap="round" />
      </motion.g>

      {/* Notes musicales flottantes */}
      {(expression === "dancing" || expression === "happy" || expression === "talking") && (
        <>
          <motion.text
            x="85"
            y="30"
            fontSize="10"
            animate={{ y: [30, 20, 30], opacity: [0.8, 0.3, 0.8] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            ♪
          </motion.text>
          <motion.text
            x="10"
            y="25"
            fontSize="8"
            animate={{ y: [25, 15, 25], opacity: [0.6, 0.2, 0.6] }}
            transition={{ repeat: Infinity, duration: 2.5, delay: 0.5 }}
          >
            ♫
          </motion.text>
        </>
      )}

      {/* Zzz pour dormir */}
      {expression === "sleeping" && (
        <>
          <motion.text
            x="72"
            y="30"
            fontSize="8"
            fill="#94A3B8"
            animate={{ y: [30, 20, 10], opacity: [0.8, 0.4, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            z
          </motion.text>
          <motion.text
            x="80"
            y="22"
            fontSize="10"
            fill="#94A3B8"
            animate={{ y: [22, 12, 2], opacity: [0.6, 0.3, 0] }}
            transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
          >
            Z
          </motion.text>
        </>
      )}

      {/* Gradients */}
      <defs>
        <radialGradient id="meloGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#A855F7" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#7C3AED" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="meloBody" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="50%" stopColor="#9333EA" />
          <stop offset="100%" stopColor="#A855F7" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ===== MELO FLOATING BUBBLE — Bulle de dialogue de Melo =====
interface MeloBubbleProps {
  message: string;
  visible: boolean;
  onClose: () => void;
}

export function MeloBubble({ message, visible, onClose }: MeloBubbleProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.8 }}
          className="absolute bottom-20 right-0 max-w-[280px] sm:max-w-[320px] bg-[#1a1a30] border border-purple-500/20 rounded-2xl p-4 shadow-xl shadow-purple-500/10"
        >
          <button
            onClick={onClose}
            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            ×
          </button>
          <div className="flex items-start gap-3">
            <MeloSVG expression="happy" size={40} />
            <p className="text-sm text-slate-200 leading-relaxed pt-1">{message}</p>
          </div>
          {/* Triangle pointer */}
          <div className="absolute -bottom-2 right-6 w-4 h-4 bg-[#1a1a30] border-b border-r border-purple-500/20 rotate-45" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
