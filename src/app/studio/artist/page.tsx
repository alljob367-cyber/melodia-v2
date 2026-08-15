"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Palette,
  User,
  Brain,
  Mic,
  Sparkles,
  Save,
  Upload,
  X,
  Check,
  Zap,
  Music,
  TrendingUp,
  BarChart3,
  CreditCard,
  Layers,
  Eye,
  Globe,
  ImageIcon,
  Loader2,
  ChevronRight,
  Wand2,
  Headphones,
  Radio,
  Disc3,
} from "lucide-react";

import { AppLayout } from "@/components/dashboard/app-layout";
import { StudioGate } from "@/components/core/permission-gate";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

import { useArtists, useUpdateArtist, useArtistStudioIdentity } from "@/hooks/use-core-queries";
import { useMelodia, useCredits } from "@/contexts/melodia-context";

// ============ CONSTANTS ============

const VISUAL_STYLES = [
  { id: "minimal", label: "Minimal", icon: Layers, preview: "from-slate-600 to-slate-800" },
  { id: "vibrant", label: "Vibrant", icon: Sparkles, preview: "from-pink-500 to-amber-400" },
  { id: "dark", label: "Dark", icon: Eye, preview: "from-gray-900 to-gray-700" },
  { id: "afrofuturist", label: "Afrofuturist", icon: Radio, preview: "from-purple-600 to-cyan-400" },
  { id: "vintage", label: "Vintage", icon: Disc3, preview: "from-amber-600 to-yellow-400" },
  { id: "nature", label: "Nature", icon: Globe, preview: "from-emerald-500 to-teal-400" },
] as const;

const COLOR_PALETTES = [
  { id: "royal", label: "Royal", primary: "#7C3AED", accent: "#EC4899" },
  { id: "sunset", label: "Sunset", primary: "#F59E0B", accent: "#EF4444" },
  { id: "ocean", label: "Ocean", primary: "#06B6D4", accent: "#3B82F6" },
  { id: "earth", label: "Earth", primary: "#92400E", accent: "#D97706" },
  { id: "neon", label: "Neon", primary: "#22C55E", accent: "#A855F7" },
  { id: "fire", label: "Fire", primary: "#DC2626", accent: "#F97316" },
  { id: "sahel", label: "Sahel", primary: "#B45309", accent: "#65A30D" },
  { id: "kongo", label: "Kongo", primary: "#7C3AED", accent: "#14B8A6" },
] as const;

const AFRICAN_COUNTRIES = [
  "Sénégal", "Côte d'Ivoire", "Mali", "Cameroun", "Nigeria", "Ghana",
  "Congo", "RDC", "Afrique du Sud", "Kenya", "Tanzanie", "Éthiopie",
  "Maroc", "Algérie", "Tunisie", "Égypte", "Madagascar", "Burkina Faso",
  "Guinée", "Bénin", "Togo", "Niger", "Tchad", "Gabon",
] as const;

const GENRE_OPTIONS = [
  "Afrobeat", "Amapiano", "Afropop", "Afro-fusion", "Hip-Hop",
  "R&B", "Soul", "Jazz", "Mbalax", "Highlife", "Kizomba",
  "Soukous", "Ndombolo", "Griot", "Taarab", "Kwaito",
  "Gqom", "Shangaan Electro", "Sungura", "Coupe Decale",
] as const;

// ============ ANIMATION VARIANTS ============

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
} as const;

const scaleVariants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: "easeOut" as const } },
} as const;

// ============ MAIN COMPONENT ============

export default function ArtistStudioPage() {
  const { context } = useMelodia();
  const { effective } = useCredits();
  const { data: artists, isLoading: artistsLoading } = useArtists();
  const updateArtist = useUpdateArtist();
  const updateIdentity = useArtistStudioIdentity();

  // Derive the current artist
  const currentArtist = Array.isArray(artists) ? artists[0] : null;
  const artistId = context?.activeArtistId || currentArtist?.id || "";

  // Form state
  const [name, setName] = useState(currentArtist?.name || "");
  const [bio, setBio] = useState(currentArtist?.bio || "");
  const [country, setCountry] = useState(currentArtist?.country || "");
  const [selectedGenres, setSelectedGenres] = useState<string[]>(
    currentArtist?.genres || []
  );
  const [visualStyle, setVisualStyle] = useState(
    currentArtist?.visualStyle || "afrofuturist"
  );
  const [selectedPalette, setSelectedPalette] = useState("royal");
  const [customPrimary, setCustomPrimary] = useState("#7C3AED");
  const [customAccent, setCustomAccent] = useState("#EC4899");
  const [referenceUrls, setReferenceUrls] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [aiProducerLoading, setAiProducerLoading] = useState(false);
  const [voiceStudioLoading, setVoiceStudioLoading] = useState(false);

  // Analytics mock data (would come from API in production)
  const analytics = {
    totalGenerations: 47,
    mostUsedStyle: "Afrofuturist",
    creditsUsedThisMonth: 128,
    monthlyTrend: [12, 18, 9, 22, 15, 28, 20, 35, 18, 42, 25, 31],
  };

  // Toggle genre selection
  const toggleGenre = useCallback((genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  }, []);

  // Add reference image URL
  const addReferenceUrl = useCallback(() => {
    if (!urlInput.trim()) return;
    try {
      new URL(urlInput.trim());
      setReferenceUrls((prev) => [...prev, urlInput.trim()]);
      setUrlInput("");
    } catch {
      toast.error("URL invalide");
    }
  }, [urlInput]);

  // Remove reference image
  const removeReference = useCallback((index: number) => {
    setReferenceUrls((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Save handler
  const handleSave = useCallback(async () => {
    if (!artistId) {
      toast.error("Aucun artiste sélectionné");
      return;
    }
    setIsSaving(true);
    try {
      const palette = COLOR_PALETTES.find((p) => p.id === selectedPalette);
      await updateArtist.mutateAsync({
        id: artistId,
        name: name,
        bio: bio,
        visualStyle: visualStyle,
        colorPalette: palette
          ? [palette.primary, palette.accent]
          : [customPrimary, customAccent],
      } as any);

      await updateIdentity.mutateAsync({
        artistId,
        visualStyle,
        colorPalette: palette
          ? [palette.primary, palette.accent]
          : [customPrimary, customAccent],
        referenceImageUrls: referenceUrls,
      });

      toast.success("Identité artiste mise à jour !");
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la sauvegarde");
    } finally {
      setIsSaving(false);
    }
  }, [
    artistId, name, bio, visualStyle, selectedPalette,
    customPrimary, customAccent, referenceUrls,
    updateArtist, updateIdentity,
  ]);

  // AI Producer handler
  const handleAiProducer = useCallback(async () => {
    setAiProducerLoading(true);
    toast.info("Producer IA en cours de r\u00e9flexion...", {
      description: "Analyse de votre profil artiste...",
    });
    // Simulate AI processing
    setTimeout(() => {
      setAiProducerLoading(false);
      toast.success("Suggestions du Producer IA pr\u00eates !", {
        description: "3 directions cr\u00e9atives, 2 ideas de collaboration",
      });
    }, 2500);
  }, []);

  // Voice Studio handler
  const handleVoiceStudio = useCallback(async () => {
    setVoiceStudioLoading(true);
    toast.info("Voice Studio en pr\u00e9paration...", {
      description: "Chargement des mod\u00e8les vocaux...",
    });
    setTimeout(() => {
      setVoiceStudioLoading(false);
      toast.success("Voice Studio pr\u00eat !", {
        description: "5 styles vocaux disponibles",
      });
    }, 2000);
  }, []);

  const currentPalette = COLOR_PALETTES.find((p) => p.id === selectedPalette);

  // ============ RENDER ============

  return (
    <AppLayout title="Artist Studio">
      <StudioGate studio="artist" showUpgrade={true}>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6 sm:space-y-8 max-w-6xl mx-auto"
        >
          {/* ===== WELCOME HEADER ===== */}
          <motion.div variants={itemVariants}>
            <Card className="glass p-6 sm:p-8 relative overflow-hidden border-purple-500/15">
              <div className="absolute top-0 right-0 w-72 h-72 bg-purple-500/8 rounded-full blur-[100px]" />
              <div className="absolute bottom-0 left-1/4 w-56 h-56 bg-pink-500/6 rounded-full blur-[80px]" />
              <div className="absolute top-1/2 right-1/3 w-32 h-32 bg-amber-500/5 rounded-full blur-[60px]" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                    <Palette className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold gradient-text">
                      Artist Studio
                    </h1>
                    <p className="text-sm text-slate-400">
                      Construis ton identit\u00e9 d&apos;artiste unique
                    </p>
                  </div>
                </div>
                <p className="text-slate-400 text-sm sm:text-base max-w-2xl">
                  D\u00e9finis ton style visuel, choisis tes couleurs, et laisse l&apos;IA t&apos;aider
                  \u00e0 forger une image de marque qui te ressemble. L&apos;Artist Studio
                  est ton espace cr\u00e9atif pour briller sur la sc\u00e8ne africaine et au-del\u00e0.
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  <Badge variant="outline" className="border-purple-500/30 text-purple-300 bg-purple-500/10">
                    <User className="w-3 h-3 mr-1" />
                    Identit\u00e9
                  </Badge>
                  <Badge variant="outline" className="border-pink-500/30 text-pink-300 bg-pink-500/10">
                    <Brain className="w-3 h-3 mr-1" />
                    Producer IA
                  </Badge>
                  <Badge variant="outline" className="border-amber-500/30 text-amber-300 bg-amber-500/10">
                    <Mic className="w-3 h-3 mr-1" />
                    Voice Studio
                  </Badge>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* ===== ARTIST IDENTITY SECTION ===== */}
          <motion.div variants={itemVariants}>
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-purple-400" />
              <h2 className="text-xl font-bold text-white">Identit\u00e9 Artiste</h2>
              <Badge variant="outline" className="text-[10px] border-purple-500/30 text-purple-300 ml-1">
                Profil
              </Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* --- Left column: Profile fields --- */}
              <div className="lg:col-span-2 space-y-5">
                {/* Name & Country row */}
                <Card className="glass p-5 border-purple-500/10">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-300 text-sm flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-purple-400" />
                        Nom d&apos;artiste
                      </Label>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: Burna Boy, Aya Nakamura..."
                        className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-purple-500/40"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300 text-sm flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-emerald-400" />
                        Pays
                      </Label>
                      <Select value={country} onValueChange={setCountry}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue placeholder="S\u00e9lectionne ton pays" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#16162A] border-white/10">
                          {AFRICAN_COUNTRIES.map((c) => (
                            <SelectItem key={c} value={c} className="text-white focus:bg-purple-500/20 focus:text-white">
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </Card>

                {/* Bio */}
                <Card className="glass p-5 border-purple-500/10">
                  <div className="space-y-2">
                    <Label className="text-slate-300 text-sm flex items-center gap-1.5">
                      <Music className="w-3.5 h-3.5 text-pink-400" />
                      Biographie
                    </Label>
                    <Textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Raconte ton histoire, tes influences, ta vision musicale..."
                      rows={4}
                      className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-purple-500/40 resize-none"
                    />
                    <p className="text-xs text-slate-500">{bio.length}/500 caract\u00e8res</p>
                  </div>
                </Card>

                {/* Genres */}
                <Card className="glass p-5 border-purple-500/10">
                  <div className="space-y-3">
                    <Label className="text-slate-300 text-sm flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-amber-400" />
                      Genres musicaux
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {GENRE_OPTIONS.map((genre) => {
                        const isSelected = selectedGenres.includes(genre);
                        return (
                          <motion.button
                            key={genre}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => toggleGenre(genre)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              isSelected
                                ? "bg-purple-500/25 text-purple-300 border border-purple-500/40 shadow-sm shadow-purple-500/10"
                                : "bg-white/5 text-slate-400 border border-white/8 hover:bg-white/8 hover:text-slate-300"
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 inline mr-1" />}
                            {genre}
                          </motion.button>
                        );
                      })}
                    </div>
                    {selectedGenres.length > 0 && (
                      <p className="text-xs text-slate-500">
                        {selectedGenres.length} genre{selectedGenres.length > 1 ? "s" : ""} s\u00e9lectionn\u00e9{selectedGenres.length > 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                </Card>

                {/* Visual Style */}
                <Card className="glass p-5 border-purple-500/10">
                  <div className="space-y-3">
                    <Label className="text-slate-300 text-sm flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-cyan-400" />
                      Style visuel
                    </Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {VISUAL_STYLES.map((style) => {
                        const isActive = visualStyle === style.id;
                        return (
                          <motion.button
                            key={style.id}
                            whileHover={{ scale: 1.03, y: -2 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => setVisualStyle(style.id)}
                            className={`relative rounded-xl p-4 text-left transition-all overflow-hidden ${
                              isActive
                                ? "border-2 border-purple-500/60 shadow-lg shadow-purple-500/15"
                                : "border border-white/8 hover:border-white/15"
                            }`}
                          >
                            {/* Gradient preview background */}
                            <div
                              className={`absolute inset-0 bg-gradient-to-br ${style.preview} ${
                                isActive ? "opacity-25" : "opacity-10"
                              }`}
                            />
                            <div className="relative">
                              <div className="flex items-center gap-2 mb-2">
                                <style.icon
                                  className={`w-4 h-4 ${isActive ? "text-purple-300" : "text-slate-400"}`}
                                />
                                {isActive && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="w-2 h-2 rounded-full bg-purple-400"
                                  />
                                )}
                              </div>
                              <p
                                className={`text-sm font-medium ${
                                  isActive ? "text-white" : "text-slate-300"
                                }`}
                              >
                                {style.label}
                              </p>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                </Card>

                {/* Color Palette */}
                <Card className="glass p-5 border-purple-500/10">
                  <div className="space-y-4">
                    <Label className="text-slate-300 text-sm flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-pink-400" />
                      Palette de couleurs
                    </Label>

                    {/* Preset palettes */}
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                      {COLOR_PALETTES.map((palette) => {
                        const isActive = selectedPalette === palette.id;
                        return (
                          <motion.button
                            key={palette.id}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => {
                              setSelectedPalette(palette.id);
                              setCustomPrimary(palette.primary);
                              setCustomAccent(palette.accent);
                            }}
                            className={`relative rounded-xl p-2 text-center transition-all ${
                              isActive
                                ? "ring-2 ring-purple-500/60 ring-offset-2 ring-offset-[#16162A]"
                                : "hover:scale-105"
                            }`}
                          >
                            <div className="flex gap-0.5 mb-1.5">
                              <div
                                className="w-5 h-5 rounded-l-md"
                                style={{ backgroundColor: palette.primary }}
                              />
                              <div
                                className="w-5 h-5 rounded-r-md"
                                style={{ backgroundColor: palette.accent }}
                              />
                            </div>
                            <p className="text-[10px] text-slate-400 truncate">
                              {palette.label}
                            </p>
                          </motion.button>
                        );
                      })}
                    </div>

                    {/* Custom color pickers */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-2">
                      <div className="flex-1 space-y-2">
                        <Label className="text-xs text-slate-400">Couleur primaire</Label>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-8 h-8 rounded-lg border border-white/10 cursor-pointer"
                            style={{ backgroundColor: customPrimary }}
                          />
                          <Input
                            type="color"
                            value={customPrimary}
                            onChange={(e) => setCustomPrimary(e.target.value)}
                            className="w-10 h-8 p-0 border-0 bg-transparent cursor-pointer"
                          />
                          <Input
                            value={customPrimary}
                            onChange={(e) => setCustomPrimary(e.target.value)}
                            className="flex-1 bg-white/5 border-white/10 text-white text-xs font-mono"
                          />
                        </div>
                      </div>
                      <div className="flex-1 space-y-2">
                        <Label className="text-xs text-slate-400">Couleur d&apos;accent</Label>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-8 h-8 rounded-lg border border-white/10 cursor-pointer"
                            style={{ backgroundColor: customAccent }}
                          />
                          <Input
                            type="color"
                            value={customAccent}
                            onChange={(e) => setCustomAccent(e.target.value)}
                            className="w-10 h-8 p-0 border-0 bg-transparent cursor-pointer"
                          />
                          <Input
                            value={customAccent}
                            onChange={(e) => setCustomAccent(e.target.value)}
                            className="flex-1 bg-white/5 border-white/10 text-white text-xs font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Live preview */}
                    <div className="mt-2 p-4 rounded-xl border border-white/5 overflow-hidden relative">
                      <p className="text-xs text-slate-500 mb-3">Aper\u00e7u en direct</p>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-14 h-14 rounded-xl shadow-lg"
                          style={{
                            background: `linear-gradient(135deg, ${customPrimary}, ${customAccent})`,
                          }}
                        />
                        <div>
                          <p className="font-bold text-white text-sm">{name || "Ton Nom"}</p>
                          <p className="text-xs" style={{ color: customAccent }}>
                            {country || "Ton Pays"} &bull;{" "}
                            {selectedGenres.length > 0
                              ? selectedGenres.slice(0, 3).join(", ")
                              : "Tes Genres"}
                          </p>
                        </div>
                        <Badge
                          className="ml-auto text-[10px]"
                          style={{
                            backgroundColor: `${customPrimary}25`,
                            color: customPrimary,
                            borderColor: `${customPrimary}40`,
                          }}
                          variant="outline"
                        >
                          {VISUAL_STYLES.find((s) => s.id === visualStyle)?.label || "Style"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Reference Images */}
                <Card className="glass p-5 border-purple-500/10">
                  <div className="space-y-3">
                    <Label className="text-slate-300 text-sm flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                      Images de r\u00e9f\u00e9rence
                    </Label>
                    <p className="text-xs text-slate-500">
                      Ajoute des images qui inspirent ton style visuel (pochettes, photos, artworks...)
                    </p>

                    {/* Uploaded references */}
                    {referenceUrls.length > 0 && (
                      <div className="flex flex-wrap gap-3">
                        {referenceUrls.map((url, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="relative group"
                          >
                            <div className="w-20 h-20 rounded-lg overflow-hidden border border-white/10">
                              <img
                                src={url}
                                alt={`R\u00e9f\u00e9rence ${idx + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <button
                              onClick={() => removeReference(idx)}
                              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    )}

                    {/* Upload area */}
                    <div className="flex gap-2">
                      <Input
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        placeholder="https://exemple.com/image.jpg"
                        className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-slate-500 text-sm"
                        onKeyDown={(e) => e.key === "Enter" && addReferenceUrl()}
                      />
                      <Button
                        onClick={addReferenceUrl}
                        variant="outline"
                        className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
                      >
                        <Upload className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>

              {/* --- Right column: Preview + Quick actions --- */}
              <div className="space-y-5">
                {/* Live Brand Card */}
                <motion.div variants={scaleVariants}>
                  <Card className="glass-strong p-5 border-purple-500/20 relative overflow-hidden">
                    <div
                      className="absolute inset-0 opacity-10"
                      style={{
                        background: `linear-gradient(135deg, ${customPrimary}, ${customAccent})`,
                      }}
                    />
                    <div className="relative">
                      <div className="flex items-center gap-2 mb-4">
                        <Wand2 className="w-4 h-4 text-purple-400" />
                        <p className="text-sm font-semibold text-white">Aper\u00e7u marque</p>
                      </div>

                      {/* Mock album cover */}
                      <div
                        className="w-full aspect-square rounded-xl mb-4 flex items-center justify-center shadow-xl"
                        style={{
                          background: `linear-gradient(135deg, ${customPrimary}40, ${customAccent}30)`,
                          border: `1px solid ${customPrimary}30`,
                        }}
                      >
                        <div className="text-center">
                          <div
                            className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center"
                            style={{
                              background: `linear-gradient(135deg, ${customPrimary}, ${customAccent})`,
                            }}
                          >
                            <Music className="w-8 h-8 text-white" />
                          </div>
                          <p className="font-bold text-white text-lg">
                            {name || "Artiste"}
                          </p>
                          <p className="text-xs text-slate-400">
                            {country || "Afrique"}
                          </p>
                        </div>
                      </div>

                      {/* Mini info */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Style</span>
                          <span className="text-slate-300">
                            {VISUAL_STYLES.find((s) => s.id === visualStyle)?.label}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Genres</span>
                          <span className="text-slate-300">
                            {selectedGenres.length > 0
                              ? selectedGenres.slice(0, 2).join(", ")
                              : "Aucun"}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs items-center">
                          <span className="text-slate-500">Palette</span>
                          <div className="flex gap-1">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: customPrimary }}
                            />
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: customAccent }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>

                {/* Quick Stats */}
                <Card className="glass p-4 border-amber-500/10">
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                      <Zap className="w-3 h-3" />
                      Cr\u00e9dits disponibles
                    </p>
                    <p className="text-2xl font-bold text-white">{effective}</p>
                    <Progress
                      value={Math.min((effective / 200) * 100, 100)}
                      className="h-1.5 bg-white/5 [&>div]:bg-amber-400"
                    />
                    <p className="text-[10px] text-slate-500">sur 200 cr\u00e9dits max</p>
                  </div>
                </Card>
              </div>
            </div>
          </motion.div>

          {/* ===== AI PRODUCER & VOICE STUDIO ===== */}
          <motion.div variants={itemVariants}>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-pink-400" />
              <h2 className="text-xl font-bold text-white">Outils IA</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* AI Producer Card */}
              <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
                <Card className="glass p-6 border-pink-500/15 relative overflow-hidden group hover:border-pink-500/30 transition-all">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-pink-500/6 rounded-full blur-[60px] group-hover:bg-pink-500/10 transition-all" />
                  <div className="relative">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center">
                        <Brain className="w-6 h-6 text-pink-400" />
                      </div>
                      <Badge variant="outline" className="border-amber-500/30 text-amber-400 bg-amber-500/10 gap-1">
                        <Zap className="w-3 h-3" />
                        3 cr\u00e9dits
                      </Badge>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Producer IA</h3>
                    <p className="text-sm text-slate-400 mb-5">
                      Obtenez des suggestions IA pour la direction musicale,
                      l&apos;arrangement, et les id\u00e9es de collaboration bas\u00e9es sur
                      votre identit\u00e9 artiste.
                    </p>

                    {/* Features list */}
                    <div className="space-y-2 mb-5">
                      {[
                        "Direction musicale personnalis\u00e9e",
                        "Arrangements intelligents",
                        "Id\u00e9es de collaboration",
                        "Analyse de tendances r\u00e9gionales",
                      ].map((feat, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
                          <ChevronRight className="w-3 h-3 text-pink-400/60" />
                          {feat}
                        </div>
                      ))}
                    </div>

                    <Button
                      onClick={handleAiProducer}
                      disabled={aiProducerLoading || effective < 3}
                      className="w-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 hover:from-pink-500/30 hover:to-purple-500/30 text-white border border-pink-500/20"
                    >
                      {aiProducerLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Analyse en cours...
                        </>
                      ) : (
                        <>
                          <Brain className="w-4 h-4 mr-2" />
                          Lancer le Producer IA
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              </motion.div>

              {/* Voice Studio Card */}
              <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
                <Card className="glass p-6 border-amber-500/15 relative overflow-hidden group hover:border-amber-500/30 transition-all">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/6 rounded-full blur-[60px] group-hover:bg-amber-500/10 transition-all" />
                  <div className="relative">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                        <Mic className="w-6 h-6 text-amber-400" />
                      </div>
                      <Badge variant="outline" className="border-amber-500/30 text-amber-400 bg-amber-500/10 gap-1">
                        <Zap className="w-3 h-3" />
                        5 cr\u00e9dits
                      </Badge>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Voice Studio</h3>
                    <p className="text-sm text-slate-400 mb-5">
                      Synth\u00e8se vocale IA, s\u00e9lection de style vocal, harmonies
                      automatiques, et adaptation multilingue pour les artistes africains.
                    </p>

                    {/* Voice styles */}
                    <div className="space-y-2 mb-5">
                      {[
                        "Synth\u00e8se vocale IA",
                        "5 styles vocaux africains",
                        "Harmonies automatiques",
                        "Adaptation Wolof, Lingala, Swahili...",
                      ].map((feat, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
                          <ChevronRight className="w-3 h-3 text-amber-400/60" />
                          {feat}
                        </div>
                      ))}
                    </div>

                    <Button
                      onClick={handleVoiceStudio}
                      disabled={voiceStudioLoading || effective < 5}
                      className="w-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-white border border-amber-500/20"
                    >
                      {voiceStudioLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Chargement...
                        </>
                      ) : (
                        <>
                          <Headphones className="w-4 h-4 mr-2" />
                          Ouvrir Voice Studio
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            </div>
          </motion.div>

          {/* ===== ANALYTICS PREVIEW ===== */}
          <motion.div variants={itemVariants}>
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-bold text-white">Analyse</h2>
              <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-300 ml-1">
                Ce mois
              </Badge>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {[
                {
                  label: "G\u00e9n\u00e9rations totales",
                  value: analytics.totalGenerations,
                  icon: Music,
                  color: "text-purple-400",
                  bg: "bg-purple-500/10",
                },
                {
                  label: "Style favori",
                  value: analytics.mostUsedStyle,
                  icon: Palette,
                  color: "text-pink-400",
                  bg: "bg-pink-500/10",
                },
                {
                  label: "Cr\u00e9dits utilis\u00e9s",
                  value: analytics.creditsUsedThisMonth,
                  icon: CreditCard,
                  color: "text-amber-400",
                  bg: "bg-amber-500/10",
                },
                {
                  label: "Tendance",
                  value: "+18%",
                  icon: TrendingUp,
                  color: "text-emerald-400",
                  bg: "bg-emerald-500/10",
                },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 + i * 0.08 }}
                >
                  <Card className="glass p-4 hover:border-purple-500/20 transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center`}
                      >
                        <stat.icon className={`w-4 h-4 ${stat.color}`} />
                      </div>
                    </div>
                    <p className="text-xl font-bold text-white">
                      {typeof stat.value === "number" ? stat.value : stat.value}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{stat.label}</p>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Mini Chart Placeholder */}
            <Card className="glass p-5 border-emerald-500/10 relative overflow-hidden">
              <div className="absolute bottom-0 left-0 w-48 h-24 bg-emerald-500/4 rounded-full blur-[50px]" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-semibold text-white flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    Activit\u00e9 mensuelle
                  </p>
                  <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-300">
                    12 derniers mois
                  </Badge>
                </div>
                {/* Simple bar chart using divs */}
                <div className="flex items-end gap-1.5 h-24">
                  {analytics.monthlyTrend.map((value, i) => {
                    const maxVal = Math.max(...analytics.monthlyTrend);
                    const height = maxVal > 0 ? (value / maxVal) * 100 : 0;
                    return (
                      <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        animate={{ height: `${height}%` }}
                        transition={{ duration: 0.6, delay: 0.5 + i * 0.04, ease: "easeOut" }}
                        className="flex-1 rounded-t-sm min-h-[4px]"
                        style={{
                          background: `linear-gradient(to top, ${customPrimary}80, ${customAccent}60)`,
                        }}
                      />
                    );
                  })}
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-[10px] text-slate-500">Jan</span>
                  <span className="text-[10px] text-slate-500">Juin</span>
                  <span className="text-[10px] text-slate-500">D\u00e9c</span>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* ===== SAVE / UPDATE BUTTON ===== */}
          <motion.div
            variants={itemVariants}
            className="sticky bottom-4 z-20"
          >
            <Card className="glass-strong p-4 border-purple-500/20 shadow-xl shadow-purple-500/5">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${customPrimary}30, ${customAccent}20)`,
                    }}
                  >
                    <Save className="w-5 h-5" style={{ color: customPrimary }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      Sauvegarder l&apos;identit\u00e9
                    </p>
                    <p className="text-xs text-slate-500">
                      Mettre \u00e0 jour le profil et le style visuel
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="text-[10px] border-white/10 text-slate-400"
                  >
                    {visualStyle} &bull; {selectedGenres.length} genres
                  </Badge>
                  <Button
                    onClick={handleSave}
                    disabled={isSaving || !name.trim()}
                    className="btn-gradient text-white font-bold rounded-xl px-6 shadow-lg shadow-purple-500/20 hover:scale-105 transition-transform"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sauvegarde...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Mettre \u00e0 jour
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      </StudioGate>
    </AppLayout>
  );
}
