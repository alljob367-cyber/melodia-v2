"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { AppLayout } from "@/components/dashboard/app-layout";
import { useMelodia } from "@/contexts/melodia-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  User,
  CreditCard,
  Shield,
  Settings2,
  Camera,
  Mail,
  Globe2,
  Languages,
  Instagram,
  Twitter,
  Youtube,
  Music2,
  Crown,
  Zap,
  Calendar,
  ArrowRight,
  Lock,
  Smartphone,
  Monitor,
  Clock,
  ChevronRight,
  CheckCircle2,
  Volume2,
  Bell,
  Palette,
  Moon,
  Sun,
  Loader2,
  Eye,
  EyeOff,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ============ DATA ============

const africanCountries = [
  { value: "SN", label: "Sénégal" },
  { value: "CI", label: "Côte d'Ivoire" },
  { value: "ML", label: "Mali" },
  { value: "BF", label: "Burkina Faso" },
  { value: "GN", label: "Guinée" },
  { value: "CM", label: "Cameroun" },
  { value: "TG", label: "Togo" },
  { value: "BJ", label: "Bénin" },
  { value: "NE", label: "Niger" },
  { value: "TD", label: "Tchad" },
  { value: "GA", label: "Gabon" },
  { value: "CG", label: "Congo" },
  { value: "CD", label: "RD Congo" },
  { value: "CF", label: "Centrafrique" },
  { value: "MG", label: "Madagascar" },
  { value: "DJ", label: "Djibouti" },
  { value: "KM", label: "Comores" },
  { value: "MR", label: "Mauritanie" },
  { value: "GQ", label: "Guinée Équatoriale" },
  { value: "RW", label: "Rwanda" },
  { value: "BI", label: "Burundi" },
  { value: "ET", label: "Éthiopie" },
  { value: "KE", label: "Kenya" },
  { value: "TZ", label: "Tanzanie" },
  { value: "UG", label: "Ouganda" },
  { value: "NG", label: "Nigeria" },
  { value: "GH", label: "Ghana" },
  { value: "ZA", label: "Afrique du Sud" },
  { value: "EG", label: "Égypte" },
  { value: "MA", label: "Maroc" },
  { value: "TN", label: "Tunisie" },
  { value: "DZ", label: "Algérie" },
  { value: "LY", label: "Libye" },
  { value: "SD", label: "Soudan" },
  { value: "AO", label: "Angola" },
  { value: "MZ", label: "Mozambique" },
  { value: "ZW", label: "Zimbabwe" },
  { value: "ZM", label: "Zambie" },
  { value: "MW", label: "Malawi" },
  { value: "SL", label: "Sierra Leone" },
  { value: "LR", label: "Liberia" },
  { value: "GM", label: "Gambie" },
  { value: "CV", label: "Cap-Vert" },
  { value: "ST", label: "São Tomé et Príncipe" },
];

const languages = [
  { value: "fr", label: "Français" },
  { value: "en", label: "English" },
  { value: "wo", label: "Wolof" },
  { value: "bm", label: "Bambara" },
  { value: "ee", label: "Éwé" },
  { value: "ln", label: "Lingala" },
  { value: "sw", label: "Swahili" },
  { value: "ha", label: "Hausa" },
  { value: "yo", label: "Yoruba" },
  { value: "pt", label: "Portugais" },
  { value: "ar", label: "Arabe" },
  { value: "am", label: "Amharique" },
];

const musicStyles = [
  "Afrobeat",
  "Amapiano",
  "Afropop",
  "Afro Drill",
  "Coupe Decale",
  "Ndombolo",
  "Rumba",
  "Highlife",
  "Hiplife",
  "Kizomba",
  "Semba",
  "Salsa Africaine",
  "Raï",
  "Coupé-Décalé",
  "Mapouka",
  "Zouk",
  "Soukous",
  "Gnawa",
  "Bongo Flava",
  "Gqom",
  "Shangaan Electro",
  "Kwaito",
  "Hip-Hop",
  "R&B",
  "Pop",
  "Reggae",
  "Dancehall",
];

const planNames: Record<string, string> = {
  decouverte: "Découverte",
  production: "Production Musicale",
  "artiste-actif": "Artiste Actif",
  video: "Vidéo",
  "artiste-pro": "Artiste Professionnel",
  "label-studio": "Label / Studio",
  basic: "Basic",
  pro: "Pro",
  studio: "Studio",
};

const planColors: Record<string, { text: string; bg: string; border: string }> = {
  decouverte: { text: "text-slate-300", bg: "bg-slate-500/10", border: "border-slate-500/20" },
  production: { text: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  "artiste-actif": { text: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
  video: { text: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
  "artiste-pro": { text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  "label-studio": { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  basic: { text: "text-slate-300", bg: "bg-slate-500/10", border: "border-slate-500/20" },
  pro: { text: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
};

// ============ COMPONENT ============

export default function SettingsPage() {
  const { data: session } = useSession();
  const { context } = useMelodia();
  const { theme, setTheme } = useTheme();

  // ── Profile state ──
  const [profileName, setProfileName] = useState("");
  const [profileBio, setProfileBio] = useState("");
  const [profileCountry, setProfileCountry] = useState("");
  const [profileLanguage, setProfileLanguage] = useState("fr");
  const [socialInstagram, setSocialInstagram] = useState("");
  const [socialTwitter, setSocialTwitter] = useState("");
  const [socialYoutube, setSocialYoutube] = useState("");
  const [socialSpotify, setSocialSpotify] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});

  // ── Security state ──
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [securitySaving, setSecuritySaving] = useState(false);
  const [securityErrors, setSecurityErrors] = useState<Record<string, string>>({});
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // ── Preferences state ──
  const [defaultStyle, setDefaultStyle] = useState("Afrobeat");
  const [defaultLyricsLanguage, setDefaultLyricsLanguage] = useState("fr");
  const [audioQuality, setAudioQuality] = useState("320kbps");
  const [notifGeneration, setNotifGeneration] = useState(true);
  const [notifCreditsLow, setNotifCreditsLow] = useState(true);
  const [notifNewsletter, setNotifNewsletter] = useState(false);
  const [prefsSaving, setPrefsSaving] = useState(false);

  // ── Subscription state ──
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // ── Active tab ──
  const [activeTab, setActiveTab] = useState("profil");

  // Initialize from session
  useEffect(() => {
    if (session?.user) {
      setProfileName(session.user.name || "");
    }
    if (context) {
      setProfileLanguage(context.locale || "fr");
    }
  }, [session, context]);

  const userEmail = session?.user?.email || "";
  const userPlan = (session?.user as any)?.plan || context?.plan || "decouverte";
  const planDisplay = planNames[userPlan] || userPlan;
  const planStyle = planColors[userPlan] || planColors.basic;

  // ── Handlers ──

  const validateProfile = useCallback((): boolean => {
    const errors: Record<string, string> = {};
    if (!profileName.trim()) errors.name = "Le nom est requis";
    if (profileName.trim().length > 50) errors.name = "Maximum 50 caractères";
    if (profileBio.length > 300) errors.bio = "Maximum 300 caractères";
    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  }, [profileName, profileBio]);

  const handleSaveProfile = useCallback(async () => {
    if (!validateProfile()) return;
    setProfileSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
      toast.success("Profil mis à jour avec succès !");
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setProfileSaving(false);
    }
  }, [validateProfile]);

  const validateSecurity = useCallback((): boolean => {
    const errors: Record<string, string> = {};
    if (!currentPassword) errors.current = "Le mot de passe actuel est requis";
    if (!newPassword) errors.new = "Le nouveau mot de passe est requis";
    else if (newPassword.length < 8) errors.new = "Minimum 8 caractères";
    if (!confirmPassword) errors.confirm = "La confirmation est requise";
    else if (newPassword !== confirmPassword) errors.confirm = "Les mots de passe ne correspondent pas";
    setSecurityErrors(errors);
    return Object.keys(errors).length === 0;
  }, [currentPassword, newPassword, confirmPassword]);

  const handleChangePassword = useCallback(async () => {
    if (!validateSecurity()) return;
    setSecuritySaving(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
      toast.success("Mot de passe modifié avec succès !");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSecurityErrors({});
    } catch {
      toast.error("Erreur lors du changement de mot de passe");
    } finally {
      setSecuritySaving(false);
    }
  }, [validateSecurity]);

  const handleSavePreferences = useCallback(async () => {
    setPrefsSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
      toast.success("Préférences enregistrées !");
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setPrefsSaving(false);
    }
  }, []);

  const handleCancelSubscription = useCallback(async () => {
    setCancelling(true);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      toast.success("Abonnement annulé. Tu gardes l'accès jusqu'à la fin de la période.");
      setCancelDialogOpen(false);
    } catch {
      toast.error("Erreur lors de l'annulation");
    } finally {
      setCancelling(false);
    }
  }, []);

  // ── Animation variants ──
  const fadeIn = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35 },
  };

  const staggerItem = (i: number) => ({
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3, delay: i * 0.06 },
  });

  // ============ RENDER ============

  return (
    <AppLayout title="Paramètres">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Page header */}
        <motion.div {...fadeIn} className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <Settings2 className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Paramètres</h1>
            <p className="text-sm text-slate-400">Gère ton profil, abonnement et préférences</p>
          </div>
        </motion.div>

        {/* Tab navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <motion.div {...fadeIn} transition={{ duration: 0.35, delay: 0.05 }}>
            <TabsList className="w-full sm:w-fit bg-white/5 border border-white/10 rounded-xl p-1 h-auto flex-wrap">
              <TabsTrigger
                value="profil"
                className="rounded-lg px-4 py-2 data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 text-slate-400 gap-2"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Profil</span>
              </TabsTrigger>
              <TabsTrigger
                value="abonnement"
                className="rounded-lg px-4 py-2 data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300 text-slate-400 gap-2"
              >
                <CreditCard className="w-4 h-4" />
                <span className="hidden sm:inline">Abonnement</span>
              </TabsTrigger>
              <TabsTrigger
                value="securite"
                className="rounded-lg px-4 py-2 data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-300 text-slate-400 gap-2"
              >
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">Sécurité</span>
              </TabsTrigger>
              <TabsTrigger
                value="preferences"
                className="rounded-lg px-4 py-2 data-[state=active]:bg-pink-500/20 data-[state=active]:text-pink-300 text-slate-400 gap-2"
              >
                <Settings2 className="w-4 h-4" />
                <span className="hidden sm:inline">Préférences</span>
              </TabsTrigger>
            </TabsList>
          </motion.div>

          {/* ═══════════════════════════════════════════════════ */}
          {/* PROFIL TAB */}
          {/* ═══════════════════════════════════════════════════ */}
          <TabsContent value="profil" className="space-y-5 mt-6">
            <AnimatePresence mode="wait">
              <motion.div key="profil-content" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }} className="space-y-5">

                {/* Avatar card */}
                <motion.div {...staggerItem(0)}>
                  <Card className="glass p-6">
                    <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                      <Camera className="w-4 h-4 text-purple-400" />
                      Photo de profil
                    </h3>
                    <div className="flex items-center gap-5">
                      <div className="relative group">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 border-2 border-white/10 flex items-center justify-center overflow-hidden">
                          {session?.user?.image ? (
                            <img src={session.user.image} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-2xl font-bold text-white/60">
                              {profileName ? profileName.charAt(0).toUpperCase() : "?"}
                            </span>
                          )}
                        </div>
                        <button
                          className="absolute inset-0 w-20 h-20 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          onClick={() => toast.info("Upload de photo bientôt disponible")}
                        >
                          <Camera className="w-5 h-5 text-white" />
                        </button>
                      </div>
                      <div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-white/10 text-slate-300 hover:bg-white/5 hover:text-white"
                          onClick={() => toast.info("Upload de photo bientôt disponible")}
                        >
                          <Camera className="w-3.5 h-3.5 mr-2" />
                          Changer la photo
                        </Button>
                        <p className="text-xs text-slate-500 mt-2">JPG, PNG. Max 2 MB.</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>

                {/* Personal info card */}
                <motion.div {...staggerItem(1)}>
                  <Card className="glass p-6">
                    <h3 className="text-sm font-semibold text-white mb-5 flex items-center gap-2">
                      <User className="w-4 h-4 text-purple-400" />
                      Informations personnelles
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {/* Name */}
                      <div className="space-y-2">
                        <Label className="text-slate-300 text-sm">Nom complet</Label>
                        <Input
                          value={profileName}
                          onChange={(e) => {
                            setProfileName(e.target.value);
                            if (profileErrors.name) setProfileErrors((p) => ({ ...p, name: "" }));
                          }}
                          placeholder="Ton nom d'artiste"
                          className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-purple-500/40 focus:ring-purple-500/20"
                        />
                        {profileErrors.name && (
                          <p className="text-xs text-red-400">{profileErrors.name}</p>
                        )}
                      </div>

                      {/* Email (disabled) */}
                      <div className="space-y-2">
                        <Label className="text-slate-300 text-sm flex items-center gap-1.5">
                          <Mail className="w-3 h-3" />
                          Email
                        </Label>
                        <Input
                          value={userEmail}
                          disabled
                          className="bg-white/5 border-white/10 text-slate-400 placeholder:text-slate-500 cursor-not-allowed opacity-60"
                        />
                        <p className="text-[11px] text-slate-500">L'email ne peut pas être modifié</p>
                      </div>
                    </div>

                    {/* Bio */}
                    <div className="space-y-2 mt-5">
                      <Label className="text-slate-300 text-sm">Bio</Label>
                      <Textarea
                        value={profileBio}
                        onChange={(e) => {
                          setProfileBio(e.target.value);
                          if (profileErrors.bio) setProfileErrors((p) => ({ ...p, bio: "" }));
                        }}
                        placeholder="Parle-nous de toi et de ta musique..."
                        rows={3}
                        maxLength={300}
                        className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-purple-500/40 focus:ring-purple-500/20 resize-none"
                      />
                      <div className="flex justify-between">
                        {profileErrors.bio ? (
                          <p className="text-xs text-red-400">{profileErrors.bio}</p>
                        ) : <span />}
                        <p className="text-xs text-slate-500">{profileBio.length}/300</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>

                {/* Location & Language card */}
                <motion.div {...staggerItem(2)}>
                  <Card className="glass p-6">
                    <h3 className="text-sm font-semibold text-white mb-5 flex items-center gap-2">
                      <Globe2 className="w-4 h-4 text-amber-400" />
                      Localisation & Langue
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {/* Country */}
                      <div className="space-y-2">
                        <Label className="text-slate-300 text-sm flex items-center gap-1.5">
                          <MapPin className="w-3 h-3" />
                          Pays
                        </Label>
                        <Select value={profileCountry} onValueChange={setProfileCountry}>
                          <SelectTrigger className="w-full bg-white/5 border-white/10 text-white data-[placeholder]:text-slate-500">
                            <SelectValue placeholder="Sélectionne ton pays" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#16162A] border-white/10 max-h-60">
                            {africanCountries.map((c) => (
                              <SelectItem key={c.value} value={c.value} className="text-slate-200 focus:bg-purple-500/10 focus:text-white">
                                {c.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Language */}
                      <div className="space-y-2">
                        <Label className="text-slate-300 text-sm flex items-center gap-1.5">
                          <Languages className="w-3 h-3" />
                          Langue préférée
                        </Label>
                        <Select value={profileLanguage} onValueChange={setProfileLanguage}>
                          <SelectTrigger className="w-full bg-white/5 border-white/10 text-white data-[placeholder]:text-slate-500">
                            <SelectValue placeholder="Langue" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#16162A] border-white/10 max-h-60">
                            {languages.map((l) => (
                              <SelectItem key={l.value} value={l.value} className="text-slate-200 focus:bg-purple-500/10 focus:text-white">
                                {l.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </Card>
                </motion.div>

                {/* Social links card */}
                <motion.div {...staggerItem(3)}>
                  <Card className="glass p-6">
                    <h3 className="text-sm font-semibold text-white mb-5 flex items-center gap-2">
                      <Instagram className="w-4 h-4 text-pink-400" />
                      Réseaux sociaux
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label className="text-slate-300 text-sm flex items-center gap-1.5">
                          <Instagram className="w-3.5 h-3.5 text-pink-400" />
                          Instagram
                        </Label>
                        <Input
                          value={socialInstagram}
                          onChange={(e) => setSocialInstagram(e.target.value)}
                          placeholder="@ton_artiste"
                          className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-pink-500/40 focus:ring-pink-500/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-300 text-sm flex items-center gap-1.5">
                          <Twitter className="w-3.5 h-3.5 text-sky-400" />
                          Twitter / X
                        </Label>
                        <Input
                          value={socialTwitter}
                          onChange={(e) => setSocialTwitter(e.target.value)}
                          placeholder="@ton_artiste"
                          className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-sky-500/40 focus:ring-sky-500/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-300 text-sm flex items-center gap-1.5">
                          <Youtube className="w-3.5 h-3.5 text-red-400" />
                          YouTube
                        </Label>
                        <Input
                          value={socialYoutube}
                          onChange={(e) => setSocialYoutube(e.target.value)}
                          placeholder="Chaîne YouTube"
                          className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-red-500/40 focus:ring-red-500/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-300 text-sm flex items-center gap-1.5">
                          <Music2 className="w-3.5 h-3.5 text-emerald-400" />
                          Spotify
                        </Label>
                        <Input
                          value={socialSpotify}
                          onChange={(e) => setSocialSpotify(e.target.value)}
                          placeholder="Lien Spotify"
                          className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-emerald-500/40 focus:ring-emerald-500/20"
                        />
                      </div>
                    </div>
                  </Card>
                </motion.div>

                {/* Save button */}
                <motion.div {...staggerItem(4)} className="flex justify-end">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={profileSaving}
                    className="btn-gradient text-white font-bold rounded-xl px-8 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all"
                  >
                    {profileSaving ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enregistrement...</>
                    ) : (
                      "Enregistrer le profil"
                    )}
                  </Button>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════ */}
          {/* ABONNEMENT TAB */}
          {/* ═══════════════════════════════════════════════════ */}
          <TabsContent value="abonnement" className="space-y-5 mt-6">
            <AnimatePresence mode="wait">
              <motion.div key="abonnement-content" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }} className="space-y-5">

                {/* Current plan card */}
                <motion.div {...staggerItem(0)}>
                  <Card className="glass p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/5 rounded-full blur-[60px]" />
                    <div className="relative">
                      <div className="flex items-center justify-between mb-5">
                        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                          <Crown className="w-4 h-4 text-amber-400" />
                          Plan actuel
                        </h3>
                        <Badge className={cn(planStyle.bg, planStyle.text, planStyle.border, "border font-semibold")}>
                          {planDisplay}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
                        {/* Plan name & price */}
                        <div className="glass-strong rounded-xl p-4">
                          <p className="text-xs text-slate-400 mb-1">Abonnement</p>
                          <p className="text-lg font-bold text-white">{planDisplay}</p>
                          <p className="text-xs text-slate-500 mt-1">Renouvellement automatique</p>
                        </div>

                        {/* Credits remaining */}
                        <div className="glass-strong rounded-xl p-4">
                          <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                            <Zap className="w-3 h-3 text-amber-400" />
                            Crédits restants
                          </p>
                          <p className="text-lg font-bold text-amber-400">
                            {context?.creditBalance || 0}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">crédits disponibles</p>
                        </div>

                        {/* Next billing */}
                        <div className="glass-strong rounded-xl p-4">
                          <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-purple-400" />
                            Prochaine facturation
                          </p>
                          <p className="text-lg font-bold text-white">15 Avr 2025</p>
                          <p className="text-xs text-slate-500 mt-1">Prochain renouvellement</p>
                        </div>
                      </div>

                      {/* Usage breakdown */}
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-400 flex items-center gap-2">
                            <Music2 className="w-3.5 h-3.5 text-purple-400" />
                            Chansons restantes
                          </span>
                          <span className="text-white font-medium">{context?.songsRemaining || 0}</span>
                        </div>
                        <Separator className="bg-white/5" />
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-400 flex items-center gap-2">
                            <Palette className="w-3.5 h-3.5 text-amber-400" />
                            Pochettes restantes
                          </span>
                          <span className="text-white font-medium">{context?.coversRemaining || 0}</span>
                        </div>
                        <Separator className="bg-white/5" />
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-400 flex items-center gap-2">
                            <Youtube className="w-3.5 h-3.5 text-cyan-400" />
                            Clips vidéo restants
                          </span>
                          <span className="text-white font-medium">{context?.videosRemaining || 0}</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Link href="/subscription" className="flex-1">
                          <Button className="w-full btn-gradient text-white font-bold rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all">
                            Changer de plan
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </Link>
                        <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              className="flex-1 border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/30 rounded-xl font-medium"
                            >
                              Annuler l&apos;abonnement
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-[#16162A] border-white/10">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-white">Annuler l&apos;abonnement ?</AlertDialogTitle>
                              <AlertDialogDescription className="text-slate-400">
                                Tu garderas l&apos;accès à ton plan actuel jusqu&apos;à la fin de la période de facturation (15 Avr 2025). Après cette date, ton compte passera au plan Gratuit avec des fonctionnalités limitées.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="border-white/10 text-slate-300 hover:bg-white/5">
                                Garder mon plan
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={handleCancelSubscription}
                                disabled={cancelling}
                                className="bg-red-500/80 text-white hover:bg-red-500 border-0"
                              >
                                {cancelling ? (
                                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Annulation...</>
                                ) : (
                                  "Oui, annuler"
                                )}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </Card>
                </motion.div>

                {/* Billing history placeholder */}
                <motion.div {...staggerItem(1)}>
                  <Card className="glass p-6">
                    <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-emerald-400" />
                      Historique de facturation
                    </h3>
                    <div className="space-y-3">
                      {[
                        { date: "15 Mars 2025", amount: "5 000 FCFA", plan: "Production Musicale", status: "paid" },
                        { date: "15 Fév 2025", amount: "5 000 FCFA", plan: "Production Musicale", status: "paid" },
                        { date: "15 Jan 2025", amount: "2 000 FCFA", plan: "Découverte", status: "paid" },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            </div>
                            <div>
                              <p className="text-sm text-white font-medium">{item.plan}</p>
                              <p className="text-xs text-slate-500">{item.date}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-white font-medium">{item.amount}</p>
                            <Badge variant="outline" className="text-[9px] border-emerald-500/20 text-emerald-400 px-1.5 py-0">
                              Payé
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════ */}
          {/* SÉCURITÉ TAB */}
          {/* ═══════════════════════════════════════════════════ */}
          <TabsContent value="securite" className="space-y-5 mt-6">
            <AnimatePresence mode="wait">
              <motion.div key="securite-content" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }} className="space-y-5">

                {/* Change password card */}
                <motion.div {...staggerItem(0)}>
                  <Card className="glass p-6">
                    <h3 className="text-sm font-semibold text-white mb-5 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-emerald-400" />
                      Changer le mot de passe
                    </h3>
                    <div className="space-y-4 max-w-md">
                      {/* Current password */}
                      <div className="space-y-2">
                        <Label className="text-slate-300 text-sm">Mot de passe actuel</Label>
                        <div className="relative">
                          <Input
                            type={showCurrentPassword ? "text" : "password"}
                            value={currentPassword}
                            onChange={(e) => {
                              setCurrentPassword(e.target.value);
                              if (securityErrors.current) setSecurityErrors((p) => ({ ...p, current: "" }));
                            }}
                            placeholder="••••••••"
                            className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-emerald-500/40 focus:ring-emerald-500/20 pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                          >
                            {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {securityErrors.current && <p className="text-xs text-red-400">{securityErrors.current}</p>}
                      </div>

                      {/* New password */}
                      <div className="space-y-2">
                        <Label className="text-slate-300 text-sm">Nouveau mot de passe</Label>
                        <div className="relative">
                          <Input
                            type={showNewPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => {
                              setNewPassword(e.target.value);
                              if (securityErrors.new) setSecurityErrors((p) => ({ ...p, new: "" }));
                            }}
                            placeholder="Minimum 8 caractères"
                            className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-emerald-500/40 focus:ring-emerald-500/20 pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                          >
                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {securityErrors.new && <p className="text-xs text-red-400">{securityErrors.new}</p>}
                      </div>

                      {/* Confirm password */}
                      <div className="space-y-2">
                        <Label className="text-slate-300 text-sm">Confirmer le nouveau mot de passe</Label>
                        <div className="relative">
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => {
                              setConfirmPassword(e.target.value);
                              if (securityErrors.confirm) setSecurityErrors((p) => ({ ...p, confirm: "" }));
                            }}
                            placeholder="Retape le nouveau mot de passe"
                            className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-emerald-500/40 focus:ring-emerald-500/20 pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {securityErrors.confirm && <p className="text-xs text-red-400">{securityErrors.confirm}</p>}
                      </div>

                      <Button
                        onClick={handleChangePassword}
                        disabled={securitySaving}
                        className="btn-gradient text-white font-bold rounded-xl px-6 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all mt-2"
                      >
                        {securitySaving ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Modification...</>
                        ) : (
                          <>
                            <Lock className="w-4 h-4 mr-2" />
                            Changer le mot de passe
                          </>
                        )}
                      </Button>
                    </div>
                  </Card>
                </motion.div>

                {/* 2FA card */}
                <motion.div {...staggerItem(1)}>
                  <Card className="glass p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                          <Shield className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-white">Authentification à deux facteurs</h3>
                          <p className="text-xs text-slate-400 mt-0.5">Ajoute une couche de sécurité supplémentaire à ton compte</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-[10px] border-amber-500/20 text-amber-400">
                          Bientôt
                        </Badge>
                        <Switch
                          checked={twoFactorEnabled}
                          onCheckedChange={setTwoFactorEnabled}
                          disabled
                          className="data-[state=checked]:bg-amber-500"
                        />
                      </div>
                    </div>
                  </Card>
                </motion.div>

                {/* Active sessions card */}
                <motion.div {...staggerItem(2)}>
                  <Card className="glass p-6">
                    <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-purple-400" />
                      Sessions actives
                    </h3>
                    <div className="space-y-3">
                      {/* Current session */}
                      <div className="flex items-center justify-between p-3 rounded-lg bg-purple-500/5 border border-purple-500/10">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                            <Monitor className="w-4 h-4 text-purple-400" />
                          </div>
                          <div>
                            <p className="text-sm text-white font-medium flex items-center gap-2">
                              Chrome — macOS
                              <Badge className="bg-purple-500/20 text-purple-300 text-[9px] border-0 px-1.5 py-0">Actuelle</Badge>
                            </p>
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Dakar, SN — Il y a 2 min
                            </p>
                          </div>
                        </div>
                      </div>
                      {/* Other session */}
                      <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                            <Smartphone className="w-4 h-4 text-slate-400" />
                          </div>
                          <div>
                            <p className="text-sm text-white font-medium">Safari — iPhone</p>
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Abidjan, CI — Il y a 3h
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs"
                          onClick={() => toast.success("Session déconnectée")}
                        >
                          Révoquer
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════ */}
          {/* PRÉFÉRENCES TAB */}
          {/* ═══════════════════════════════════════════════════ */}
          <TabsContent value="preferences" className="space-y-5 mt-6">
            <AnimatePresence mode="wait">
              <motion.div key="preferences-content" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }} className="space-y-5">

                {/* Music preferences card */}
                <motion.div {...staggerItem(0)}>
                  <Card className="glass p-6">
                    <h3 className="text-sm font-semibold text-white mb-5 flex items-center gap-2">
                      <Music2 className="w-4 h-4 text-purple-400" />
                      Préférences musicales
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {/* Default style */}
                      <div className="space-y-2">
                        <Label className="text-slate-300 text-sm">Style musical par défaut</Label>
                        <Select value={defaultStyle} onValueChange={setDefaultStyle}>
                          <SelectTrigger className="w-full bg-white/5 border-white/10 text-white data-[placeholder]:text-slate-500">
                            <SelectValue placeholder="Choisir un style" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#16162A] border-white/10 max-h-60">
                            {musicStyles.map((style) => (
                              <SelectItem key={style} value={style} className="text-slate-200 focus:bg-purple-500/10 focus:text-white">
                                {style}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Default lyrics language */}
                      <div className="space-y-2">
                        <Label className="text-slate-300 text-sm">Langue des paroles par défaut</Label>
                        <Select value={defaultLyricsLanguage} onValueChange={setDefaultLyricsLanguage}>
                          <SelectTrigger className="w-full bg-white/5 border-white/10 text-white data-[placeholder]:text-slate-500">
                            <SelectValue placeholder="Choisir une langue" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#16162A] border-white/10 max-h-60">
                            {languages.map((l) => (
                              <SelectItem key={l.value} value={l.value} className="text-slate-200 focus:bg-purple-500/10 focus:text-white">
                                {l.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Audio quality */}
                    <div className="space-y-2 mt-5">
                      <Label className="text-slate-300 text-sm flex items-center gap-1.5">
                        <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                        Qualité audio
                      </Label>
                      <div className="flex gap-3">
                        {[
                          { value: "128kbps", label: "128 kbps", desc: "Standard", color: "text-slate-400" },
                          { value: "320kbps", label: "320 kbps", desc: "Haute qualité", color: "text-amber-400" },
                        ].map((option) => (
                          <button
                            key={option.value}
                            onClick={() => setAudioQuality(option.value)}
                            className={cn(
                              "flex-1 p-4 rounded-xl border text-left transition-all cursor-pointer",
                              audioQuality === option.value
                                ? "border-purple-500/40 bg-purple-500/5"
                                : "border-white/10 bg-white/[0.02] hover:border-white/20"
                            )}
                          >
                            <p className={cn("text-sm font-semibold", audioQuality === option.value ? "text-white" : "text-slate-300")}>
                              {option.label}
                            </p>
                            <p className={cn("text-xs mt-0.5", audioQuality === option.value ? "text-purple-400" : option.color)}>
                              {option.desc}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </Card>
                </motion.div>

                {/* Notifications card */}
                <motion.div {...staggerItem(1)}>
                  <Card className="glass p-6">
                    <h3 className="text-sm font-semibold text-white mb-5 flex items-center gap-2">
                      <Bell className="w-4 h-4 text-pink-400" />
                      Notifications par email
                    </h3>
                    <div className="space-y-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-white font-medium">Génération terminée</p>
                          <p className="text-xs text-slate-400">Recevoir un email quand ta chanson est prête</p>
                        </div>
                        <Switch
                          checked={notifGeneration}
                          onCheckedChange={setNotifGeneration}
                          className="data-[state=checked]:bg-purple-500"
                        />
                      </div>
                      <Separator className="bg-white/5" />
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-white font-medium">Crédits faibles</p>
                          <p className="text-xs text-slate-400">Alerte quand il reste moins de 5 crédits</p>
                        </div>
                        <Switch
                          checked={notifCreditsLow}
                          onCheckedChange={setNotifCreditsLow}
                          className="data-[state=checked]:bg-amber-500"
                        />
                      </div>
                      <Separator className="bg-white/5" />
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-white font-medium">Newsletter</p>
                          <p className="text-xs text-slate-400">Actualités Melodia et nouveaux modèles IA</p>
                        </div>
                        <Switch
                          checked={notifNewsletter}
                          onCheckedChange={setNotifNewsletter}
                          className="data-[state=checked]:bg-pink-500"
                        />
                      </div>
                    </div>
                  </Card>
                </motion.div>

                {/* Theme preference card */}
                <motion.div {...staggerItem(2)}>
                  <Card className="glass p-6">
                    <h3 className="text-sm font-semibold text-white mb-5 flex items-center gap-2">
                      <Palette className="w-4 h-4 text-emerald-400" />
                      Apparence
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: "dark", label: "Sombre", icon: Moon, color: "text-purple-400", bg: "bg-purple-500/10" },
                        { value: "light", label: "Clair", icon: Sun, color: "text-amber-400", bg: "bg-amber-500/10" },
                        { value: "system", label: "Système", icon: Monitor, color: "text-emerald-400", bg: "bg-emerald-500/10" },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setTheme(option.value)}
                          className={cn(
                            "p-4 rounded-xl border text-center transition-all cursor-pointer group",
                            theme === option.value
                              ? "border-purple-500/40 bg-purple-500/5"
                              : "border-white/10 bg-white/[0.02] hover:border-white/20"
                          )}
                        >
                          <div className={cn(
                            "w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center transition-transform group-hover:scale-110",
                            option.bg
                          )}>
                            <option.icon className={cn("w-5 h-5", option.color)} />
                          </div>
                          <p className={cn("text-sm font-medium", theme === option.value ? "text-white" : "text-slate-300")}>
                            {option.label}
                          </p>
                        </button>
                      ))}
                    </div>
                  </Card>
                </motion.div>

                {/* Save preferences button */}
                <motion.div {...staggerItem(3)} className="flex justify-end">
                  <Button
                    onClick={handleSavePreferences}
                    disabled={prefsSaving}
                    className="btn-gradient text-white font-bold rounded-xl px-8 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all"
                  >
                    {prefsSaving ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enregistrement...</>
                    ) : (
                      "Enregistrer les préférences"
                    )}
                  </Button>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </TabsContent>
      </Tabs>
      </div>
    </AppLayout>
  );
}
