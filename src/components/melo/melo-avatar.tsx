"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MeloSVG } from "./melo-svg";

// ===== MELO VIDEO AVATAR — Avatar animé avec expressions =====
// Melo s'exprime en vidéo avec des animations de visage et de corps

interface MeloAvatarProps {
  expression?: "happy" | "thinking" | "talking" | "waving" | "dancing" | "sleeping";
  message?: string;
  showVideo?: boolean;
  onExpressionEnd?: () => void;
}

export function MeloAvatar({
  expression = "happy",
  message,
  showVideo = false,
  onExpressionEnd,
}: MeloAvatarProps) {
  const [currentExpression, setCurrentExpression] = useState(expression);
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    setCurrentExpression(expression);
    if (message) {
      // Animation séquencée : Melo réagit d'abord, puis parle
      const timer1 = setTimeout(() => setShowMessage(true), 400);
      return () => clearTimeout(timer1);
    }
  }, [expression, message]);

  // Cycle d'animation pour "talking" — alterne entre talking et happy
  useEffect(() => {
    if (currentExpression === "talking" && message) {
      const interval = setInterval(() => {
        setCurrentExpression((prev) => (prev === "talking" ? "happy" : "talking"));
      }, 600);
      return () => clearInterval(interval);
    }
  }, [currentExpression, message]);

  if (!showVideo) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="relative bg-gradient-to-br from-[#0a0a12] to-[#1a1a30] rounded-2xl overflow-hidden border border-purple-500/20 shadow-xl shadow-purple-500/10"
    >
      {/* Video frame */}
      <div className="relative w-full aspect-video flex items-center justify-center overflow-hidden">
        {/* Background particles */}
        <div className="absolute inset-0">
          {Array.from({ length: 12 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-purple-400/30"
              initial={{
                x: Math.random() * 300,
                y: Math.random() * 200,
                opacity: 0,
              }}
              animate={{
                y: [Math.random() * 200, Math.random() * 50],
                opacity: [0, 0.6, 0],
                scale: [0.5, 1.5, 0.5],
              }}
              transition={{
                repeat: Infinity,
                duration: 2 + Math.random() * 2,
                delay: Math.random() * 2,
              }}
              style={{ left: `${(i / 12) * 100}%` }}
            />
          ))}
        </div>

        {/* Melo character */}
        <motion.div
          animate={{
            y: currentExpression === "dancing" ? [0, -8, 0] : [0, -3, 0],
          }}
          transition={{
            repeat: Infinity,
            duration: currentExpression === "dancing" ? 0.6 : 2,
          }}
        >
          <MeloSVG expression={currentExpression} size={160} />
        </motion.div>

        {/* Name badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-purple-500/20 backdrop-blur-sm border border-purple-500/30 rounded-full px-3 py-1"
        >
          <span className="text-xs font-bold text-purple-300">MELO</span>
          <span className="text-[9px] text-purple-400 ml-1">Assistant IA</span>
        </motion.div>

        {/* Live indicator */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[10px] text-red-400 font-medium">LIVE</span>
        </div>
      </div>

      {/* Message overlay */}
      <AnimatePresence>
        {showMessage && message && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="px-4 py-3 bg-[#0a0a12]/90 backdrop-blur-sm border-t border-purple-500/10"
          >
            <p className="text-sm text-slate-200 leading-relaxed">{message}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ===== MELO EXPRESSION CYCLE — Cycle d'expressions pour l'accueil =====
export function MeloExpressionCycle() {
  const [expression, setExpression] = useState<"happy" | "waving" | "dancing" | "thinking">("happy");
  const expressions: Array<"happy" | "waving" | "dancing" | "thinking"> = ["happy", "waving", "dancing", "thinking"];
  const messages = [
    "Bienvenue sur Melodia ! 🎵",
    "Prêt à créer ton prochain hit ?",
    "Danse avec moi ! 💃",
    "Laisse-moi t'aider...",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setExpression((prev) => {
        const idx = expressions.indexOf(prev);
        return expressions[(idx + 1) % expressions.length];
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const msgIdx = expressions.indexOf(expression);

  return (
    <div className="flex flex-col items-center gap-2">
      <MeloSVG expression={expression} size={80} />
      <motion.p
        key={msgIdx}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-xs text-purple-300 text-center"
      >
        {messages[msgIdx]}
      </motion.p>
    </div>
  );
}
