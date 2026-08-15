"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  Users,
  UserPlus,
  Shield,
  Crown,
  Eye,
  Palette,
  BarChart3,
  TrendingUp,
  Zap,
  Music,
  FolderOpen,
  Key,
  ExternalLink,
  Copy,
  ChevronRight,
  Globe,
  Activity,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  Search,
} from "lucide-react";
import { AppLayout } from "@/components/dashboard/app-layout";
import { StudioGate } from "@/components/core/permission-gate";
import { useArtists, useProjects } from "@/hooks/use-core-queries";
import { useMelodia } from "@/contexts/melodia-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

// ============ ANIMATION VARIANTS ============

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  },
} as const;

const scaleVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
} as const;

// ============ MOCK DATA ============

const MOCK_ORG = {
  name: "AfroBeats Global Records",
  type: "label",
  memberCount: 12,
  artistCount: 8,
  credits: 2450,
  creditsUsed: 1830,
};

const MOCK_ARTISTS = [
  { id: "1", name: "Aminata Diallo", genre: "Afrobeats", country: "Côte d'Ivoire", songs: 24, projects: 6, avatar: "AD" },
  { id: "2", name: "Kwame Asante", genre: "Highlife", country: "Ghana", songs: 18, projects: 4, avatar: "KA" },
  { id: "3", name: "Fatou Ndiaye", genre: "Mbalax", country: "Sénégal", songs: 31, projects: 8, avatar: "FN" },
  { id: "4", name: "Yusuf Ibrahim", genre: "Bongo Flava", country: "Tanzanie", songs: 12, projects: 3, avatar: "YI" },
  { id: "5", name: "Chidinma Okafor", genre: "Afropop", country: "Nigéria", songs: 42, projects: 11, avatar: "CO" },
  { id: "6", name: "Mariam Traoré", genre: "Desert Blues", country: "Mali", songs: 15, projects: 5, avatar: "MT" },
];

const MOCK_MEMBERS = [
  { id: "1", name: "Youssouf Konaté", email: "youssouf@afrobeats.gl", role: "Admin", avatar: "YK" },
  { id: "2", name: "Aïcha Bamba", email: "aicha@afrobeats.gl", role: "Producer", avatar: "AB" },
  { id: "3", name: "Moussa Sow", email: "moussa@afrobeats.gl", role: "Artist", avatar: "MS" },
  { id: "4", name: "Adama Cissé", email: "adama@afrobeats.gl", role: "Artist", avatar: "AC" },
  { id: "5", name: "Oumar Diop", email: "oumar@afrobeats.gl", role: "Viewer", avatar: "OD" },
];

const MOCK_PROJECTS = [
  { id: "1", name: "Album Afrique Nouvelle", status: "active", artists: ["Aminata Diallo", "Kwame Asante"], date: "2025-01-15", type: "album" },
  { id: "2", name: "Singles Collection Q4", status: "active", artists: ["Fatou Ndiaye"], date: "2025-01-10", type: "singles" },
  { id: "3", name: "Collaboration EP", status: "draft", artists: ["Chidinma Okafor", "Yusuf Ibrahim"], date: "2025-01-08", type: "ep" },
  { id: "4", name: "Remix Pack Vol.2", status: "completed", artists: ["Mariam Traoré"], date: "2024-12-20", type: "remix" },
];

const STYLE_DISTRIBUTION = [
  { style: "Afrobeats", pct: 35, color: "#7C3AED" },
  { style: "Highlife", pct: 20, color: "#EC4899" },
  { style: "Afropop", pct: 18, color: "#F59E0B" },
  { style: "Mbalax", pct: 15, color: "#10B981" },
  { style: "Autres", pct: 12, color: "#3B82F6" },
];

const MONTHLY_TREND = [
  { month: "Sep", value: 18 },
  { month: "Oct", value: 25 },
  { month: "Nov", value: 32 },
  { month: "Dec", value: 28 },
  { month: "Jan", value: 41 },
];

// ============ ROLE CONFIG ============

const ROLE_CONFIG: Record<string, { icon: React.ReactNode; color: string; bgColor: string }> = {
  Admin: { icon: <Crown className="h-3.5 w-3.5" />, color: "text-amber-400", bgColor: "bg-amber-500/10 border-amber-500/20" },
  Producer: { icon: <Shield className="h-3.5 w-3.5" />, color: "text-purple-400", bgColor: "bg-purple-500/10 border-purple-500/20" },
  Artist: { icon: <Palette className="h-3.5 w-3.5" />, color: "text-pink-400", bgColor: "bg-pink-500/10 border-pink-500/20" },
  Viewer: { icon: <Eye className="h-3.5 w-3.5" />, color: "text-slate-400", bgColor: "bg-slate-500/10 border-slate-500/20" },
};

const STATUS_CONFIG: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  active: { color: "text-emerald-400", label: "Actif", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  draft: { color: "text-amber-400", label: "Brouillon", icon: <Clock className="h-3.5 w-3.5" /> },
  completed: { color: "text-slate-400", label: "Terminé", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
};

// ============ MAIN PAGE COMPONENT ============

export default function LabelStudioPage() {
  const { context } = useMelodia();
  const { data: artistsData, isLoading: artistsLoading } = useArtists();
  const { data: projectsData, isLoading: projectsLoading } = useProjects();

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Viewer");
  const [showApiKey, setShowApiKey] = useState(false);
  const [artistSearch, setArtistSearch] = useState("");

  const orgName = MOCK_ORG.name;
  const plan = context?.plan || "label";

  // Merge real data with mock fallbacks
  const artists = artistsData && Array.isArray(artistsData) && artistsData.length > 0 ? artistsData : MOCK_ARTISTS;
  const projects = projectsData && Array.isArray(projectsData) && projectsData.length > 0 ? projectsData : MOCK_PROJECTS;

  const totalGenerations = 142;
  const totalCreditsUsed = MOCK_ORG.creditsUsed;
  const mostProductiveArtist = "Chidinma Okafor";

  const handleInviteMember = () => {
    if (!inviteEmail || !inviteEmail.includes("@")) {
      toast.error("Veuillez entrer un email valide");
      return;
    }
    toast.success(`Invitation envoyée à ${inviteEmail} en tant que ${inviteRole}`);
    setInviteEmail("");
  };

  const handleAddArtist = () => {
    toast.info("Formulaire d'ajout d'artiste — en développement");
  };

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText("mk_label_a1b2c3d4e5f6g7h8i9j0");
    toast.success("Clé API copiée dans le presse-papier");
  };

  const filteredArtists = MOCK_ARTISTS.filter((a) =>
    a.name.toLowerCase().includes(artistSearch.toLowerCase()) ||
    a.genre.toLowerCase().includes(artistSearch.toLowerCase())
  );

  // ============ RENDER ============

  return (
    <AppLayout title="Label Studio">
      <StudioGate studio="label" showUpgrade={true}>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* ====== WELCOME HEADER ====== */}
          <motion.div variants={itemVariants} className="relative overflow-hidden rounded-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-pink-600/10 to-amber-500/5" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
            <div className="relative glass-strong p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <motion.div
                  variants={scaleVariants}
                  className="flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/25"
                >
                  <Building2 className="h-7 w-7 text-white" />
                </motion.div>
                <div className="flex-1">
                  <h1 className="text-2xl sm:text-3xl font-bold gradient-text">Label Studio</h1>
                  <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                    Gérez votre label musical, coordonnez vos artistes et suivez les performances de votre organisation.
                  </p>
                </div>
                <Badge className="bg-amber-500/10 border-amber-500/20 text-amber-400 text-xs px-3 py-1">
                  <Crown className="h-3 w-3 mr-1" />
                  Plan Label
                </Badge>
              </div>
            </div>
          </motion.div>

          {/* ====== ORG DASHBOARD OVERVIEW ====== */}
          <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {[
              { label: "Artistes", value: MOCK_ARTISTS.length, icon: <Music className="h-4 w-4" />, gradient: "from-purple-500 to-violet-600", shadow: "shadow-purple-500/20" },
              { label: "Membres", value: MOCK_ORG.memberCount, icon: <Users className="h-4 w-4" />, gradient: "from-pink-500 to-rose-600", shadow: "shadow-pink-500/20" },
              { label: "Crédits restants", value: MOCK_ORG.credits - MOCK_ORG.creditsUsed, icon: <Zap className="h-4 w-4" />, gradient: "from-amber-500 to-orange-600", shadow: "shadow-amber-500/20" },
              { label: "Projets actifs", value: MOCK_PROJECTS.filter(p => p.status === "active").length, icon: <FolderOpen className="h-4 w-4" />, gradient: "from-emerald-500 to-teal-600", shadow: "shadow-emerald-500/20" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                variants={scaleVariants}
                whileHover={{ y: -2, transition: { duration: 0.2 } }}
                className="glass rounded-xl p-4 sm:p-5 relative overflow-hidden group"
              >
                <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-br ${stat.gradient} opacity-10 rounded-full blur-xl group-hover:opacity-20 transition-opacity`} />
                <div className="flex items-center gap-2 mb-2">
                  <div className={`p-1.5 rounded-lg bg-gradient-to-br ${stat.gradient} ${stat.shadow} shadow-sm text-white`}>
                    {stat.icon}
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* ====== ARTIST ROSTER ====== */}
          <motion.div variants={itemVariants}>
            <Card className="glass overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-purple-500/10">
                      <Music className="h-4 w-4 text-purple-400" />
                    </div>
                    <CardTitle className="text-lg text-white">Roster d&apos;artistes</CardTitle>
                    <Badge variant="outline" className="text-xs border-purple-500/30 text-purple-300">
                      {MOCK_ARTISTS.length}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        placeholder="Rechercher un artiste..."
                        value={artistSearch}
                        onChange={(e) => setArtistSearch(e.target.value)}
                        className="pl-8 h-9 w-full sm:w-48 bg-white/5 border-white/10 text-sm"
                      />
                    </div>
                    <Button
                      onClick={handleAddArtist}
                      size="sm"
                      className="btn-gradient text-white text-xs gap-1.5"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      Ajouter
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto pr-1">
                  {filteredArtists.map((artist, i) => (
                    <motion.div
                      key={artist.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05, duration: 0.3 }}
                      whileHover={{ scale: 1.02, transition: { duration: 0.15 } }}
                      className="glass rounded-lg p-3 group cursor-pointer hover:border-purple-500/30 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-purple-500/20">
                          <AvatarFallback className="bg-gradient-to-br from-purple-600/40 to-pink-600/40 text-white text-xs font-medium">
                            {artist.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white text-sm truncate">{artist.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-pink-500/20 text-pink-300">
                              {artist.genre}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                              <Globe className="h-2.5 w-2.5" />
                              {artist.country}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-2 pt-2 border-t border-white/5">
                        <span className="text-[10px] text-muted-foreground">
                          <span className="text-white font-medium">{artist.songs}</span> titres
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          <span className="text-white font-medium">{artist.projects}</span> projets
                        </span>
                        <ChevronRight className="h-3 w-3 text-muted-foreground ml-auto group-hover:text-purple-400 transition-colors" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ====== TEAM MANAGEMENT ====== */}
          <motion.div variants={itemVariants}>
            <Card className="glass overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-pink-500/10">
                      <Users className="h-4 w-4 text-pink-400" />
                    </div>
                    <CardTitle className="text-lg text-white">Équipe &amp; Membres</CardTitle>
                    <Badge variant="outline" className="text-xs border-pink-500/30 text-pink-300">
                      {MOCK_MEMBERS.length}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                {/* Members List */}
                <div className="space-y-2">
                  {MOCK_MEMBERS.map((member, i) => {
                    const roleConfig = ROLE_CONFIG[member.role] || ROLE_CONFIG.Viewer;
                    return (
                      <motion.div
                        key={member.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06, duration: 0.3 }}
                        className="flex items-center gap-3 p-3 rounded-lg glass hover:border-pink-500/20 transition-all group"
                      >
                        <Avatar className="h-9 w-9 border border-white/10">
                          <AvatarFallback className="bg-white/5 text-white text-xs font-medium">
                            {member.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white text-sm">{member.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                        </div>
                        <Badge variant="outline" className={`text-[10px] px-2 py-0.5 gap-1 ${roleConfig.bgColor} ${roleConfig.color}`}>
                          {roleConfig.icon}
                          {member.role}
                        </Badge>
                      </motion.div>
                    );
                  })}
                </div>

                <Separator className="bg-white/5" />

                {/* Invite Form */}
                <div className="space-y-3">
                  <p className="text-sm font-medium text-white flex items-center gap-2">
                    <UserPlus className="h-4 w-4 text-purple-400" />
                    Inviter un membre
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      type="email"
                      placeholder="email@exemple.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="flex-1 bg-white/5 border-white/10 text-sm h-9"
                    />
                    <Select value={inviteRole} onValueChange={setInviteRole}>
                      <SelectTrigger className="w-full sm:w-36 bg-white/5 border-white/10 text-sm h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#16162A] border-white/10">
                        <SelectItem value="Admin">Admin</SelectItem>
                        <SelectItem value="Producer">Producer</SelectItem>
                        <SelectItem value="Artist">Artiste</SelectItem>
                        <SelectItem value="Viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={handleInviteMember}
                      size="sm"
                      className="btn-gradient text-white text-xs gap-1.5 h-9"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      Inviter
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ====== BULK ANALYTICS ====== */}
          <motion.div variants={itemVariants}>
            <Card className="glass overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <BarChart3 className="h-4 w-4 text-amber-400" />
                  </div>
                  <CardTitle className="text-lg text-white">Analytique globale</CardTitle>
                  <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-300">
                    30 derniers jours
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-5 pt-0">
                {/* Key Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <motion.div
                    whileHover={{ y: -2 }}
                    className="glass rounded-lg p-4 relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="h-4 w-4 text-purple-400" />
                      <span className="text-xs text-muted-foreground">Générations totales</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{totalGenerations}</p>
                    <p className="text-[10px] text-emerald-400 flex items-center gap-0.5 mt-1">
                      <TrendingUp className="h-3 w-3" />
                      +18% vs mois précédent
                    </p>
                  </motion.div>

                  <motion.div
                    whileHover={{ y: -2 }}
                    className="glass rounded-lg p-4 relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-4 w-4 text-amber-400" />
                      <span className="text-xs text-muted-foreground">Crédits utilisés</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{totalCreditsUsed}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      sur {MOCK_ORG.credits} alloués
                    </p>
                  </motion.div>

                  <motion.div
                    whileHover={{ y: -2 }}
                    className="glass rounded-lg p-4 relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-4 w-4 text-pink-400" />
                      <span className="text-xs text-muted-foreground">Artiste le plus productif</span>
                    </div>
                    <p className="text-lg font-bold text-white truncate">{mostProductiveArtist}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">42 titres générés</p>
                  </motion.div>
                </div>

                <Separator className="bg-white/5" />

                {/* Style Distribution */}
                <div className="space-y-3">
                  <p className="text-sm font-medium text-white flex items-center gap-2">
                    <Palette className="h-4 w-4 text-pink-400" />
                    Distribution par style
                  </p>
                  <div className="space-y-2">
                    {STYLE_DISTRIBUTION.map((s, i) => (
                      <div key={s.style} className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-20 text-right shrink-0">{s.style}</span>
                        <div className="flex-1 h-5 bg-white/5 rounded-full overflow-hidden relative">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${s.pct}%` }}
                            transition={{ delay: 0.3 + i * 0.1, duration: 0.8, ease: "easeOut" }}
                            className="h-full rounded-full relative"
                            style={{ background: `linear-gradient(90deg, ${s.color}, ${s.color}88)` }}
                          >
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-medium text-white/90">
                              {s.pct}%
                            </span>
                          </motion.div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator className="bg-white/5" />

                {/* Monthly Trend */}
                <div className="space-y-3">
                  <p className="text-sm font-medium text-white flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                    Tendance mensuelle (générations)
                  </p>
                  <div className="flex items-end gap-2 h-32">
                    {MONTHLY_TREND.map((m, i) => {
                      const maxVal = Math.max(...MONTHLY_TREND.map(t => t.value));
                      const heightPct = (m.value / maxVal) * 100;
                      return (
                        <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-[10px] text-muted-foreground">{m.value}</span>
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${heightPct}%` }}
                            transition={{ delay: 0.5 + i * 0.12, duration: 0.6, ease: "easeOut" }}
                            className="w-full rounded-t-md relative"
                            style={{
                              background: `linear-gradient(180deg, ${i === MONTHLY_TREND.length - 1 ? "#F59E0B" : "#7C3AED"}, ${i === MONTHLY_TREND.length - 1 ? "#F59E0B33" : "#7C3AED33"})`,
                              minHeight: "4px",
                            }}
                          />
                          <span className="text-[10px] text-muted-foreground">{m.month}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ====== PROJECTS OVERVIEW ====== */}
          <motion.div variants={itemVariants}>
            <Card className="glass overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <FolderOpen className="h-4 w-4 text-emerald-400" />
                  </div>
                  <CardTitle className="text-lg text-white">Projets de l&apos;organisation</CardTitle>
                  <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-300">
                    {MOCK_PROJECTS.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {MOCK_PROJECTS.map((project, i) => {
                    const statusConfig = STATUS_CONFIG[project.status] || STATUS_CONFIG.draft;
                    return (
                      <motion.div
                        key={project.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08, duration: 0.3 }}
                        whileHover={{ x: 4, transition: { duration: 0.15 } }}
                        className="flex items-center gap-3 p-3 rounded-lg glass hover:border-emerald-500/20 transition-all cursor-pointer group"
                      >
                        <div className="p-2 rounded-lg bg-white/5 shrink-0">
                          <FolderOpen className="h-4 w-4 text-emerald-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white text-sm truncate">{project.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-muted-foreground">
                              {project.artists.join(", ")}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="outline" className={`text-[10px] px-2 py-0.5 gap-1 ${statusConfig.color} border-current/20`}>
                            {statusConfig.icon}
                            {statusConfig.label}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground hidden sm:inline">
                            {new Date(project.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                          <ChevronRight className="h-3 w-3 text-muted-foreground group-hover:text-emerald-400 transition-colors" />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ====== API ACCESS ====== */}
          <motion.div variants={itemVariants}>
            <Card className="glass overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-violet-500/10">
                    <Key className="h-4 w-4 text-violet-400" />
                  </div>
                  <CardTitle className="text-lg text-white">Accès API</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <p className="text-sm text-muted-foreground">
                  Utilisez la clé API pour intégrer Melodia dans vos workflows de label. Accédez à la génération, aux analytics et à la gestion des artistes par programme.
                </p>
                <div className="glass rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground shrink-0">Clé API :</span>
                    <code className="flex-1 text-sm font-mono text-purple-300 bg-purple-500/5 px-3 py-1.5 rounded-md overflow-x-auto">
                      {showApiKey ? "mk_label_a1b2c3d4e5f6g7h8i9j0" : "mk_label_••••••••••••••••••••"}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="text-xs text-muted-foreground hover:text-white h-8"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyApiKey}
                      className="text-xs text-muted-foreground hover:text-white h-8"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Shield className="h-3 w-3 text-emerald-400" />
                      Chiffrement TLS 1.3
                    </span>
                    <span className="flex items-center gap-1">
                      <Activity className="h-3 w-3 text-amber-400" />
                      Limite: 1000 req/min
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs gap-1.5 border-white/10 hover:border-purple-500/30 hover:text-purple-300"
                    asChild
                  >
                    <a href="https://docs.melodia.ai/api" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3.5 w-3.5" />
                      Documentation API
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs gap-1.5 border-white/10 hover:border-pink-500/30 hover:text-pink-300"
                    asChild
                  >
                    <a href="https://docs.melodia.ai/api/playground" target="_blank" rel="noopener noreferrer">
                      <Sparkles className="h-3.5 w-3.5" />
                      Playground
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ====== FOOTER SPACER ====== */}
          <div className="h-4" />
        </motion.div>
      </StudioGate>
    </AppLayout>
  );
}
