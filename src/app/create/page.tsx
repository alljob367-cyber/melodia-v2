"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Music,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Mic,
  Image,
  Video,
  Check,
  Loader2,
  Play,
  Pause,
  Download,
  Share2,
  Heart,
  Globe,
  PlusCircle,
  PenTool,
  Volume2,
  Palette,
  Clapperboard,
  Wand2,
  FileMusic,
  Disc3,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ===== AFRICAN MUSIC STYLES =====
const musicStyles = [
  { id: "afrobeat", name: "Afrobeat", emoji: "🥁", desc: "Rythmes puissants, basse profonde" },
  { id: "afropop", name: "Afropop", emoji: "🎤", desc: "Pop africaine moderne et catchy" },
  { id: "amapiano", name: "Amapiano", emoji: "🎹", desc: "House sud-africaine, drums logs" },
  { id: "afro-rnb", name: "Afro R&B", emoji: "💜", desc: "R&B avec âme africaine" },
  { id: "makossa", name: "Makossa", emoji: "🎺", desc: "Groove camerounais urbain" },
  { id: "bikutsi", name: "Bikutsi", emoji: "🪘", desc: "Rythme traditionnel camerounais" },
  { id: "zouk", name: "Zouk", emoji: "🌊", desc: "Musique dansante antillaise" },
  { id: "gospel", name: "Gospel", emoji: "🙏", desc: "Louange et worship africain" },
  { id: "rap", name: "Rap Africain", emoji: "🔥", desc: "Hip-hop avec flow local" },
  { id: "highlife", name: "Highlife", emoji: "🎸", desc: "Classique ghanéen-nigérian" },
];

const themes = [
  { id: "love", name: "Amour & Romance", emoji: "❤️" },
  { id: "freedom", name: "Liberté", emoji: "🕊️" },
  { id: "party", name: "Fête & Célébration", emoji: "🎉" },
  { id: "struggle", name: "Lutte & Persévérance", emoji: "💪" },
  { id: "faith", name: "Foi & Spiritualité", emoji: "✨" },
  { id: "africa", name: "Afrique & Fierté", emoji: "🌍" },
  { id: "family", name: "Famille", emoji: "👨‍👩‍👧" },
  { id: "dreams", name: "Rêves & Ambition", emoji: "🌟" },
];

const moods = [
  { id: "joyful", name: "Joyeux", emoji: "😊", color: "from-amber-500/20 to-orange-500/20" },
  { id: "melancholic", name: "Mélancolique", emoji: "😢", color: "from-blue-500/20 to-indigo-500/20" },
  { id: "energetic", name: "Énergique", emoji: "⚡", color: "from-red-500/20 to-pink-500/20" },
  { id: "chill", name: "Chill & Détendu", emoji: "😌", color: "from-emerald-500/20 to-teal-500/20" },
  { id: "powerful", name: "Puissant", emoji: "🔥", color: "from-orange-500/20 to-red-500/20" },
  { id: "dreamy", name: "Rêveur", emoji: "💭", color: "from-purple-500/20 to-violet-500/20" },
];

// ===== STUDIO PIPELINE STEPS =====
const pipelineSteps = [
  { id: "style", name: "Style", icon: Music, desc: "Genre musical" },
  { id: "theme", name: "Thème", icon: PenTool, desc: "Vision & message" },
  { id: "mood", name: "Ambiance", icon: Volume2, desc: "Humeur" },
  { id: "details", name: "Détails", icon: FileMusic, desc: "Personnaliser" },
  { id: "generate", name: "Studio IA", icon: Wand2, desc: "Générer" },
];

// ===== GENERATION STAGES =====
const generationStages = [
  { id: "lyrics", name: "Paroles IA", icon: PenTool, duration: 3000, progress: 15 },
  { id: "composition", name: "Composition", icon: Music, duration: 2500, progress: 30 },
  { id: "voice", name: "Voix & Audio", icon: Mic, duration: 4000, progress: 55 },
  { id: "cover", name: "Pochette IA", icon: Palette, duration: 5000, progress: 80 },
  { id: "master", name: "Mix & Master", icon: Disc3, duration: 2000, progress: 95 },
];

// ===== STEP COMPONENTS =====
function StyleStep({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-4">
      <div className="text-center mb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-4">
          <Music className="w-4 h-4 text-purple-400" />
          <span className="text-sm text-purple-300">Étape 1/4</span>
        </motion.div>
        <h2 className="text-3xl font-bold text-white">Choisis ton style</h2>
        <p className="text-slate-400 mt-2">Le genre musical qui définit ton son</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {musicStyles.map((style, i) => (
          <motion.button
            key={style.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onChange(style.id)}
            className={cn(
              "glass p-4 rounded-xl text-center transition-all cursor-pointer group",
              value === style.id
                ? "border-purple-500/50 bg-purple-500/10 ring-2 ring-purple-500/30 shadow-lg shadow-purple-500/10"
                : "hover:border-purple-500/20 hover:bg-white/[0.02]"
            )}
          >
            <span className="text-3xl block mb-2 group-hover:scale-110 transition-transform">{style.emoji}</span>
            <p className={cn("text-sm font-semibold", value === style.id ? "text-purple-300" : "text-white")}>
              {style.name}
            </p>
            <p className="text-[10px] text-slate-500 mt-1">{style.desc}</p>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

function ThemeStep({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-4">
      <div className="text-center mb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-500/10 border border-pink-500/20 mb-4">
          <PenTool className="w-4 h-4 text-pink-400" />
          <span className="text-sm text-pink-300">Étape 2/4</span>
        </motion.div>
        <h2 className="text-3xl font-bold text-white">Décris ta vision</h2>
        <p className="text-slate-400 mt-2">Quel message veux-tu transmettre au monde ?</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {themes.map((theme, i) => (
          <motion.button
            key={theme.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onChange(theme.id)}
            className={cn(
              "glass p-5 rounded-xl text-center transition-all cursor-pointer group",
              value === theme.id
                ? "border-pink-500/50 bg-pink-500/10 ring-2 ring-pink-500/30 shadow-lg shadow-pink-500/10"
                : "hover:border-pink-500/20 hover:bg-white/[0.02]"
            )}
          >
            <span className="text-3xl block mb-2 group-hover:scale-110 transition-transform">{theme.emoji}</span>
            <p className={cn("text-sm font-semibold", value === theme.id ? "text-pink-300" : "text-white")}>
              {theme.name}
            </p>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

function MoodStep({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-4">
      <div className="text-center mb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 mb-4">
          <Volume2 className="w-4 h-4 text-amber-400" />
          <span className="text-sm text-amber-300">Étape 3/4</span>
        </motion.div>
        <h2 className="text-3xl font-bold text-white">Quelle ambiance ?</h2>
        <p className="text-slate-400 mt-2">L&apos;humeur guide le style de l&apos;IA</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {moods.map((mood, i) => (
          <motion.button
            key={mood.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onChange(mood.id)}
            className={cn(
              "glass p-6 rounded-xl text-center transition-all cursor-pointer group",
              value === mood.id
                ? "border-amber-500/50 bg-amber-500/10 ring-2 ring-amber-500/30 shadow-lg shadow-amber-500/10"
                : "hover:border-amber-500/20 hover:bg-white/[0.02]"
            )}
          >
            <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${mood.color} flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
              <span className="text-2xl">{mood.emoji}</span>
            </div>
            <p className={cn("text-sm font-semibold", value === mood.id ? "text-amber-300" : "text-white")}>
              {mood.name}
            </p>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

function CustomizeStep({
  title,
  onTitleChange,
  additionalPrompt,
  onAdditionalPromptChange,
}: {
  title: string;
  onTitleChange: (v: string) => void;
  additionalPrompt: string;
  onAdditionalPromptChange: (v: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4">
          <FileMusic className="w-4 h-4 text-emerald-400" />
          <span className="text-sm text-emerald-300">Étape 4/4</span>
        </motion.div>
        <h2 className="text-3xl font-bold text-white">Personnalise ta chanson</h2>
        <p className="text-slate-400 mt-2">Les détails finaux avant que l&apos;IA crée ton hit</p>
      </div>

      <div className="max-w-lg mx-auto space-y-5">
        <div className="space-y-2">
          <Label className="text-slate-300 text-sm">Titre de la chanson *</Label>
          <Input
            placeholder="Ex: Rêves d'Afrique"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-purple-500/50 h-12 text-lg"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-slate-300 text-sm">Instructions supplémentaires (optionnel)</Label>
          <Textarea
            placeholder="Décris des détails spécifiques : tempo, instruments, références d'artistes, langues à mélanger..."
            value={additionalPrompt}
            onChange={(e) => onAdditionalPromptChange(e.target.value)}
            rows={4}
            className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-purple-500/50 resize-none"
          />
        </div>

        <div className="glass p-4 rounded-xl space-y-3">
          <p className="text-xs font-semibold text-purple-300 uppercase tracking-wider">Ce que l&apos;IA va créer</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: PenTool, label: "Paroles originales", color: "text-pink-400" },
              { icon: Music, label: "Composition musicale", color: "text-purple-400" },
              { icon: Mic, label: "Voix & Audio IA", color: "text-amber-400" },
              { icon: Palette, label: "Pochette album", color: "text-emerald-400" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <item.icon className={`w-4 h-4 ${item.color}`} />
                <span className="text-slate-300">{item.label}</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-slate-500">Coût: 7 crédits • ~30 secondes</p>
        </div>
      </div>
    </div>
  );
}

function GeneratingStep({ progress, status, currentStage }: { progress: number; status: string; currentStage: number }) {
  return (
    <div className="space-y-8 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative w-40 h-40 mx-auto"
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 animate-pulse" />
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-purple-600/20 to-pink-600/20 animate-pulse" style={{ animationDelay: "0.5s" }} />
        <div className="absolute inset-6 rounded-full bg-gradient-to-br from-purple-700/30 to-pink-700/30 flex items-center justify-center">
          <Sparkles className="w-14 h-14 text-purple-400 animate-pulse" />
        </div>
      </motion.div>

      <div>
        <h2 className="text-3xl font-bold text-white mb-3">Le studio IA travaille...</h2>
        <p className="text-slate-400 text-lg">{status}</p>
      </div>

      {/* Generation stages tracker */}
      <div className="max-w-md mx-auto space-y-3">
        {generationStages.map((stage, i) => (
          <div key={stage.id} className="flex items-center gap-3">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center transition-all",
              i < currentStage ? "bg-emerald-500/20" :
              i === currentStage ? "bg-purple-500/20 animate-pulse" :
              "bg-white/5"
            )}>
              {i < currentStage ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : i === currentStage ? (
                <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
              ) : (
                <stage.icon className="w-4 h-4 text-slate-500" />
              )}
            </div>
            <div className="flex-1">
              <p className={cn(
                "text-sm font-medium",
                i < currentStage ? "text-emerald-300" :
                i === currentStage ? "text-purple-300" :
                "text-slate-500"
              )}>
                {stage.name}
              </p>
              {i === currentStage && (
                <div className="h-1 bg-white/5 rounded-full mt-1 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: `${((progress - (stage.progress - 15)) / 15) * 100}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="max-w-sm mx-auto">
        <Progress value={progress} className="h-2 bg-white/5 [&>div]:bg-gradient-to-r [&>div]:from-purple-500 [&>div]:to-pink-500" />
        <p className="text-xs text-slate-500 mt-2">{progress}% — Ne ferme pas la page</p>
      </div>
    </div>
  );
}

function ResultStep({
  songTitle,
  style,
  songId,
  coverUrl,
  audioUrl,
  lyrics,
  duration,
}: {
  songTitle: string;
  style: string;
  songId: string;
  coverUrl: string;
  audioUrl: string;
  lyrics: string;
  duration: number;
}) {
  const router = useRouter();
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  useEffect(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.src = audioUrl;
    }
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => toast.error("Audio non disponible"));
    }
    setIsPlaying(!isPlaying);
  };

  const handleDownload = () => {
    if (audioUrl) {
      const a = document.createElement("a");
      a.href = audioUrl;
      a.download = `${songTitle}.mp3`;
      a.click();
      toast.success("Téléchargement lancé !");
    } else {
      toast.info("Audio en préparation...");
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/song/${songId}`;
    navigator.clipboard?.writeText(url);
    toast.success("Lien copié ! 🎵");
  };

  const durationMin = formatTime(duration);

  return (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.6 }}
          className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4 glow-green"
        >
          <Check className="w-10 h-10 text-emerald-400" />
        </motion.div>
        <h2 className="text-3xl font-bold text-white">Ta chanson est prête ! 🎵</h2>
        <p className="text-slate-400 mt-2">Écoute, télécharge ou partage ta création</p>
      </div>

      <Card className="glass p-6 max-w-lg mx-auto">
        {/* Cover art */}
        <div className="w-full aspect-square rounded-xl overflow-hidden mb-4 relative">
          {coverUrl && !coverUrl.startsWith("/covers/") ? (
            <img src={coverUrl} alt={songTitle} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-500/30 via-pink-500/20 to-amber-500/20 flex items-center justify-center">
              <Music className="w-20 h-20 text-white/40" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <p className="text-white font-bold text-xl">{songTitle}</p>
            <p className="text-white/70 text-sm">{style}</p>
          </div>
        </div>

        {/* Real Audio Player */}
        <div className="bg-white/5 rounded-lg p-4 flex items-center gap-3 mb-4">
          <audio
            ref={audioRef}
            onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
            onEnded={() => setIsPlaying(false)}
          />
          <Button
            size="icon"
            className="w-12 h-12 rounded-full btn-gradient text-white flex-shrink-0"
            onClick={togglePlay}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </Button>
          <div className="flex-1">
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : "0%" }}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[11px] text-slate-400">{formatTime(currentTime)}</span>
              <span className="text-[11px] text-slate-400">{durationMin}</span>
            </div>
          </div>
        </div>

        {/* Lyrics preview */}
        {lyrics && (
          <div className="bg-white/5 rounded-lg p-4 mb-4 max-h-40 overflow-y-auto">
            <p className="text-[10px] font-semibold text-purple-300 uppercase tracking-wider mb-2">Paroles</p>
            <p className="text-sm text-slate-300 whitespace-pre-line leading-relaxed">{lyrics.substring(0, 300)}{lyrics.length > 300 ? "..." : ""}</p>
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-3 gap-2">
          <Button variant="ghost" className="text-slate-400 hover:text-white hover:bg-white/5 flex-col gap-1 h-auto py-3" onClick={handleDownload}>
            <Download className="w-4 h-4" />
            <span className="text-[10px]">Télécharger</span>
          </Button>
          <Button variant="ghost" className="text-slate-400 hover:text-white hover:bg-white/5 flex-col gap-1 h-auto py-3" onClick={handleShare}>
            <Share2 className="w-4 h-4" />
            <span className="text-[10px]">Partager</span>
          </Button>
          <Button variant="ghost" className="text-slate-400 hover:text-pink-400 hover:bg-pink-500/5 flex-col gap-1 h-auto py-3" onClick={() => toast.success("Ajouté aux favoris ! ❤️")}>
            <Heart className="w-4 h-4" />
            <span className="text-[10px]">Favoris</span>
          </Button>
        </div>
      </Card>

      <div className="flex items-center justify-center gap-3">
        <Button
          variant="outline"
          className="border-white/10 text-white hover:bg-white/5"
          onClick={() => router.push(`/song/${songId}`)}
        >
          Voir ma chanson
        </Button>
        <Button
          className="btn-gradient text-white font-bold"
          onClick={() => router.push("/create")}
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Créer encore
        </Button>
      </div>
    </div>
  );
}

// ===== MAIN CREATE PAGE =====
export default function CreatePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [step, setStep] = useState(0);
  const [style, setStyle] = useState("");
  const [theme, setTheme] = useState("");
  const [mood, setMood] = useState("");
  const [title, setTitle] = useState("");
  const [additionalPrompt, setAdditionalPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [currentStage, setCurrentStage] = useState(0);
  const [songId, setSongId] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [duration, setDuration] = useState(180);
  const [credits, setCredits] = useState<number | null>(null);
  const abortRef = useRef(false);

  const userId = (session?.user as any)?.id as string | undefined;
  const userName = session?.user?.name || "Créateur";
  const userPlan = (session?.user as any)?.plan || "decouverte";

  // Fetch user credits
  useEffect(() => {
    if (userId) {
      fetch(`/api/me/credits?userId=${userId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.credits) setCredits(data.credits.credits);
        })
        .catch(() => {});
    }
  }, [userId]);

  const canNext = () => {
    switch (step) {
      case 0: return !!style;
      case 1: return !!theme;
      case 2: return !!mood;
      case 3: return !!title.trim();
      default: return false;
    }
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else if (step === 3) {
      if (!userId) {
        toast.error("Tu dois être connecté pour générer une chanson");
        return;
      }

      if (credits !== null && credits < 7) {
        toast.error("Crédits insuffisants. Passe à un plan supérieur.");
        router.push("/subscription");
        return;
      }

      // Start generation
      setStep(4);
      setGenerating(true);
      setProgress(0);
      setStatusText("Analyse de ta demande...");
      setCurrentStage(0);
      abortRef.current = false;

      // Show generation stages progressively
      let elapsed = 0;
      generationStages.forEach((stage, i) => {
        elapsed += stage.duration;
        setTimeout(() => {
          if (!abortRef.current) {
            setCurrentStage(i);
            setProgress(stage.progress);
            setStatusText(`${stage.name} en cours...`);
          }
        }, elapsed - stage.duration);
      });

      // Call the real AI generation API
      fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          style,
          theme,
          mood,
          title,
          language: "fr",
          additionalPrompt,
          generateCover: true,
          generateAudio: true,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (abortRef.current) return;

          if (data.error) {
            toast.error(data.error);
            setStep(3);
            setGenerating(false);
            return;
          }

          // Complete all stages
          setCurrentStage(generationStages.length);
          setProgress(100);
          setStatusText("Ta chanson est prête !");

          setTimeout(() => {
            if (abortRef.current) return;
            setGenerating(false);
            setSongId(data.song.id);
            setCoverUrl(data.song.coverUrl);
            setAudioUrl(data.song.audioUrl);
            setLyrics(data.song.lyrics || "");
            setDuration(data.song.duration || 180);
            setStep(5);
            toast.success("Ta chanson est prête ! 🎵");
          }, 800);
        })
        .catch((err) => {
          if (abortRef.current) return;
          console.error("Generation fetch error:", err);
          toast.error("Erreur lors de la génération. Réessaie.");
          setStep(3);
          setGenerating(false);
        });
    }
  };

  const handleBack = () => {
    if (step > 0 && step < 5) setStep(step - 1);
  };

  return (
    <div className="min-h-screen bg-[#0B0B14]">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        userPlan={userPlan}
        songsRemaining={credits ? Math.floor(credits / 7) : 3}
        songsTotal={credits ? Math.floor(credits / 7) : 3}
      />

      <main className={`transition-all duration-300 ${sidebarCollapsed ? "ml-[72px]" : "ml-[280px]"}`}>
        <Header title="Studio de création" userName={userName} userPlan={userPlan} />

        <div className="p-6 max-w-5xl mx-auto">
          {/* Studio Pipeline Header */}
          {step < 5 && (
            <div className="mb-10">
              {/* Pipeline visualization */}
              <div className="flex items-center justify-between mb-2">
                {pipelineSteps.map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <div key={s.id} className="flex items-center flex-1 last:flex-none">
                      <div className="flex flex-col items-center">
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center transition-all cursor-pointer",
                            i < step ? "bg-emerald-500/20 border border-emerald-500/30" :
                            i === step ? "btn-gradient shadow-lg shadow-purple-500/20" :
                            "bg-white/5 border border-white/5"
                          )}
                          onClick={() => i < step && setStep(i)}
                        >
                          {i < step ? (
                            <Check className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <Icon className={cn("w-5 h-5", i === step ? "text-white" : "text-slate-500")} />
                          )}
                        </motion.div>
                        <p className={cn(
                          "text-[10px] mt-2 font-medium",
                          i <= step ? "text-white" : "text-slate-500"
                        )}>
                          {s.name}
                        </p>
                      </div>
                      {i < pipelineSteps.length - 1 && (
                        <div className={cn(
                          "flex-1 h-px mx-3 mt-[-12px]",
                          i < step ? "bg-emerald-500/30" : "bg-white/5"
                        )} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Credits indicator */}
          {credits !== null && step < 5 && (
            <div className="flex items-center justify-end mb-4">
              <Badge variant="outline" className="border-purple-500/30 text-purple-300 bg-purple-500/5">
                <Sparkles className="w-3 h-3 mr-1" />
                {credits} crédits
              </Badge>
            </div>
          )}

          {/* Step content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
            >
              {step === 0 && <StyleStep value={style} onChange={setStyle} />}
              {step === 1 && <ThemeStep value={theme} onChange={setTheme} />}
              {step === 2 && <MoodStep value={mood} onChange={setMood} />}
              {step === 3 && (
                <CustomizeStep
                  title={title}
                  onTitleChange={setTitle}
                  additionalPrompt={additionalPrompt}
                  onAdditionalPromptChange={setAdditionalPrompt}
                />
              )}
              {step === 4 && (
                <GeneratingStep
                  progress={progress}
                  status={statusText}
                  currentStage={currentStage}
                />
              )}
              {step === 5 && songId && (
                <ResultStep
                  songTitle={title}
                  style={musicStyles.find(s => s.id === style)?.name || style}
                  songId={songId}
                  coverUrl={coverUrl}
                  audioUrl={audioUrl}
                  lyrics={lyrics}
                  duration={duration}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation buttons */}
          {step < 5 && step !== 4 && (
            <div className="flex items-center justify-between mt-10 pt-6 border-t border-white/5">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={step === 0}
                className="text-slate-400 hover:text-white hover:bg-white/5"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>

              <Button
                onClick={handleNext}
                disabled={!canNext()}
                className="btn-gradient text-white font-bold shadow-lg shadow-purple-500/25 hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100 px-8"
              >
                {step === 3 ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Lancer le studio IA
                  </>
                ) : (
                  <>
                    Suivant
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
