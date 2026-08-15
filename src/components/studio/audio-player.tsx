/**
 * AudioPlayer — Reusable audio playback component with waveform visualization
 * Used across Audio Studio, Creations, Song detail, etc.
 */

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Download,
  Share2,
  Heart,
  Repeat,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AudioPlayerProps {
  src: string | null;
  title?: string;
  artist?: string;
  coverUrl?: string;
  duration?: number;
  compact?: boolean;
  className?: string;
  onEnded?: () => void;
}

export function AudioPlayer({
  src,
  title,
  artist,
  coverUrl,
  duration: propDuration,
  compact = false,
  className,
  onEnded,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(propDuration || 0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load audio source
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !src) return;

    audio.src = src;
    audio.volume = volume;
    // Set loading in event callback, not synchronously in effect
    const handleLoadStart = () => setIsLoading(true);

    const handleCanPlay = () => {
      setIsLoading(false);
      if (!propDuration) setAudioDuration(audio.duration);
    };
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      onEnded?.();
    };
    const handleError = () => {
      setIsLoading(false);
      setIsPlaying(false);
    };

    audio.addEventListener("loadstart", handleLoadStart);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("loadstart", handleLoadStart);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
    };
  }, [src, volume, propDuration, onEnded]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !src) {
      toast.error("Audio non disponible");
      return;
    }
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(() => toast.error("Impossible de lire l'audio"));
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, src]);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = time;
    setCurrentTime(time);
  }, []);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  const handleVolumeChange = useCallback((v: number[]) => {
    const vol = v[0] / 100;
    setVolume(vol);
    if (audioRef.current) audioRef.current.volume = vol;
  }, []);

  const formatTime = (s: number) => {
    if (!s || !isFinite(s)) return "0:00";
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  };

  const progress = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0;

  // Compact mode (inline player)
  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <audio ref={audioRef} preload="metadata" />
        <Button
          size="icon"
          variant="ghost"
          className="w-8 h-8 rounded-full text-white hover:bg-white/10 flex-shrink-0"
          onClick={togglePlay}
          disabled={!src || isLoading}
        >
          {isLoading ? (
            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-3.5 h-3.5" />
          ) : (
            <Play className="w-3.5 h-3.5" />
          )}
        </Button>
        <div className="flex-1 min-w-0">
          <div className="h-1 bg-white/10 rounded-full overflow-hidden cursor-pointer" onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            seek(x * audioDuration);
          }}>
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-0.5">
            <span className="text-[9px] text-slate-500">{formatTime(currentTime)}</span>
            <span className="text-[9px] text-slate-500">{formatTime(audioDuration)}</span>
          </div>
        </div>
      </div>
    );
  }

  // Full player mode
  return (
    <div className={cn("glass rounded-xl p-4 space-y-3", className)}>
      <audio ref={audioRef} preload="metadata" />

      {/* Track info */}
      <div className="flex items-center gap-3">
        {/* Cover art */}
        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20">
          {coverUrl ? (
            <img src={coverUrl} alt={title || "Audio"} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Play className="w-5 h-5 text-purple-400" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{title || "Sans titre"}</p>
          <p className="text-xs text-slate-400 truncate">{artist || "IA Melodia"}</p>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className={cn("w-8 h-8", isLiked ? "text-pink-400" : "text-slate-500")}
          onClick={() => {
            setIsLiked(!isLiked);
            toast.success(isLiked ? "Retiré des favoris" : "Ajouté aux favoris ! ❤️");
          }}
        >
          <Heart className={cn("w-4 h-4", isLiked && "fill-current")} />
        </Button>
      </div>

      {/* Progress bar */}
      <div
        className="h-2 bg-white/10 rounded-full overflow-hidden cursor-pointer relative group"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = (e.clientX - rect.left) / rect.width;
          seek(x * audioDuration);
        }}
      >
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-150"
          style={{ width: `${progress}%` }}
        />
        {/* Hover indicator */}
        <div className="absolute top-0 right-0 bottom-0 left-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <div
            className="absolute w-3 h-3 bg-white rounded-full -top-0.5 shadow-lg"
            style={{ left: `${progress}%`, transform: "translateX(-50%)" }}
          />
        </div>
      </div>

      {/* Time display */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(audioDuration)}</span>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2">
        <Button variant="ghost" size="icon" className="w-8 h-8 text-slate-400 hover:text-white" onClick={() => seek(0)}>
          <SkipBack className="w-4 h-4" />
        </Button>

        <Button
          size="icon"
          className="w-10 h-10 rounded-full btn-gradient text-white shadow-lg shadow-purple-500/25"
          onClick={togglePlay}
          disabled={!src || isLoading}
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5" />
          )}
        </Button>

        <Button variant="ghost" size="icon" className="w-8 h-8 text-slate-400 hover:text-white" onClick={() => seek(audioDuration)}>
          <SkipForward className="w-4 h-4" />
        </Button>
      </div>

      {/* Volume + Actions row */}
      <div className="flex items-center justify-between gap-3">
        {/* Volume */}
        <div className="flex items-center gap-2 flex-1 max-w-[140px]">
          <Button variant="ghost" size="icon" className="w-6 h-6 text-slate-400" onClick={toggleMute}>
            {isMuted || volume === 0 ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </Button>
          <Slider
            value={[isMuted ? 0 : volume * 100]}
            onValueChange={handleVolumeChange}
            max={100}
            step={1}
            className="flex-1 [&_[role=slider]]:h-3 [&_[role=slider]]:w-3"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {src && (
            <Button
              variant="ghost"
              size="icon"
              className="w-7 h-7 text-slate-400 hover:text-white"
              onClick={() => {
                const a = document.createElement("a");
                a.href = src;
                a.download = `${title || "audio"}.wav`;
                a.click();
                toast.success("Téléchargement lancé");
              }}
            >
              <Download className="w-3.5 h-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="w-7 h-7 text-slate-400 hover:text-white"
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href);
              toast.success("Lien copié !");
            }}
          >
            <Share2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
