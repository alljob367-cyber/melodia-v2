/**
 * GenerationTracker — Real-time generation progress tracker
 * Shows active generations with progress bars, stage indicators, and auto-polling
 */

"use client";

import { useEffect, useState } from "react";
import { useMelodia, ActiveGeneration } from "@/contexts/melodia-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Sparkles,
  Music,
  Palette,
  Video,
  Mic,
  PenTool,
  Volume2,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface GenerationTrackerProps {
  /** Show only compact version (e.g. in sidebar) */
  compact?: boolean;
  /** Max items to show */
  maxItems?: number;
  className?: string;
}

const OPERATION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  generate_lyrics: PenTool,
  generate_composition: Music,
  generate_cover: Palette,
  generate_audio: Mic,
  generate_video_economy: Video,
  generate_video_standard: Video,
  generate_video_premium: Video,
  generate_storyboard: Video,
  full_song: Sparkles,
  use_mix_master: Volume2,
  use_ai_producer: Sparkles,
};

const OPERATION_LABELS: Record<string, string> = {
  generate_lyrics: "Paroles IA",
  generate_composition: "Composition",
  generate_cover: "Pochette IA",
  generate_audio: "Audio & Voix",
  generate_video_economy: "Vidéo Économie",
  generate_video_standard: "Vidéo Standard",
  generate_video_premium: "Vidéo Premium",
  generate_storyboard: "Storyboard",
  full_song: "Chanson complète",
  use_mix_master: "Mix & Master",
  use_ai_producer: "AI Producer",
};

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  pending: { color: "text-slate-400", bg: "bg-slate-500/10", label: "En attente" },
  processing: { color: "text-purple-400", bg: "bg-purple-500/10", label: "En cours" },
  completed: { color: "text-emerald-400", bg: "bg-emerald-500/10", label: "Terminé" },
  failed: { color: "text-red-400", bg: "bg-red-500/10", label: "Échoué" },
  cancelled: { color: "text-slate-400", bg: "bg-slate-500/10", label: "Annulé" },
};

export function GenerationTracker({ compact = false, maxItems = 5, className }: GenerationTrackerProps) {
  const { activeGenerations, removeGeneration } = useMelodia();
  const displayGens = activeGenerations.slice(0, maxItems);

  if (displayGens.length === 0) return null;

  // Compact mode (sidebar/widget)
  if (compact) {
    return (
      <div className={cn("space-y-2", className)}>
        {displayGens.map((gen) => (
          <GenerationItemCompact key={gen.id} generation={gen} onDismiss={removeGeneration} />
        ))}
      </div>
    );
  }

  // Full mode (panel)
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between mb-1">
        <h4 className="text-sm font-semibold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          Générations actives
          <Badge variant="outline" className="text-[10px] border-purple-500/30 text-purple-300">
            {activeGenerations.length}
          </Badge>
        </h4>
      </div>

      <AnimatePresence mode="popLayout">
        {displayGens.map((gen) => (
          <GenerationItemFull key={gen.id} generation={gen} onDismiss={removeGeneration} />
        ))}
      </AnimatePresence>
    </div>
  );
}

// ============ COMPACT ITEM ============

function GenerationItemCompact({
  generation,
  onDismiss,
}: {
  generation: ActiveGeneration;
  onDismiss: (id: string) => void;
}) {
  const Icon = OPERATION_ICONS[generation.operation] || Sparkles;
  const label = OPERATION_LABELS[generation.operation] || generation.operation;
  const status = STATUS_CONFIG[generation.status] || STATUS_CONFIG.pending;
  const isActive = generation.status === "processing" || generation.status === "pending";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="glass rounded-lg p-2.5 space-y-1.5"
    >
      <div className="flex items-center gap-2">
        <div className={cn("w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0", status.bg)}>
          {isActive ? (
            <Loader2 className={cn("w-3 h-3 animate-spin", status.color)} />
          ) : generation.status === "completed" ? (
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          ) : (
            <XCircle className="w-3 h-3 text-red-400" />
          )}
        </div>
        <span className="text-xs font-medium text-white truncate flex-1">{label}</span>
        {generation.status === "completed" && (
          <button onClick={() => onDismiss(generation.id)} className="text-slate-500 hover:text-white">
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
      {isActive && (
        <Progress value={generation.progress} className="h-1 bg-white/5 [&>div]:bg-purple-500" />
      )}
    </motion.div>
  );
}

// ============ FULL ITEM ============

function GenerationItemFull({
  generation,
  onDismiss,
}: {
  generation: ActiveGeneration;
  onDismiss: (id: string) => void;
}) {
  const Icon = OPERATION_ICONS[generation.operation] || Sparkles;
  const label = OPERATION_LABELS[generation.operation] || generation.operation;
  const status = STATUS_CONFIG[generation.status] || STATUS_CONFIG.pending;
  const isActive = generation.status === "processing" || generation.status === "pending";
  const [elapsed, setElapsed] = useState("");

  // Calculate elapsed time
  useEffect(() => {
    if (!generation.startedAt || !isActive) return;
    const update = () => {
      const diff = Date.now() - new Date(generation.startedAt!).getTime();
      const secs = Math.floor(diff / 1000);
      if (secs < 60) setElapsed(`${secs}s`);
      else setElapsed(`${Math.floor(secs / 60)}m ${secs % 60}s`);
    };
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, [generation.startedAt, isActive]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
    >
      <Card className="glass p-4 hover:border-purple-500/20 transition-all">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", status.bg)}>
            {isActive ? (
              <Loader2 className={cn("w-5 h-5 animate-spin", status.color)} />
            ) : generation.status === "completed" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : generation.status === "failed" ? (
              <XCircle className="w-5 h-5 text-red-400" />
            ) : (
              <Icon className={cn("w-5 h-5", status.color)} />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-white">{label}</p>
              <Badge variant="outline" className={cn("text-[9px]", status.bg, status.color, "border-0")}>
                {status.label}
              </Badge>
            </div>

            {/* Progress */}
            {isActive && (
              <div className="space-y-1">
                <Progress
                  value={generation.progress}
                  className="h-1.5 bg-white/5 [&>div]:bg-gradient-to-r [&>div]:from-purple-500 [&>div]:to-pink-500"
                />
                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span>{generation.progress}%</span>
                  {elapsed && <span>Temps: {elapsed}</span>}
                </div>
              </div>
            )}

            {/* Completed message */}
            {generation.status === "completed" && (
              <p className="text-xs text-emerald-400">Génération terminée avec succès</p>
            )}

            {/* Failed message */}
            {generation.status === "failed" && (
              <p className="text-xs text-red-400">Erreur lors de la génération. Réessaie.</p>
            )}
          </div>

          {/* Dismiss button */}
          {!isActive && (
            <Button
              variant="ghost"
              size="icon"
              className="w-7 h-7 text-slate-500 hover:text-white"
              onClick={() => onDismiss(generation.id)}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
