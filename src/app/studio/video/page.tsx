"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Clapperboard,
  Video,
  Film,
  Sparkles,
  Zap,
  Upload,
  Link as LinkIcon,
  Image as ImageIcon,
  Music,
  Clock,
  Play,
  Download,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Palette,
  Wand2,
  Eye,
  Crown,
  Monitor,
  Layers,
  ChevronRight,
  FileAudio,
  Globe,
} from "lucide-react";
import Link from "next/link";

import { AppLayout } from "@/components/dashboard/app-layout";
import { StudioGate, PermissionGate } from "@/components/core/permission-gate";
import { useVideoStudioGenerate, useGenerate, useCreditWallet } from "@/hooks/use-core-queries";
import { useMelodia, useCredits, useGenerations } from "@/contexts/melodia-context";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ============ TYPES ============

type VideoTier = "economy" | "standard" | "premium";

interface VideoTierInfo {
  id: VideoTier;
  name: string;
  cost: number;
  perDuration: string;
  resolution: string;
  description: string;
  features: string[];
  icon: React.ReactNode;
  gradient: string;
  borderHover: string;
  badgeColor: string;
  accentColor: string;
  accentBg: string;
}

interface RecentGeneration {
  id: string;
  operation: string;
  tier: VideoTier;
  status: "processing" | "completed" | "failed";
  progress: number;
  thumbnailUrl?: string;
  createdAt: string;
  duration: number;
}

// ============ DATA ============

const VIDEO_TIERS: VideoTierInfo[] = [
  {
    id: "economy",
    name: "Économie",
    cost: 20,
    perDuration: "10s",
    resolution: "480p",
    description: "Vidéo IA basique, idéale pour les teasers et extraits courts.",
    features: ["Résolution 480p", "Animation simple", "Durée 10-30s", "1 style visuel"],
    icon: <Video className="h-6 w-6" />,
    gradient: "from-purple-500/20 to-purple-600/5",
    borderHover: "hover:border-purple-500/40",
    badgeColor: "border-purple-500/30 text-purple-300 bg-purple-500/10",
    accentColor: "text-purple-400",
    accentBg: "bg-purple-500/10",
  },
  {
    id: "standard",
    name: "Standard",
    cost: 50,
    perDuration: "10s",
    resolution: "720p",
    description: "Meilleure qualité avec visuels dynamiques et transitions fluides.",
    features: ["Résolution 720p", "Visuels dynamiques", "Durée 10-60s", "Transitions fluides", "Effets rythmiques"],
    icon: <Film className="h-6 w-6" />,
    gradient: "from-pink-500/20 to-pink-600/5",
    borderHover: "hover:border-pink-500/40",
    badgeColor: "border-pink-500/30 text-pink-300 bg-pink-500/10",
    accentColor: "text-pink-400",
    accentBg: "bg-pink-500/10",
  },
  {
    id: "premium",
    name: "Premium",
    cost: 75,
    perDuration: "10s",
    resolution: "1080p",
    description: "Qualité cinématique, style personnalisé et rendu professionnel.",
    features: ["Résolution 1080p", "Rendu cinématique", "Durée 10-60s", "Style personnalisé", "Effets avancés", "Sortie HD"],
    icon: <Clapperboard className="h-6 w-6" />,
    gradient: "from-amber-500/20 to-amber-600/5",
    borderHover: "hover:border-amber-500/40",
    badgeColor: "border-amber-500/30 text-amber-300 bg-amber-500/10",
    accentColor: "text-amber-400",
    accentBg: "bg-amber-500/10",
  },
];

const STYLE_OPTIONS = [
  { value: "afrofuturism", label: "Afrofuturisme" },
  { value: "afropop", label: "Afro Pop" },
  { value: "traditional", label: "Traditionnel" },
  { value: "urban", label: "Urbain / Street" },
  { value: "neon", label: "Néon / Cyber" },
  { value: "cinematic", label: "Cinématique" },
  { value: "minimalist", label: "Minimaliste" },
  { value: "painterly", label: "Peinture artistique" },
  { value: "sunset", label: "Sunset / Warm" },
  { value: "watercolor", label: "Aquarelle" },
];

const MOOD_OPTIONS = [
  { value: "energetic", label: "Énergique" },
  { value: "chill", label: "Chill / Détendu" },
  { value: "dark", label: "Sombre / Intense" },
  { value: "joyful", label: "Joyeux" },
  { value: "melancholic", label: "Mélancolique" },
  { value: "epic", label: "Épique" },
  { value: "romantic", label: "Romantique" },
  { value: "rebellious", label: "Rebelle" },
];

const DURATION_OPTIONS = [10, 20, 30, 40, 50, 60];

// Mock recent generations for demo
const MOCK_RECENT_GENERATIONS: RecentGeneration[] = [
  {
    id: "gen-1",
    operation: "generate_video_standard",
    tier: "standard",
    status: "completed",
    progress: 100,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    duration: 30,
  },
  {
    id: "gen-2",
    operation: "generate_video_economy",
    tier: "economy",
    status: "completed",
    progress: 100,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    duration: 10,
  },
  {
    id: "gen-3",
    operation: "generate_video_premium",
    tier: "premium",
    status: "processing",
    progress: 67,
    createdAt: new Date().toISOString(),
    duration: 30,
  },
];

// ============ HELPERS ============

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins}min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function getTierName(operation: string): string {
  if (operation.includes("economy")) return "Économie";
  if (operation.includes("standard")) return "Standard";
  if (operation.includes("premium")) return "Premium";
  return "Vidéo";
}

function getTierColor(tier: VideoTier): string {
  switch (tier) {
    case "economy": return "text-purple-400";
    case "standard": return "text-pink-400";
    case "premium": return "text-amber-400";
  }
}

function getTierBorder(tier: VideoTier): string {
  switch (tier) {
    case "economy": return "border-purple-500/20";
    case "standard": return "border-pink-500/20";
    case "premium": return "border-amber-500/20";
  }
}

// ============ ANIMATION VARIANTS ============

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

// ============ PAGE COMPONENT ============

export default function VideoStudioPage() {
  return (
    <AppLayout title="Vidéo Studio">
      <StudioGate studio="video" showUpgrade={true}>
        <VideoStudioContent />
      </StudioGate>
    </AppLayout>
  );
}

function VideoStudioContent() {
  const { context, canPerform, activeGenerations } = useMelodia();
  const { effective: creditBalance } = useCredits();
  const videoGenerate = useVideoStudioGenerate();
  const generalGenerate = useGenerate();

  // Form state
  const [selectedTier, setSelectedTier] = useState<VideoTier>("economy");
  const [audioUrl, setAudioUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("");
  const [selectedMood, setSelectedMood] = useState("");
  const [duration, setDuration] = useState(10);
  const [customPrompt, setCustomPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Storyboard state
  const [isStoryboardGenerating, setIsStoryboardGenerating] = useState(false);

  // Derived values
  const selectedTierInfo = VIDEO_TIERS.find((t) => t.id === selectedTier)!;
  const estimatedCost = (selectedTierInfo.cost / 10) * duration;
  const canAfford = creditBalance >= estimatedCost;

  // Recent generations: combine active + mock
  const recentGenerations = [
    ...activeGenerations
      .filter((g) => g.operation?.includes("video"))
      .map((g) => ({
        id: g.id,
        operation: g.operation,
        tier: (g.operation.includes("economy") ? "economy" : g.operation.includes("premium") ? "premium" : "standard") as VideoTier,
        status: g.status as "processing" | "completed" | "failed",
        progress: g.progress,
        createdAt: g.startedAt || new Date().toISOString(),
        duration: 10,
      })),
    ...MOCK_RECENT_GENERATIONS,
  ] as RecentGeneration[];

  // ============ HANDLERS ============

  const handleGenerate = async () => {
    if (!canAfford) {
      toast.error("Crédits insuffisants", {
        description: `Vous avez besoin de ${estimatedCost} crédits. Solde : ${creditBalance} crédits.`,
      });
      return;
    }

    if (!audioUrl && !coverUrl) {
      toast.error("Audio ou pochette requis", {
        description: "Fournissez au moins un fichier audio ou une pochette pour la vidéo.",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const operation = `generate_video_${selectedTier}`;
      await videoGenerate.mutateAsync({
        operation,
        audioUrl: audioUrl || undefined,
        coverUrl: coverUrl || undefined,
        style: selectedStyle || undefined,
        mood: selectedMood || undefined,
        duration,
        prompt: customPrompt || undefined,
      });

      toast.success("Génération vidéo lancée !", {
        description: `${selectedTierInfo.name} — ${duration}s — ${estimatedCost} crédits`,
      });

      // Reset form
      setAudioUrl("");
      setCoverUrl("");
      setCustomPrompt("");
    } catch (error: any) {
      toast.error("Erreur de génération", {
        description: error?.message || "La génération vidéo a échoué. Réessayez.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateStoryboard = async () => {
    setIsStoryboardGenerating(true);
    try {
      await generalGenerate.mutateAsync({
        operation: "generate_storyboard",
        audioUrl: audioUrl || undefined,
        coverUrl: coverUrl || undefined,
        style: selectedStyle || undefined,
        mood: selectedMood || undefined,
      });

      toast.success("Storyboard IA en génération !", {
        description: "5 crédits déduits. Vous recevrez un plan visuel sous peu.",
      });
    } catch (error: any) {
      toast.error("Erreur Storyboard", {
        description: error?.message || "Impossible de générer le storyboard.",
      });
    } finally {
      setIsStoryboardGenerating(false);
    }
  };

  // ============ RENDER ============

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* ====== WELCOME HEADER ====== */}
      <motion.div variants={itemVariants}>
        <Card className="glass p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-72 bg-pink-500/5 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-purple-500/5 rounded-full blur-[80px]" />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center">
                  <Clapperboard className="h-5 w-5 text-pink-400" />
                </div>
                <h2 className="text-2xl font-bold text-white">Vidéo Studio</h2>
              </div>
              <p className="text-slate-400 text-sm max-w-lg">
                Créez des clips vidéo IA pour vos morceaux. Choisissez votre tier, fournissez votre audio et pochette, et laissez l&apos;IA transformer votre musique en expérience visuelle.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge variant="outline" className="border-pink-500/30 text-pink-300 bg-pink-500/10 gap-1.5">
                <Zap className="h-3 w-3" />
                {creditBalance} crédits
              </Badge>
              <PermissionGate feature="CREATE_STORYBOARD">
                <Badge variant="outline" className="border-amber-500/30 text-amber-300 bg-amber-500/10 gap-1.5">
                  <Eye className="h-3 w-3" />
                  Storyboard
                </Badge>
              </PermissionGate>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* ====== VIDEO TIERS ====== */}
      <motion.div variants={itemVariants}>
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5 text-pink-400" />
          Tiers vidéo
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {VIDEO_TIERS.map((tier) => (
            <motion.div
              key={tier.id}
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedTier(tier.id)}
              className="cursor-pointer"
            >
              <Card
                className={`glass relative overflow-hidden transition-all duration-300 ${tier.borderHover} ${
                  selectedTier === tier.id
                    ? `ring-2 ${tier.id === "economy" ? "ring-purple-500/60" : tier.id === "standard" ? "ring-pink-500/60" : "ring-amber-500/60"}`
                    : ""
                }`}
              >
                {/* Gradient glow */}
                <div className={`absolute inset-0 bg-gradient-to-br ${tier.gradient} opacity-60 pointer-events-none`} />

                <CardContent className="p-5 relative space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className={`w-12 h-12 rounded-xl ${tier.accentBg} flex items-center justify-center ${tier.accentColor}`}>
                      {tier.icon}
                    </div>
                    <Badge variant="outline" className={`text-xs gap-1 ${tier.badgeColor}`}>
                      <Zap className="h-2.5 w-2.5" />
                      {tier.cost} cr/{tier.perDuration}
                    </Badge>
                  </div>

                  {/* Title & Resolution */}
                  <div>
                    <h4 className="font-bold text-white text-lg">{tier.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-[10px] bg-white/5 text-slate-300">
                        <Monitor className="h-2.5 w-2.5 mr-1" />
                        {tier.resolution}
                      </Badge>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-400 leading-relaxed">{tier.description}</p>

                  {/* Features */}
                  <div className="space-y-1.5">
                    {tier.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <CheckCircle2 className={`h-3 w-3 flex-shrink-0 ${tier.accentColor}`} />
                        <span className="text-slate-300">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Selected indicator */}
                  {selectedTier === tier.id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`absolute top-3 right-3 w-6 h-6 rounded-full ${tier.accentBg} flex items-center justify-center`}
                    >
                      <CheckCircle2 className={`h-4 w-4 ${tier.accentColor}`} />
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ====== MAIN CONTENT: FORM + SIDEBAR ====== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Generation Form — 2 cols */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
          <Card className="glass relative overflow-hidden">
            <div className="absolute top-0 left-0 w-40 h-40 bg-purple-500/3 rounded-full blur-[60px]" />
            <CardHeader className="pb-3 relative">
              <CardTitle className="text-lg flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-purple-400" />
                Paramètres de génération
              </CardTitle>
              <CardDescription className="text-slate-400">
                Configurez votre clip vidéo IA
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 relative">
              {/* Tier Selector */}
              <div>
                <Label className="text-slate-300 text-sm mb-2 block">Tier vidéo</Label>
                <Select value={selectedTier} onValueChange={(v) => setSelectedTier(v as VideoTier)}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#16162A] border-white/10">
                    {VIDEO_TIERS.map((tier) => (
                      <SelectItem key={tier.id} value={tier.id} className="text-white focus:bg-white/5 focus:text-white">
                        {tier.name} — {tier.cost} cr/{tier.perDuration} — {tier.resolution}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Audio Input */}
              <div>
                <Label className="text-slate-300 text-sm mb-2 block">
                  <FileAudio className="h-3.5 w-3.5 inline mr-1" />
                  Audio de la chanson
                </Label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="URL de l'audio (mp3, wav...)"
                      value={audioUrl}
                      onChange={(e) => setAudioUrl(e.target.value)}
                      className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <Separator className="flex-1 bg-white/5" />
                    <span className="text-xs text-slate-500 flex-shrink-0">ou</span>
                    <Separator className="flex-1 bg-white/5" />
                  </div>
                  <div className="border border-dashed border-white/10 rounded-lg p-4 text-center hover:border-purple-500/30 transition-colors cursor-pointer group">
                    <Upload className="h-6 w-6 text-slate-500 group-hover:text-purple-400 transition-colors mx-auto mb-2" />
                    <p className="text-xs text-slate-500 group-hover:text-slate-400 transition-colors">
                      Glisser-déposer ou cliquer pour uploader
                    </p>
                    <p className="text-[10px] text-slate-600 mt-1">MP3, WAV, FLAC — max 50 Mo</p>
                  </div>
                </div>
              </div>

              {/* Cover Art Input */}
              <div>
                <Label className="text-slate-300 text-sm mb-2 block">
                  <ImageIcon className="h-3.5 w-3.5 inline mr-1" />
                  Pochette / Image de base
                </Label>
                <Input
                  placeholder="URL de la pochette (jpg, png, webp...)"
                  value={coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                />
                {coverUrl && (
                  <div className="mt-2 w-20 h-20 rounded-lg overflow-hidden border border-white/10">
                    <img
                      src={coverUrl}
                      alt="Aperçu pochette"
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  </div>
                )}
              </div>

              {/* Style & Mood */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300 text-sm mb-2 block">
                    <Palette className="h-3.5 w-3.5 inline mr-1" />
                    Style visuel
                  </Label>
                  <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Choisir un style..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#16162A] border-white/10">
                      {STYLE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value} className="text-white focus:bg-white/5 focus:text-white">
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-slate-300 text-sm mb-2 block">
                    <Sparkles className="h-3.5 w-3.5 inline mr-1" />
                    Ambiance / Mood
                  </Label>
                  <Select value={selectedMood} onValueChange={setSelectedMood}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Choisir une ambiance..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#16162A] border-white/10">
                      {MOOD_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value} className="text-white focus:bg-white/5 focus:text-white">
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Duration */}
              <div>
                <Label className="text-slate-300 text-sm mb-2 block">
                  <Clock className="h-3.5 w-3.5 inline mr-1" />
                  Durée (secondes)
                </Label>
                <div className="flex flex-wrap gap-2">
                  {DURATION_OPTIONS.map((d) => (
                    <button
                      key={d}
                      onClick={() => setDuration(d)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        duration === d
                          ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                          : "bg-white/5 text-slate-400 border border-white/10 hover:border-white/20 hover:text-white"
                      }`}
                    >
                      {d}s
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Prompt */}
              <div>
                <Label className="text-slate-300 text-sm mb-2 block">
                  Instructions personnalisées (optionnel)
                </Label>
                <Textarea
                  placeholder="Décrivez le visuel souhaité, les scènes, les couleurs... L'IA utilisera ces indications."
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  rows={3}
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 resize-none"
                />
              </div>

              <Separator className="bg-white/5" />

              {/* Cost Summary & Generate Button */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-400" />
                    <span className="text-white font-semibold">Coût estimé : {estimatedCost} crédits</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {selectedTierInfo.name} — {duration}s — {selectedTierInfo.resolution}
                  </p>
                  {!canAfford && (
                    <p className="text-xs text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Crédits insuffisants (solde : {creditBalance})
                    </p>
                  )}
                </div>
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || !canAfford}
                  className="btn-gradient text-white font-bold rounded-xl shadow-lg shadow-purple-500/25 hover:scale-105 transition-transform px-8"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Génération en cours...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Générer la vidéo
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ====== RIGHT SIDEBAR ====== */}
        <motion.div variants={itemVariants} className="space-y-6">
          {/* Storyboard IA Card */}
          <PermissionGate feature="CREATE_STORYBOARD" showDisabled>
            <Card className="glass border-amber-500/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-[40px]" />
              <CardHeader className="pb-3 relative">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Eye className="h-4 w-4 text-amber-400" />
                    Storyboard IA
                  </CardTitle>
                  <Badge variant="outline" className="text-xs gap-1 border-amber-500/30 text-amber-300 bg-amber-500/10">
                    <Zap className="h-2.5 w-2.5" />
                    5 cr
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 relative">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Générez un storyboard visuel avant de créer la vidéo. L&apos;IA planifie les scènes, transitions et compositions pour un résultat optimal.
                </p>
                <div className="space-y-1.5">
                  {["Plan de scènes", "Compositions visuelles", "Transitions suggérées", "Timing synchronisé"].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <CheckCircle2 className="h-3 w-3 text-amber-400 flex-shrink-0" />
                      <span className="text-slate-300">{item}</span>
                    </div>
                  ))}
                </div>
                <Button
                  onClick={handleGenerateStoryboard}
                  disabled={isStoryboardGenerating || creditBalance < 5}
                  className="w-full bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30 font-medium text-xs rounded-lg"
                  variant="outline"
                >
                  {isStoryboardGenerating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      Génération...
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5 mr-1.5" />
                      Générer le storyboard
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </PermissionGate>

          {/* Permission / Plan Info */}
          <Card className="glass relative overflow-hidden">
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/3 rounded-full blur-[50px]" />
            <CardHeader className="pb-3 relative">
              <CardTitle className="text-base flex items-center gap-2">
                <Crown className="h-4 w-4 text-purple-400" />
                Accès & Permissions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 relative">
              <div className="space-y-2.5">
                <PlanAccessRow
                  plan="Starter"
                  feature="Vidéo Économie (480p)"
                  active={canPerform("CREATE_VIDEO")}
                />
                <PlanAccessRow
                  plan="Production"
                  feature="Storyboard IA"
                  active={canPerform("CREATE_STORYBOARD")}
                />
                <PlanAccessRow
                  plan="Vidéo Creator"
                  feature="Standard + Premium + Export"
                  active={canPerform("EXPORT_VIDEO")}
                />
              </div>
              <Separator className="bg-white/5" />
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Plan actuel</span>
                <Badge variant="outline" className="text-[10px] border-purple-500/30 text-purple-300 bg-purple-500/10">
                  {context?.plan || "basic"}
                </Badge>
              </div>
              <Link href="/subscription">
                <Button
                  variant="outline"
                  className="w-full text-xs border-purple-500/30 text-purple-300 hover:bg-purple-500/10 hover:text-purple-200 rounded-lg"
                >
                  <Crown className="w-3.5 h-3.5 mr-1.5" />
                  Voir les plans
                  <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Quick Tips */}
          <Card className="glass">
            <CardContent className="p-4 space-y-3">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-pink-400" />
                Conseils vidéo
              </h4>
              <div className="space-y-2 text-xs text-slate-400">
                <p>&#x2022; Fournissez une pochette haute résolution pour de meilleurs résultats</p>
                <p>&#x2022; L&apos;audio détermine le rythme — utilisez un mix final propre</p>
                <p>&#x2022; Le storyboard (5 cr) peut améliorer significativement le résultat</p>
                <p>&#x2022; Les vidéos Premium supportent les styles personnalisés</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ====== RECENT VIDEO GENERATIONS ====== */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Film className="w-5 h-5 text-pink-400" />
            Générations vidéo récentes
          </h3>
          <Badge variant="outline" className="text-xs border-white/10 text-slate-400">
            {recentGenerations.length} vidéo{recentGenerations.length !== 1 ? "s" : ""}
          </Badge>
        </div>

        {recentGenerations.length === 0 ? (
          <Card className="glass p-8 text-center">
            <Video className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 mb-2">Aucune vidéo générée</p>
            <p className="text-slate-500 text-xs">
              Configurez vos paramètres ci-dessus et lancez votre première génération
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentGenerations.map((gen, i) => (
              <motion.div
                key={gen.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <Card className={`glass ${getTierBorder(gen.tier)} overflow-hidden hover:border-white/15 transition-all group`}>
                  {/* Thumbnail */}
                  <div className="relative aspect-video bg-gradient-to-br from-white/5 to-white/[0.02] overflow-hidden">
                    {gen.thumbnailUrl ? (
                      <img
                        src={gen.thumbnailUrl}
                        alt={`Vidéo ${getTierName(gen.operation)}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className={`w-16 h-16 rounded-2xl ${
                          gen.tier === "economy" ? "bg-purple-500/10" : gen.tier === "standard" ? "bg-pink-500/10" : "bg-amber-500/10"
                        } flex items-center justify-center`}>
                          {gen.tier === "economy" ? (
                            <Video className="h-8 w-8 text-purple-400/60" />
                          ) : gen.tier === "standard" ? (
                            <Film className="h-8 w-8 text-pink-400/60" />
                          ) : (
                            <Clapperboard className="h-8 w-8 text-amber-400/60" />
                          )}
                        </div>
                      </div>
                    )}

                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      {gen.status === "completed" && (
                        <>
                          <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/20">
                            <Play className="w-5 h-5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/20">
                            <Download className="w-5 h-5" />
                          </Button>
                        </>
                      )}
                    </div>

                    {/* Status badge */}
                    <div className="absolute top-2 right-2">
                      {gen.status === "processing" && (
                        <Badge variant="outline" className="text-[10px] gap-1 border-blue-500/30 text-blue-300 bg-blue-500/10">
                          <Loader2 className="h-2.5 w-2.5 animate-spin" />
                          En cours
                        </Badge>
                      )}
                      {gen.status === "completed" && (
                        <Badge variant="outline" className="text-[10px] gap-1 border-emerald-500/30 text-emerald-300 bg-emerald-500/10">
                          <CheckCircle2 className="h-2.5 w-2.5" />
                          Terminé
                        </Badge>
                      )}
                      {gen.status === "failed" && (
                        <Badge variant="outline" className="text-[10px] gap-1 border-red-500/30 text-red-300 bg-red-500/10">
                          <AlertCircle className="h-2.5 w-2.5" />
                          Échoué
                        </Badge>
                      )}
                    </div>

                    {/* Duration badge */}
                    <div className="absolute bottom-2 left-2">
                      <Badge variant="secondary" className="text-[10px] bg-black/50 text-white border-0">
                        <Clock className="h-2.5 w-2.5 mr-1" />
                        {gen.duration}s
                      </Badge>
                    </div>
                  </div>

                  {/* Info */}
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-semibold ${getTierColor(gen.tier)}`}>
                        {getTierName(gen.operation)}
                      </span>
                      <span className="text-[10px] text-slate-500">{formatTimeAgo(gen.createdAt)}</span>
                    </div>

                    {/* Progress for active generations */}
                    {gen.status === "processing" && (
                      <div className="space-y-1">
                        <Progress
                          value={gen.progress}
                          className="h-1.5 bg-white/5"
                        />
                        <p className="text-[10px] text-slate-500 text-right">{gen.progress}%</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ============ SUB-COMPONENTS ============

function PlanAccessRow({ plan, feature, active }: { plan: string; feature: string; active: boolean }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <div className="flex items-center gap-2">
        {active ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
        ) : (
          <div className="h-3.5 w-3.5 rounded-full border border-slate-600 flex-shrink-0" />
        )}
        <span className={active ? "text-slate-300" : "text-slate-500"}>{feature}</span>
      </div>
      <Badge
        variant="outline"
        className={`text-[9px] ${
          active
            ? "border-emerald-500/30 text-emerald-300 bg-emerald-500/10"
            : "border-white/10 text-slate-500 bg-white/5"
        }`}
      >
        {plan}
      </Badge>
    </div>
  );
}
