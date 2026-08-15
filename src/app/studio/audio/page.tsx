"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Mic,
  Headphones,
  PenTool,
  Music,
  Volume2,
  Sparkles,
  Wand2,
  Play,
  Pause,
  Loader2,
  Disc,
  Clock,
  Check,
  X,
  Zap,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { AppLayout } from "@/components/dashboard/app-layout";
import { StudioGate } from "@/components/core/permission-gate";
import { CreditWallet } from "@/components/core/credit-wallet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAudioStudioGenerate, useCreditWallet } from "@/hooks/use-core-queries";
import { useMelodia } from "@/contexts/melodia-context";
import { cn } from "@/lib/utils";

// ============ DATA ============

const MUSIC_STYLES = [
  { id: "afrobeat", name: "Afrobeat", emoji: "🥁" },
  { id: "amapiano", name: "Amapiano", emoji: "🎹" },
  { id: "afropop", name: "Afropop", emoji: "🎤" },
  { id: "afro-rnb", name: "Afro R&B", emoji: "💜" },
  { id: "makossa", name: "Makossa", emoji: "🎺" },
  { id: "bikutsi", name: "Bikutsi", emoji: "🪘" },
  { id: "coupe-decale", name: "Coupé-Décalé", emoji: "💃" },
  { id: "highlife", name: "Highlife", emoji: "🎸" },
  { id: "sauce", name: "Sauce", emoji: "🔥" },
  { id: "shatta", name: "Shatta", emoji: "⚡" },
  { id: "bongo-flava", name: "Bongo Flava", emoji: "🌊" },
  { id: "kizomba", name: "Kizomba", emoji: "🌙" },
] as const;

const MOODS = [
  { id: "joyeux", name: "Joyeux", emoji: "😊", color: "border-yellow-500/40 text-yellow-300 bg-yellow-500/10" },
  { id: "melancolique", name: "Mélancolique", emoji: "😢", color: "border-blue-500/40 text-blue-300 bg-blue-500/10" },
  { id: "energique", name: "Énergique", emoji: "⚡", color: "border-red-500/40 text-red-300 bg-red-500/10" },
  { id: "chill", name: "Chill", emoji: "😎", color: "border-emerald-500/40 text-emerald-300 bg-emerald-500/10" },
  { id: "puissant", name: "Puissant", emoji: "💪", color: "border-purple-500/40 text-purple-300 bg-purple-500/10" },
  { id: "reveur", name: "Rêveur", emoji: "✨", color: "border-pink-500/40 text-pink-300 bg-pink-500/10" },
] as const;

const QUICK_ACTIONS = [
  {
    id: "lyrics",
    label: "Paroles IA",
    desc: "Générer des paroles",
    credits: 1,
    icon: PenTool,
    accent: "from-pink-500/20 to-pink-600/5",
    iconBg: "bg-pink-500/15",
    iconColor: "text-pink-400",
    borderHover: "hover:border-pink-500/30",
    glow: "group-hover:shadow-pink-500/20",
    operation: "generate_lyrics",
  },
  {
    id: "composition",
    label: "Composition",
    desc: "Générer un beat",
    credits: 1,
    icon: Music,
    accent: "from-purple-500/20 to-purple-600/5",
    iconBg: "bg-purple-500/15",
    iconColor: "text-purple-400",
    borderHover: "hover:border-purple-500/30",
    glow: "group-hover:shadow-purple-500/20",
    operation: "generate_composition",
  },
  {
    id: "voice",
    label: "Voix & Audio",
    desc: "Audio complet avec voix",
    credits: 2,
    icon: Mic,
    accent: "from-amber-500/20 to-amber-600/5",
    iconBg: "bg-amber-500/15",
    iconColor: "text-amber-400",
    borderHover: "hover:border-amber-500/30",
    glow: "group-hover:shadow-amber-500/20",
    operation: "generate_audio",
  },
  {
    id: "mix",
    label: "Mix & Master",
    desc: "Finaliser et masteriser",
    credits: 4,
    icon: Volume2,
    accent: "from-red-500/20 to-red-600/5",
    iconBg: "bg-red-500/15",
    iconColor: "text-red-400",
    borderHover: "hover:border-red-500/30",
    glow: "group-hover:shadow-red-500/20",
    operation: "use_mix_master",
  },
  {
    id: "full-song",
    label: "Chanson complète",
    desc: "Pipeline complet IA",
    credits: 7,
    icon: Sparkles,
    accent: "from-purple-500/20 to-violet-600/5",
    iconBg: "bg-purple-500/15",
    iconColor: "text-purple-400",
    borderHover: "hover:border-purple-500/30",
    glow: "group-hover:shadow-purple-500/20",
    operation: "full_song",
  },
  {
    id: "ai-producer",
    label: "AI Producer",
    desc: "Suggestions du producer",
    credits: 3,
    icon: Wand2,
    accent: "from-emerald-500/20 to-emerald-600/5",
    iconBg: "bg-emerald-500/15",
    iconColor: "text-emerald-400",
    borderHover: "hover:border-emerald-500/30",
    glow: "group-hover:shadow-emerald-500/20",
    operation: "use_ai_producer",
  },
] as const;

// ============ MOCK RECENT GENERATIONS ============

interface RecentGeneration {
  id: string;
  operation: string;
  label: string;
  style: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  createdAt: string;
}

const MOCK_RECENT: RecentGeneration[] = [
  { id: "gen-1", operation: "full_song", label: "Chanson complète", style: "Afrobeat", status: "completed", progress: 100, createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: "gen-2", operation: "generate_composition", label: "Composition", style: "Amapiano", status: "processing", progress: 67, createdAt: new Date(Date.now() - 1800000).toISOString() },
  { id: "gen-3", operation: "generate_lyrics", label: "Paroles IA", style: "Afropop", status: "completed", progress: 100, createdAt: new Date(Date.now() - 7200000).toISOString() },
  { id: "gen-4", operation: "use_mix_master", label: "Mix & Master", style: "Makossa", status: "failed", progress: 45, createdAt: new Date(Date.now() - 10800000).toISOString() },
];

// ============ HELPERS ============

function formatTimeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Il y a ${days}j`;
}

const STATUS_STYLES: Record<string, { label: string; badge: string }> = {
  pending: { label: "En attente", badge: "border-yellow-500/30 text-yellow-400 bg-yellow-500/10" },
  processing: { label: "En cours", badge: "border-blue-500/30 text-blue-400 bg-blue-500/10" },
  completed: { label: "Terminé", badge: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10" },
  failed: { label: "Échoué", badge: "border-red-500/30 text-red-400 bg-red-500/10" },
};

const OPERATION_ICONS: Record<string, React.ReactNode> = {
  generate_lyrics: <PenTool className="h-4 w-4" />,
  generate_composition: <Music className="h-4 w-4" />,
  generate_audio: <Mic className="h-4 w-4" />,
  use_mix_master: <Volume2 className="h-4 w-4" />,
  full_song: <Sparkles className="h-4 w-4" />,
  use_ai_producer: <Wand2 className="h-4 w-4" />,
};

// ============ PAGE COMPONENT ============

export default function AudioStudioPage() {
  return (
    <AppLayout title="Audio Studio">
      <StudioGate studio="audio" showUpgrade={true}>
        <AudioStudioContent />
      </StudioGate>
    </AppLayout>
  );
}

// ============ MAIN CONTENT ============

function AudioStudioContent() {
  const { context, activeGenerations } = useMelodia();
  const generateMutation = useAudioStudioGenerate();
  const creditData = useCreditWallet();

  // Form state
  const [selectedStyle, setSelectedStyle] = useState<string>("");
  const [selectedMood, setSelectedMood] = useState<string>("");
  const [customLyrics, setCustomLyrics] = useState("");
  const [additionalInstructions, setAdditionalInstructions] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("quick");

  // Combine mock + live generations
  const recentGenerations = [...MOCK_RECENT];

  const effectiveCredits = context?.creditsEffective || 0;

  // ============ HANDLERS ============

  const handleQuickAction = (action: (typeof QUICK_ACTIONS)[number]) => {
    if (effectiveCredits < action.credits) {
      toast.error(`Crédits insuffisants — ${action.credits} crédits requis`);
      return;
    }
    setIsGenerating(true);
    generateMutation.mutate(
      {
        operation: action.operation,
        style: selectedStyle || undefined,
        mood: selectedMood || undefined,
      },
      {
        onSettled: () => setIsGenerating(false),
        onSuccess: () => {
          toast.success(`${action.label} lancé ! Suivez la progression ci-dessous.`);
        },
        onError: (err: any) => {
          toast.error(err?.message || "Erreur lors de la génération");
        },
      }
    );
  };

  const handleFullGenerate = () => {
    if (!selectedStyle) {
      toast.error("Sélectionnez un style musical");
      return;
    }
    if (effectiveCredits < 7) {
      toast.error("Crédits insuffisants pour une chanson complète (7 crédits)");
      return;
    }
    setIsGenerating(true);
    generateMutation.mutate(
      {
        operation: "full_song",
        style: selectedStyle,
        mood: selectedMood || undefined,
        lyrics: customLyrics || undefined,
        instructions: additionalInstructions || undefined,
      },
      {
        onSettled: () => setIsGenerating(false),
        onSuccess: () => {
          toast.success("Chanson complète lancée ! Suivez la progression.");
          setSelectedStyle("");
          setSelectedMood("");
          setCustomLyrics("");
          setAdditionalInstructions("");
        },
        onError: (err: any) => {
          toast.error(err?.message || "Erreur lors de la génération");
        },
      }
    );
  };

  const hasActiveGen = activeGenerations.some(
    (g) => g.status === "pending" || g.status === "processing"
  );

  // ============ RENDER ============

  return (
    <div className="space-y-6">
      {/* ---- WELCOME HEADER ---- */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="glass p-6 relative overflow-hidden border-purple-500/10">
          <div className="absolute top-0 right-0 w-72 h-72 bg-purple-500/5 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-pink-500/5 rounded-full blur-[80px]" />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center">
                  <Headphones className="w-5 h-5 text-purple-400" />
                </div>
                <h2 className="text-2xl font-bold text-white">Audio Studio</h2>
                <Badge variant="outline" className="border-purple-500/30 text-purple-300 bg-purple-500/10 text-[10px]">
                  IA
                </Badge>
              </div>
              <p className="text-slate-400 text-sm max-w-lg">
                Créez des paroles, composez des beats, générez des voix synthétiques et masterisez vos titres.
                Tout est propulsé par l&apos;IA, pensé pour les artistes africains.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <CreditWallet compact />
              {hasActiveGen && (
                <Badge variant="outline" className="border-blue-500/30 text-blue-400 bg-blue-500/10 gap-1.5 animate-pulse">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Génération en cours
                </Badge>
              )}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* ---- TABS: Quick / Form ---- */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
        <TabsList className="bg-white/5 border border-white/10 p-1 rounded-xl">
          <TabsTrigger
            value="quick"
            className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 rounded-lg px-4"
          >
            <Zap className="w-4 h-4 mr-1.5" />
            Actions rapides
          </TabsTrigger>
          <TabsTrigger
            value="custom"
            className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 rounded-lg px-4"
          >
            <PenTool className="w-4 h-4 mr-1.5" />
            Génération personnalisée
          </TabsTrigger>
        </TabsList>

        {/* ======== QUICK ACTIONS TAB ======== */}
        <TabsContent value="quick" className="space-y-6">
          {/* Quick actions grid */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Démarrage rapide
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {QUICK_ACTIONS.map((action, i) => (
                <motion.div
                  key={action.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                >
                  <motion.div
                    whileHover={{ scale: 1.03, y: -4 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleQuickAction(action)}
                    className="cursor-pointer"
                  >
                    <Card
                      className={cn(
                        "glass p-5 transition-all duration-300 group",
                        action.borderHover,
                        "hover:shadow-lg"
                      )}
                    >
                      {/* Gradient overlay */}
                      <div
                        className={cn(
                          "absolute inset-0 rounded-xl bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none",
                          action.accent
                        )}
                      />

                      <div className="relative">
                        <div className="flex items-start justify-between mb-3">
                          <div
                            className={cn(
                              "w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110",
                              action.iconBg
                            )}
                          >
                            <action.icon className={cn("w-6 h-6", action.iconColor)} />
                          </div>
                          <Badge
                            variant="outline"
                            className="text-[10px] border-white/10 text-slate-400 bg-white/5 gap-1"
                          >
                            <Zap className="h-2.5 w-2.5" />
                            {action.credits} cr.
                          </Badge>
                        </div>
                        <p className="text-sm font-semibold text-white mb-0.5">{action.label}</p>
                        <p className="text-xs text-slate-500">{action.desc}</p>
                      </div>
                    </Card>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ======== CUSTOM GENERATION TAB ======== */}
        <TabsContent value="custom" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* --- Main Form (2 cols) --- */}
            <div className="lg:col-span-2 space-y-5">
              {/* Style selector */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <Card className="glass p-5 border-purple-500/10">
                  <Label className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <Music className="w-4 h-4 text-purple-400" />
                    Style musical
                  </Label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-3">
                    {MUSIC_STYLES.map((style) => (
                      <motion.button
                        key={style.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() =>
                          setSelectedStyle(selectedStyle === style.id ? "" : style.id)
                        }
                        className={cn(
                          "flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-all duration-200",
                          selectedStyle === style.id
                            ? "border-purple-500/50 bg-purple-500/15 text-purple-300 shadow-sm shadow-purple-500/10"
                            : "border-white/5 bg-white/[0.03] text-slate-400 hover:border-white/10 hover:bg-white/[0.06]"
                        )}
                      >
                        <span className="text-base">{style.emoji}</span>
                        <span className="truncate">{style.name}</span>
                      </motion.button>
                    ))}
                  </div>
                </Card>
              </motion.div>

              {/* Mood selector */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <Card className="glass p-5 border-purple-500/10">
                  <Label className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-pink-400" />
                    Ambiance
                  </Label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-3">
                    {MOODS.map((mood) => (
                      <motion.button
                        key={mood.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() =>
                          setSelectedMood(selectedMood === mood.id ? "" : mood.id)
                        }
                        className={cn(
                          "flex flex-col items-center gap-1 px-2 py-3 rounded-xl border text-xs transition-all duration-200",
                          selectedMood === mood.id
                            ? mood.color + " shadow-sm"
                            : "border-white/5 bg-white/[0.03] text-slate-400 hover:border-white/10 hover:bg-white/[0.06]"
                        )}
                      >
                        <span className="text-lg">{mood.emoji}</span>
                        <span className="truncate">{mood.name}</span>
                      </motion.button>
                    ))}
                  </div>
                </Card>
              </motion.div>

              {/* Lyrics + instructions */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                <Card className="glass p-5 border-purple-500/10 space-y-4">
                  <div>
                    <Label className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                      <PenTool className="w-4 h-4 text-pink-400" />
                      Paroles personnalisées
                      <Badge variant="outline" className="text-[9px] border-white/10 text-slate-500 ml-auto">
                        Optionnel
                      </Badge>
                    </Label>
                    <Textarea
                      value={customLyrics}
                      onChange={(e) => setCustomLyrics(e.target.value)}
                      placeholder="Écrivez vos paroles ici... L'IA les adaptera au style sélectionné."
                      className="mt-2 min-h-[100px] bg-white/[0.03] border-white/10 text-slate-300 placeholder:text-slate-600 focus:border-purple-500/30 resize-none"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                      <Wand2 className="w-4 h-4 text-emerald-400" />
                      Instructions supplémentaires
                      <Badge variant="outline" className="text-[9px] border-white/10 text-slate-500 ml-auto">
                        Optionnel
                      </Badge>
                    </Label>
                    <Textarea
                      value={additionalInstructions}
                      onChange={(e) => setAdditionalInstructions(e.target.value)}
                      placeholder="Ex: tempo rapide, basse profonde, refrain catchy, thème amour..."
                      className="mt-2 min-h-[70px] bg-white/[0.03] border-white/10 text-slate-300 placeholder:text-slate-600 focus:border-purple-500/30 resize-none"
                    />
                  </div>
                </Card>
              </motion.div>

              {/* Generate button */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
              >
                <Button
                  onClick={handleFullGenerate}
                  disabled={isGenerating || !selectedStyle}
                  className="w-full btn-gradient text-white font-bold rounded-xl py-6 text-base shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-[1.01] transition-all disabled:opacity-50 disabled:hover:scale-100"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Génération en cours...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Générer une chanson complète
                      <ChevronRight className="w-5 h-5 ml-1" />
                    </>
                  )}
                </Button>
                <p className="text-center text-xs text-slate-500 mt-2">
                  Coût : 7 crédits • Style : {selectedStyle ? MUSIC_STYLES.find((s) => s.id === selectedStyle)?.name : "—"} • Ambiance : {selectedMood ? MOODS.find((m) => m.id === selectedMood)?.name : "—"}
                </p>
              </motion.div>
            </div>

            {/* --- Sidebar: Credit wallet (1 col) --- */}
            <div className="space-y-5">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                <CreditWallet showPurchase showUsage className="border-purple-500/10" />
              </motion.div>

              {/* Active generations from context */}
              {activeGenerations.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                >
                  <Card className="glass p-4 border-blue-500/20">
                    <CardHeader className="p-0 pb-3">
                      <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                        <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                        Générations actives
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 space-y-3">
                      {activeGenerations.map((gen) => (
                        <div key={gen.id} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-300">{gen.operation}</span>
                            <span className="text-blue-400">{gen.progress}%</span>
                          </div>
                          <Progress value={gen.progress} className="h-1.5 bg-white/5 [&>div]:bg-blue-500" />
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* ---- RECENT GENERATIONS ---- */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-400" />
            Générations récentes
          </h3>
          <button className="text-sm text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1 transition-colors">
            Voir tout <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentGenerations.length === 0 ? (
          <Card className="glass p-8 text-center">
            <Disc className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 mb-1">Aucune génération encore</p>
            <p className="text-slate-500 text-xs">
              Lancez une action rapide pour créer votre premier titre
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {recentGenerations.map((gen, i) => {
                const statusStyle = STATUS_STYLES[gen.status] || STATUS_STYLES.pending;
                const opIcon = OPERATION_ICONS[gen.operation] || <Zap className="h-4 w-4" />;

                return (
                  <motion.div
                    key={gen.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.35, delay: i * 0.07 }}
                  >
                    <Card className="glass p-4 hover:border-purple-500/15 transition-all group">
                      <div className="flex items-center gap-4">
                        {/* Icon */}
                        <div
                          className={cn(
                            "flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center",
                            gen.status === "completed"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : gen.status === "processing"
                              ? "bg-blue-500/10 text-blue-400"
                              : gen.status === "failed"
                              ? "bg-red-500/10 text-red-400"
                              : "bg-yellow-500/10 text-yellow-400"
                          )}
                        >
                          {gen.status === "processing" ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : gen.status === "completed" ? (
                            <Check className="w-5 h-5" />
                          ) : gen.status === "failed" ? (
                            <X className="w-5 h-5" />
                          ) : (
                            <Clock className="w-5 h-5" />
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-white">{gen.label}</p>
                            <Badge variant="outline" className={cn("text-[9px] gap-0.5 px-1.5 py-0", statusStyle.badge)}>
                              {statusStyle.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-slate-500">{gen.style}</span>
                            <span className="text-xs text-slate-600">•</span>
                            <span className="text-xs text-slate-500">{formatTimeAgo(gen.createdAt)}</span>
                          </div>

                          {/* Progress bar for active */}
                          {gen.status === "processing" && (
                            <div className="mt-2">
                              <Progress
                                value={gen.progress}
                                className="h-1.5 bg-white/5 [&>div]:bg-blue-500"
                              />
                              <p className="text-[10px] text-slate-500 mt-0.5">{gen.progress}%</p>
                            </div>
                          )}
                        </div>

                        {/* Play button for completed */}
                        {gen.status === "completed" && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-9 h-9 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                            >
                              <Play className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </div>
  );
}
