"use client";

import { useState, useRef, useCallback } from "react";
import { MeloSVG } from "./melo-svg";

// ===== MELO AUDIO — Synthèse vocale via Web Speech API + z-ai TTS =====

interface MeloAudioProps {
  text: string;
  onSpeakStart?: () => void;
  onSpeakEnd?: () => void;
}

export function MeloAudio({ text, onSpeakStart, onSpeakEnd }: MeloAudioProps) {
  const [speaking, setSpeaking] = useState(false);
  const [audioMode, setAudioMode] = useState<"speech" | "tts">("speech");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const speak = useCallback(async () => {
    if (speaking) return;

    // Mode 1: Web Speech API (gratuit, fonctionne toujours)
    if (audioMode === "speech" && "speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "fr-FR";
      utterance.rate = 1.0;
      utterance.pitch = 1.2; // Voix légèrement aiguë pour Melo
      utterance.volume = 0.9;

      // Essayer de trouver une voix française
      const voices = speechSynthesis.getVoices();
      const frVoice = voices.find((v) => v.lang.startsWith("fr"));
      if (frVoice) utterance.voice = frVoice;

      utterance.onstart = () => {
        setSpeaking(true);
        onSpeakStart?.();
      };
      utterance.onend = () => {
        setSpeaking(false);
        onSpeakEnd?.();
      };
      utterance.onerror = () => {
        setSpeaking(false);
        onSpeakEnd?.();
      };

      speechSynthesis.cancel();
      speechSynthesis.speak(utterance);
      return;
    }

    // Mode 2: z-ai TTS API (haute qualité)
    try {
      setSpeaking(true);
      onSpeakStart?.();

      const res = await fetch("/api/melo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "tts", text }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audioUrl) {
          const audio = new Audio(data.audioUrl);
          audioRef.current = audio;
          audio.onended = () => {
            setSpeaking(false);
            onSpeakEnd?.();
          };
          audio.onerror = () => {
            setSpeaking(false);
            onSpeakEnd?.();
          };
          await audio.play();
          return;
        }
      }

      // Fallback vers Speech API
      setSpeaking(false);
      setAudioMode("speech");
    } catch {
      setSpeaking(false);
      setAudioMode("speech");
    }
  }, [speaking, audioMode, text, onSpeakStart, onSpeakEnd]);

  const stop = useCallback(() => {
    if ("speechSynthesis" in window) speechSynthesis.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setSpeaking(false);
    onSpeakEnd?.();
  }, [onSpeakEnd]);

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={speaking ? stop : speak}
        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
          speaking
            ? "bg-pink-500/20 text-pink-400 animate-pulse"
            : "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"
        }`}
        title={speaking ? "Arrêter l'audio" : "Écouter Melo"}
      >
        {speaking ? (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <rect x="2" y="2" width="4" height="10" rx="1" />
            <rect x="8" y="2" width="4" height="10" rx="1" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <path d="M2 4.5 L6 2 L6 12 L2 9.5 Z" />
            <path d="M8 4 Q10 7 8 10" stroke="currentColor" strokeWidth="1.5" fill="none" />
          </svg>
        )}
      </button>
      {speaking && (
        <div className="flex items-center gap-0.5">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-1 bg-purple-400 rounded-full animate-pulse"
              style={{
                height: `${8 + Math.random() * 8}px`,
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
