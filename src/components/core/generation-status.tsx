/**
 * GenerationStatus — Real-time generation progress display
 * 
 * Shows progress bar, status badge, and auto-polls
 * until the generation completes or fails.
 */

"use client";

import { useEffect } from "react";
import { useGenerationPoll } from "@/hooks/use-core";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2, Check, X, Clock, Zap,
  Music, Image as ImageIcon, Video, Mic, AudioWaveform,
} from "lucide-react";

interface GenerationStatusProps {
  generationId: string;
  onComplete?: (result: any) => void;
  onError?: (error: string) => void;
  autoPoll?: boolean;
  className?: string;
}

const OPERATION_ICONS: Record<string, React.ReactNode> = {
  generate_lyrics: <Mic className="h-4 w-4" />,
  generate_composition: <Music className="h-4 w-4" />,
  generate_cover: <ImageIcon className="h-4 w-4" />,
  generate_audio: <AudioWaveform className="h-4 w-4" />,
  generate_video_economy: <Video className="h-4 w-4" />,
  generate_video_standard: <Video className="h-4 w-4" />,
  generate_video_premium: <Video className="h-4 w-4" />,
  full_song: <Music className="h-4 w-4" />,
};

const OPERATION_LABELS: Record<string, string> = {
  generate_lyrics: "Paroles IA",
  generate_composition: "Composition",
  generate_cover: "Cover IA",
  generate_audio: "Audio",
  generate_video_economy: "Vidéo Économique",
  generate_video_standard: "Vidéo Standard",
  generate_video_premium: "Vidéo Premium",
  full_song: "Chanson complète",
  use_ai_producer: "Producer IA",
  use_voice_studio: "Voice Studio",
  use_mix_master: "Mix & Master",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "En attente", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: <Clock className="h-3 w-3" /> },
  processing: { label: "En cours", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: <Loader2 className="h-3 w-3 animate-spin" /> },
  completed: { label: "Terminé", color: "bg-green-500/20 text-green-400 border-green-500/30", icon: <Check className="h-3 w-3" /> },
  failed: { label: "Échoué", color: "bg-red-500/20 text-red-400 border-red-500/30", icon: <X className="h-3 w-3" /> },
  cancelled: { label: "Annulé", color: "bg-gray-500/20 text-gray-400 border-gray-500/30", icon: <X className="h-3 w-3" /> },
};

export function GenerationStatus({
  generationId, onComplete, onError, autoPoll = true, className,
}: GenerationStatusProps) {
  const { generation, polling, startPolling, stopPolling } = useGenerationPoll();

  useEffect(() => {
    if (autoPoll && generationId) {
      startPolling(generationId);
    }
    return () => stopPolling();
  }, [generationId, autoPoll, startPolling, stopPolling]);

  useEffect(() => {
    if (generation?.status === "completed") {
      onComplete?.(generation);
    }
    if (generation?.status === "failed") {
      onError?.(generation?.error || "Génération échouée");
    }
  }, [generation?.status, onComplete, onError]);

  if (!generation) {
    return (
      <Card className={`glass ${className || ""}`}>
        <CardContent className="p-4 flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-purple-400" />
          <p className="text-sm text-muted-foreground">Chargement du statut...</p>
        </CardContent>
      </Card>
    );
  }

  const operation = generation.operation || "";
  const status = generation.status || "pending";
  const progress = generation.progress || 0;
  const creditsCost = generation.actualCost || generation.estimatedCost || 0;

  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const operationIcon = OPERATION_ICONS[operation] || <Zap className="h-4 w-4" />;
  const operationLabel = OPERATION_LABELS[operation] || operation;

  return (
    <Card className={`glass ${className || ""}`}>
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-purple-400">{operationIcon}</span>
            <span className="font-medium text-white text-sm">{operationLabel}</span>
          </div>
          <Badge variant="outline" className={`text-xs gap-1 ${statusConfig.color}`}>
            {statusConfig.icon}
            {statusConfig.label}
          </Badge>
        </div>

        {/* Progress bar */}
        {(status === "processing" || status === "pending") && (
          <div className="space-y-1">
            <Progress
              value={status === "pending" ? 5 : progress}
              className="h-2 bg-white/5"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{status === "pending" ? "Démarrage..." : `${progress}%`}</span>
              {polling && (
                <span className="flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Mise à jour...
                </span>
              )}
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {creditsCost > 0 && (
            <span className="flex items-center gap-1">
              <Zap className="h-3 w-3 text-yellow-400" />
              {creditsCost} crédits
            </span>
          )}
          {generation.provider && (
            <span>Provider: {generation.provider}</span>
          )}
          {generation.duration && (
            <span>{(generation.duration / 1000).toFixed(1)}s</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
