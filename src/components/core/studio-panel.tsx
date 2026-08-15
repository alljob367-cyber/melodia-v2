/**
 * StudioPanel — Tabbed studio interface component
 * 
 * Three studio tabs: Audio, Video, Artist
 * Each tab shows relevant quick actions and generation status.
 * Uses PermissionGate to hide tabs the user can't access.
 */

"use client";

import { useState } from "react";
import { useMelodia, usePermissions } from "@/contexts/melodia-context";
import { PermissionGate } from "@/components/core/permission-gate";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Music, Mic, Headphones, AudioWaveform,
  Video, Image as ImageIcon, Film, Clapperboard,
  User, Palette, Brain, Sparkles,
  Zap, Loader2, Lock,
} from "lucide-react";
import Link from "next/link";

interface StudioPanelProps {
  projectId?: string;
  artistId?: string;
  onGenerate?: (operation: string, data: Record<string, unknown>) => void;
  className?: string;
}

export function StudioPanel({ projectId, artistId, onGenerate, className }: StudioPanelProps) {
  const [activeStudio, setActiveStudio] = useState("audio");
  const { canPerform, context } = useMelodia();

  return (
    <Tabs value={activeStudio} onValueChange={setActiveStudio} className={className}>
      <TabsList className="grid w-full grid-cols-3 bg-white/5">
        <TabsTrigger value="audio" className="gap-1.5 data-[state=active]:bg-purple-500/20">
          <AudioWaveform className="h-4 w-4" />
          Audio
        </TabsTrigger>
        <TabsTrigger value="video" className="gap-1.5 data-[state=active]:bg-pink-500/20">
          <Video className="h-4 w-4" />
          Vidéo
        </TabsTrigger>
        <TabsTrigger value="artist" className="gap-1.5 data-[state=active]:bg-blue-500/20">
          <User className="h-4 w-4" />
          Artiste
        </TabsTrigger>
      </TabsList>

      {/* ====== AUDIO STUDIO ====== */}
      <TabsContent value="audio" className="space-y-4 mt-4">
        <div className="grid grid-cols-2 gap-3">
          <StudioActionCard
            icon={<Mic className="h-5 w-5" />}
            title="Paroles IA"
            description="Générer des lyrics"
            credits={1}
            permission="CREATE_LYRICS"
            onClick={() => onGenerate?.("generate_lyrics", { projectId, artistId })}
            href="/create"
          />
          <StudioActionCard
            icon={<Music className="h-5 w-5" />}
            title="Chanson complète"
            description="Lyrics + beat + cover + audio"
            credits={7}
            permission="CREATE_SONG"
            onClick={() => onGenerate?.("full_song", { projectId, artistId })}
            href="/create"
          />
          <StudioActionCard
            icon={<Headphones className="h-5 w-5" />}
            title="Beat / Composition"
            description="Générer un instrumental"
            credits={1}
            permission="CREATE_COMPOSITION"
            onClick={() => onGenerate?.("generate_composition", { projectId, artistId })}
            href="/create"
          />
          <StudioActionCard
            icon={<AudioWaveform className="h-5 w-5" />}
            title="Mix & Master"
            description="Finaliser un audio"
            credits={4}
            permission="USE_MIX_MASTER"
            onClick={() => onGenerate?.("use_mix_master", { projectId, artistId })}
            href="/create"
          />
        </div>
      </TabsContent>

      {/* ====== VIDEO STUDIO ====== */}
      <TabsContent value="video" className="space-y-4 mt-4">
        <PermissionGate feature="CREATE_VIDEO" showDisabled>
          <div className="grid grid-cols-2 gap-3">
            <StudioActionCard
              icon={<ImageIcon className="h-5 w-5" />}
              title="Cover IA"
              description="Pochette d'album"
              credits={3}
              permission="CREATE_COVER"
              onClick={() => onGenerate?.("generate_cover", { projectId, artistId })}
              href="/create"
            />
            <StudioActionCard
              icon={<Film className="h-5 w-5" />}
              title="Vidéo Économique"
              description="Vidéo musicale 10s"
              credits={20}
              permission="CREATE_VIDEO"
              onClick={() => onGenerate?.("generate_video_economy", { projectId, artistId })}
              href="/create"
            />
            <StudioActionCard
              icon={<Video className="h-5 w-5" />}
              title="Vidéo Standard"
              description="Vidéo HD 30s"
              credits={50}
              permission="CREATE_VIDEO"
              onClick={() => onGenerate?.("generate_video_standard", { projectId, artistId })}
              href="/create"
            />
            <StudioActionCard
              icon={<Clapperboard className="h-5 w-5" />}
              title="Storyboard"
              description="Planifier une vidéo"
              credits={5}
              permission="CREATE_STORYBOARD"
              onClick={() => onGenerate?.("generate_storyboard", { projectId, artistId })}
              href="/create"
            />
          </div>
        </PermissionGate>
      </TabsContent>

      {/* ====== ARTIST STUDIO ====== */}
      <TabsContent value="artist" className="space-y-4 mt-4">
        <div className="grid grid-cols-2 gap-3">
          <StudioActionCard
            icon={<Palette className="h-5 w-5" />}
            title="Identité visuelle"
            description="Style, couleurs, concepts"
            credits={0}
            permission="UPDATE_ARTIST_IDENTITY"
            href="/dashboard"
          />
          <StudioActionCard
            icon={<Brain className="h-5 w-5" />}
            title="Producer IA"
            description="Suggestions créatives"
            credits={3}
            permission="USE_AI_PRODUCER"
            onClick={() => onGenerate?.("use_ai_producer", { projectId, artistId })}
            href="/create"
          />
          <StudioActionCard
            icon={<Sparkles className="h-5 w-5" />}
            title="Voice Studio"
            description="Voix IA personnalisée"
            credits={5}
            permission="USE_VOICE_STUDIO"
            onClick={() => onGenerate?.("use_voice_studio", { projectId, artistId })}
            href="/create"
          />
        </div>
      </TabsContent>
    </Tabs>
  );
}

// ============ INTERNAL: StudioActionCard ============

function StudioActionCard({ icon, title, description, credits, permission, onClick, href }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  credits: number;
  permission: string;
  onClick?: () => void;
  href?: string;
}) {
  return (
    <PermissionGate feature={permission as any}>
      <Card
        className="glass hover:border-purple-500/40 transition-all cursor-pointer group"
        onClick={onClick}
      >
        <CardContent className="p-4 space-y-2">
          <div className="flex items-start justify-between">
            <div className="text-purple-400 group-hover:text-purple-300 transition-colors">
              {icon}
            </div>
            {credits > 0 && (
              <Badge variant="outline" className="text-xs border-yellow-500/30 text-yellow-400 gap-1">
                <Zap className="h-2.5 w-2.5" />
                {credits}
              </Badge>
            )}
          </div>
          <div>
            <p className="font-medium text-white text-sm">{title}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </CardContent>
      </Card>
    </PermissionGate>
  );
}
