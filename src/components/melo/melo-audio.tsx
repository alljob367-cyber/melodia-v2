"use client";

import { useState, useRef, useCallback } from "react";
import { MeloSVG } from "./melo-svg";

// ===== MELO AUDIO — Multi-provider TTS via Web Speech API + API =====
// Primary: Web Speech API (free, instant, always available)
// Fallback: /api/melo TTS (OpenAI → ElevenLabs → Mistral → z-ai)

interface MeloAudioProps {
  text: string;
  onSpeakStart?: () => void;
  onSpeakEnd?: () => void;
  preferHighQuality?: boolean; // If true, try API TTS first
}

export function MeloAudio({ text, onSpeakStart, onSpeakEnd, preferHighQuality = false }: MeloAudioProps) {
  const [speaking, setSpeaking] = useState(false);
  const [audioMode, setAudioMode] = useState<"speech" | "tts">("speech");
  const [provider, setProvider] = useState<string>("");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const speak = useCallback(async () => {
    if (speaking) return;

    // If user prefers high quality or mode is tts, try API first
    if ((preferHighQuality || audioMode === "tts")) {
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
            setProvider(data.provider || "api");
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

        // API failed, fallback to Speech API
        setSpeaking(false);
      } catch {
        setSpeaking(false);
      }
    }

    // Mode: Web Speech API (gratuit, fonctionne toujours)
    if ("speechSynthesis" in window) {
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
        setProvider("browser");
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

    // No speech available at all
    console.warn("[melo-audio] No TTS available");
  }, [speaking, audioMode, text, preferHighQuality, onSpeakStart, onSpeakEnd]);

  const stop = useCallback(() => {
    if ("speechSynthesis" in window) speechSynthesis.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setSpeaking(false);
    onSpeakEnd?.();
  }, [onSpeakEnd]);

  // Provider label for UI
  const providerLabel = provider === "openai" ? "OpenAI" 
    : provider === "elevenlabs" ? "ElevenLabs"
    : provider === "mistral" ? "Mistral"
    : provider === "z-ai" ? "z-ai"
    : provider === "browser" ? "Browser"
    : "";

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
        <div className="flex items-center gap-1">
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
          {providerLabel && (
            <span className="text-[9px] text-slate-500 ml-1">{providerLabel}</span>
          )}
        </div>
      )}
      {/* Toggle high quality mode */}
      <button
        onClick={() => setAudioMode(audioMode === "speech" ? "tts" : "speech")}
        className={`w-5 h-5 rounded flex items-center justify-center transition-all text-[8px] ${
          audioMode === "tts"
            ? "bg-green-500/20 text-green-400"
            : "bg-white/5 text-slate-600 hover:text-slate-400"
        }`}
        title={audioMode === "tts" ? "Mode haute qualité (API)" : "Mode navigateur (gratuit)"}
      >
        HQ
      </button>
    </div>
  );
}
