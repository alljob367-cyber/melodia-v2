"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
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
  Download,
  Share2,
  Heart,
  Globe,
  PlusCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ===== AFRICAN MUSIC STYLES =====
const musicStyles = [
  { id: "afrobeat", name: "Afrobeat", emoji: "🥁", desc: "Rythmes puissant, basse profonde" },
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

// ===== STEP COMPONENTS =====
function StyleStep({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white">Choisis ton style</h2>
        <p className="text-slate-400 text-sm mt-2">Sélectionne le genre musical qui correspond à ta vision</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {musicStyles.map((style) => (
          <motion.button
            key={style.id}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onChange(style.id)}
            className={cn(
              "glass p-4 rounded-xl text-center transition-all cursor-pointer",
              value === style.id
                ? "border-purple-500/40 bg-purple-500/10 ring-1 ring-purple-500/30"
                : "hover:border-purple-500/20"
            )}
          >
            <span className="text-2xl">{style.emoji}</span>
            <p className={cn("text-sm font-semibold mt-2", value === style.id ? "text-purple-400" : "text-white")}>
              {style.name}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">{style.desc}</p>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

function ThemeStep({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white">Décris ta vision</h2>
        <p className="text-slate-400 text-sm mt-2">Quel message veux-tu transmettre ?</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {themes.map((theme) => (
          <motion.button
            key={theme.id}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onChange(theme.id)}
            className={cn(
              "glass p-5 rounded-xl text-center transition-all cursor-pointer",
              value === theme.id
                ? "border-purple-500/40 bg-purple-500/10 ring-1 ring-purple-500/30"
                : "hover:border-purple-500/20"
            )}
          >
            <span className="text-2xl">{theme.emoji}</span>
            <p className={cn("text-sm font-semibold mt-2", value === theme.id ? "text-purple-400" : "text-white")}>
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
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white">Quelle ambiance ?</h2>
        <p className="text-slate-400 text-sm mt-2">L&apos;humeur de ta chanson guide l&apos;IA</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {moods.map((mood) => (
          <motion.button
            key={mood.id}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onChange(mood.id)}
            className={cn(
              "glass p-6 rounded-xl text-center transition-all cursor-pointer",
              value === mood.id
                ? "border-purple-500/40 bg-purple-500/10 ring-1 ring-purple-500/30"
                : "hover:border-purple-500/20"
            )}
          >
            <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${mood.color} flex items-center justify-center mx-auto mb-3`}>
              <span className="text-xl">{mood.emoji}</span>
            </div>
            <p className={cn("text-sm font-semibold", value === mood.id ? "text-purple-400" : "text-white")}>
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
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white">Personnalise ta chanson</h2>
        <p className="text-slate-400 text-sm mt-2">Ajoute les détails finaux avant la génération</p>
      </div>

      <div className="max-w-lg mx-auto space-y-5">
        <div className="space-y-2">
          <Label className="text-slate-300">Titre de la chanson</Label>
          <Input
            placeholder="Ex: Rêves d'Afrique"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-purple-500/50"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-slate-300">Instructions supplémentaires (optionnel)</Label>
          <Textarea
            placeholder="Décris des détails spécifiques : tempo, instruments, références..."
            value={additionalPrompt}
            onChange={(e) => onAdditionalPromptChange(e.target.value)}
            rows={4}
            className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-purple-500/50 resize-none"
          />
        </div>
      </div>
    </div>
  );
}

function GeneratingStep({ progress, status }: { progress: number; status: string }) {
  return (
    <div className="space-y-8 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative w-32 h-32 mx-auto"
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 animate-pulse" />
        <div className="absolute inset-4 rounded-full bg-gradient-to-br from-purple-600/30 to-pink-600/30 flex items-center justify-center">
          <Sparkles className="w-12 h-12 text-purple-400" />
        </div>
      </motion.div>

      <div>
        <h2 className="text-2xl font-bold text-white mb-2">L&apos;IA crée ta chanson...</h2>
        <p className="text-slate-400">{status}</p>
      </div>

      <div className="max-w-sm mx-auto">
        <Progress value={progress} className="h-3 bg-white/5 [&>div]:bg-gradient-to-r [&>div]:from-purple-500 [&>div]:to-pink-500" />
        <p className="text-xs text-slate-500 mt-2">{progress}%</p>
      </div>
    </div>
  );
}

function ResultStep({ songTitle, style }: { songTitle: string; style: string }) {
  const router = useRouter();

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
        <h2 className="text-2xl font-bold text-white">Ta chanson est prête ! 🎵</h2>
        <p className="text-slate-400 text-sm mt-2">Écoute, télécharge ou partage ta création</p>
      </div>

      <Card className="glass p-6 max-w-md mx-auto">
        {/* Cover art */}
        <div className="w-full aspect-square rounded-xl bg-gradient-to-br from-purple-500/30 via-pink-500/20 to-amber-500/20 flex items-center justify-center mb-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <Music className="w-16 h-16 text-white/60" />
          <div className="absolute bottom-3 left-3 right-3">
            <p className="text-white font-bold text-lg">{songTitle}</p>
            <p className="text-white/70 text-sm">{style}</p>
          </div>
        </div>

        {/* Player */}
        <div className="bg-white/5 rounded-lg p-3 flex items-center gap-3 mb-4">
          <Button size="icon" className="w-10 h-10 rounded-full btn-gradient text-white flex-shrink-0">
            <Play className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <div className="h-1 bg-white/10 rounded-full">
              <div className="h-1 w-1/3 rounded-full btn-gradient" />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-slate-500">1:12</span>
              <span className="text-[10px] text-slate-500">3:24</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-3 gap-2">
          <Button variant="ghost" className="text-slate-400 hover:text-white hover:bg-white/5 flex-col gap-1 h-auto py-3">
            <Download className="w-4 h-4" />
            <span className="text-[10px]">Télécharger</span>
          </Button>
          <Button variant="ghost" className="text-slate-400 hover:text-white hover:bg-white/5 flex-col gap-1 h-auto py-3">
            <Share2 className="w-4 h-4" />
            <span className="text-[10px]">Partager</span>
          </Button>
          <Button variant="ghost" className="text-slate-400 hover:text-pink-400 hover:bg-pink-500/5 flex-col gap-1 h-auto py-3">
            <Heart className="w-4 h-4" />
            <span className="text-[10px]">Favoris</span>
          </Button>
        </div>
      </Card>

      <div className="flex items-center justify-center gap-3">
        <Button
          variant="outline"
          className="border-white/10 text-white hover:bg-white/5"
          onClick={() => router.push("/creations")}
        >
          Voir mes créations
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

  const steps = ["Style", "Thème", "Ambiance", "Détails", "Générer"];

  const canNext = () => {
    switch (step) {
      case 0: return !!style;
      case 1: return !!theme;
      case 2: return !!mood;
      case 3: return !!title;
      default: return false;
    }
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else if (step === 3) {
      // Start generation
      setStep(4);
      setGenerating(true);
      setProgress(0);
      setStatusText("Analyse de ta demande...");

      // Simulate generation
      const stages = [
        { p: 15, text: "Analyse de ta demande...", delay: 800 },
        { p: 30, text: "Génération des paroles...", delay: 1500 },
        { p: 50, text: "Composition musicale...", delay: 2000 },
        { p: 70, text: "Synthèse vocale IA...", delay: 1500 },
        { p: 85, text: "Création de la pochette...", delay: 1000 },
        { p: 95, text: "Finalisation de l'audio...", delay: 800 },
        { p: 100, text: "Ta chanson est prête !", delay: 500 },
      ];

      let elapsed = 0;
      stages.forEach((stage) => {
        elapsed += stage.delay;
        setTimeout(() => {
          setProgress(stage.p);
          setStatusText(stage.text);
          if (stage.p === 100) {
            setTimeout(() => {
              setGenerating(false);
              setStep(5);
              toast.success("Ta chanson est prête ! 🎵");
            }, 500);
          }
        }, elapsed);
      });
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  return (
    <div className="min-h-screen bg-[#0B0B14]">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        userPlan="basic"
        songsRemaining={2}
        songsTotal={2}
      />

      <main className={`transition-all duration-300 ${sidebarCollapsed ? "ml-[72px]" : "ml-[280px]"}`}>
        <Header title="Créer une chanson" userName="Jean Paul" userPlan="basic" />

        <div className="p-6 max-w-4xl mx-auto">
          {/* Progress steps */}
          {step < 5 && (
            <div className="flex items-center justify-center gap-2 mb-8">
              {steps.map((s, i) => (
                <div key={i} className="flex items-center">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                    i < step ? "bg-emerald-500/20 text-emerald-400" :
                    i === step ? "btn-gradient text-white" :
                    "bg-white/5 text-slate-500"
                  )}>
                    {i < step ? <Check className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className={cn(
                    "text-xs ml-1.5 hidden sm:block",
                    i <= step ? "text-white font-medium" : "text-slate-500"
                  )}>
                    {s}
                  </span>
                  {i < steps.length - 1 && (
                    <div className={cn(
                      "w-6 sm:w-12 h-px mx-2",
                      i < step ? "bg-emerald-500/30" : "bg-white/10"
                    )} />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Step content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
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
              {step === 4 && <GeneratingStep progress={progress} status={statusText} />}
              {step === 5 && (
                <ResultStep
                  songTitle={title}
                  style={musicStyles.find(s => s.id === style)?.name || style}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation buttons */}
          {step < 5 && step !== 4 && (
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/5">
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
                className="btn-gradient text-white font-bold shadow-lg shadow-purple-500/25 hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
              >
                {step === 3 ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Générer ma chanson
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
