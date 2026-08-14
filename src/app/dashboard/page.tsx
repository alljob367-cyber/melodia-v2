"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { MobileBottomNav } from "@/components/mobile-nav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Music,
  PlusCircle,
  TrendingUp,
  Clock,
  Disc,
  Play,
  Download,
  Share2,
  Sparkles,
  Mic,
  Image,
  Video,
  ArrowRight,
  Crown,
  CheckCircle2,
  Zap,
  Volume2,
  Film,
  Cloud,
  Loader2,
  PenTool,
  Palette,
  Clapperboard,
  Rocket,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface Song {
  id: string;
  title: string;
  style: string;
  mood: string | null;
  theme: string | null;
  status: string;
  duration: number | null;
  audioUrl: string | null;
  coverUrl: string | null;
  createdAt: string;
}

interface UserCredits {
  credits: number;
  songsRemaining: number;
  coversRemaining: number;
  videosRemaining: number;
  totalSongsUsed: number;
  totalCoversUsed: number;
  totalVideosUsed: number;
  totalCreditsUsed: number;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

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

const planNames: Record<string, string> = {
  decouverte: "Découverte",
  production: "Production",
  artiste: "Artiste Actif",
  video: "Vidéo",
  professionnel: "Professionnel",
  label: "Label / Studio",
  basic: "Basic",
  pro: "Pro",
  studio: "Studio",
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [songs, setSongs] = useState<Song[]>([]);
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [loading, setLoading] = useState(true);

  const userId = (session?.user as any)?.id as string | undefined;
  const userName = session?.user?.name || "Créateur";
  const userPlan = (session?.user as any)?.plan || "decouverte";

  useEffect(() => {
    if (!userId) return;
    setLoading(true);

    // Fetch songs
    fetch(`/api/songs?userId=${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.songs) setSongs(data.songs);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    // Fetch credits
    fetch(`/api/me/credits?userId=${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.credits) setCredits(data.credits);
      })
      .catch(() => {});
  }, [userId]);

  const recentSongs = songs.slice(0, 5);
  const completedSongs = songs.filter((s) => s.status === "completed");
  const songsWithCovers = songs.filter((s) => s.coverUrl);

  const stats = [
    { label: "Chansons créées", value: String(songs.length), icon: Music, color: "text-purple-400", bg: "bg-purple-500/10" },
    { label: "Pochettes IA", value: String(songsWithCovers.length), icon: Palette, color: "text-amber-400", bg: "bg-amber-500/10" },
    { label: "Terminées", value: String(completedSongs.length), icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Crédits", value: String(credits?.credits || 0), icon: Wallet, color: "text-pink-400", bg: "bg-pink-500/10" },
  ];

  return (
    <div className="min-h-screen bg-[#0B0B14]">
      {/* Sidebar desktop uniquement */}
      <div className="hidden lg:block">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          userPlan={userPlan}
          songsRemaining={credits?.songsRemaining || 3}
          songsTotal={credits?.songsRemaining || 3}
        />
      </div>

      {/* Mobile: sidebar caché, Bottom Nav visible */}
      <main className={`transition-all duration-300 ${sidebarCollapsed ? "lg:ml-[72px]" : "lg:ml-[280px]"} pb-20 lg:pb-0`}>
        <Header title="Studio" userName={userName} userPlan={userPlan} />

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Welcome banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="glass p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-60 h-60 bg-purple-500/5 rounded-full blur-[80px]" />
              <div className="absolute bottom-0 left-1/2 w-40 h-40 bg-pink-500/5 rounded-full blur-[60px]" />
              <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-2xl font-bold text-white">
                      Bienvenue, {userName} ! 👋
                    </h2>
                    <Badge variant="outline" className="border-purple-500/30 text-purple-300 bg-purple-500/10 text-[10px]">
                      {planNames[userPlan] || userPlan}
                    </Badge>
                  </div>
                  <p className="text-slate-400 text-sm">
                    Tu as <span className="text-purple-400 font-semibold">{credits?.songsRemaining || 0} chansons restantes</span> et <span className="text-pink-400 font-semibold">{credits?.credits || 0} crédits</span>. L&apos;IA est prée à créer !
                  </p>
                </div>
                <Link href="/create">
                  <Button className="btn-gradient text-white font-bold rounded-xl shadow-lg shadow-purple-500/25 hover:scale-105 transition-transform px-6">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Studio IA
                  </Button>
                </Link>
              </div>
            </Card>
          </motion.div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Card className="glass p-5 hover:border-purple-500/20 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                      <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-slate-400 mt-1">{stat.label}</p>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Studio Quick Actions */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Rocket className="w-5 h-5 text-purple-400" />
              Studio rapide
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { icon: PenTool, label: "Paroles IA", desc: "Écrire des paroles", href: "/create", color: "text-pink-400", bg: "bg-pink-500/10" },
                { icon: Music, label: "Chanson complète", desc: "Paroles + Audio + Pochette", href: "/create", color: "text-purple-400", bg: "bg-purple-500/10" },
                { icon: Mic, label: "Voix & Audio", desc: "Synthèse vocale IA", href: "/create", color: "text-amber-400", bg: "bg-amber-500/10" },
                { icon: Palette, label: "Pochette IA", desc: "Design album", href: "/create", color: "text-emerald-400", bg: "bg-emerald-500/10" },
                { icon: Clapperboard, label: "Clip vidéo", desc: "Vidéo musicale IA", href: "/create", color: "text-blue-400", bg: "bg-blue-500/10" },
                { icon: Volume2, label: "Mix & Master", desc: "Finaliser l'audio", href: "/create", color: "text-red-400", bg: "bg-red-500/10" },
              ].map((action, i) => (
                <Link key={i} href={action.href}>
                  <motion.div
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Card className="glass p-4 hover:border-purple-500/20 transition-all text-center group cursor-pointer">
                      <div className={`w-12 h-12 rounded-xl ${action.bg} flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                        <action.icon className={`w-6 h-6 ${action.color}`} />
                      </div>
                      <p className="text-sm font-medium text-white">{action.label}</p>
                      <p className="text-[10px] text-slate-500 mt-1">{action.desc}</p>
                    </Card>
                  </motion.div>
                </Link>
              ))}
            </div>
          </div>

          {/* Two column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Recent songs - 3 cols */}
            <div className="lg:col-span-3 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Chansons récentes</h3>
                <Link href="/creations" className="text-sm text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1">
                  Voir tout <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                  <span className="ml-2 text-slate-400 text-sm">Chargement...</span>
                </div>
              ) : recentSongs.length === 0 ? (
                <Card className="glass p-8 text-center">
                  <Disc className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400 mb-2">Aucune chanson encore</p>
                  <p className="text-slate-500 text-xs mb-4">Lance le studio IA pour créer ton premier hit</p>
                  <Link href="/create" className="inline-block">
                    <Button className="btn-gradient text-white font-bold rounded-xl">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Créer ma première chanson
                    </Button>
                  </Link>
                </Card>
              ) : (
                <div className="space-y-3">
                  {recentSongs.map((song, i) => (
                    <motion.div
                      key={song.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: i * 0.1 }}
                    >
                      <Link href={`/song/${song.id}`}>
                        <Card className="glass p-4 hover:border-purple-500/20 transition-all group">
                          <div className="flex items-center gap-4">
                            {/* Cover thumbnail */}
                            <div className="flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden">
                              {song.coverUrl && !song.coverUrl.startsWith("/covers/") ? (
                                <img src={song.coverUrl} alt={song.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                                  <Music className="w-6 h-6 text-purple-400" />
                                </div>
                              )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-white truncate">{song.title}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs text-slate-500">{song.style}</span>
                                <span className="text-xs text-slate-600">•</span>
                                <span className="text-xs text-slate-500">{formatDuration(song.duration)}</span>
                                {song.status === "completed" && (
                                  <Badge variant="outline" className="text-[9px] border-emerald-500/20 text-emerald-400 px-1.5 py-0">Prête</Badge>
                                )}
                                {song.status === "generating" && (
                                  <Badge variant="outline" className="text-[9px] border-amber-500/20 text-amber-400 px-1.5 py-0">
                                    <Loader2 className="w-2.5 h-2.5 mr-0.5 animate-spin" />
                                    En cours
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Time & Actions */}
                            <span className="text-xs text-slate-500 hidden sm:block">{formatTimeAgo(song.createdAt)}</span>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {song.status === "completed" && (
                                <>
                                  <Button variant="ghost" size="icon" className="w-8 h-8 text-slate-400 hover:text-white hover:bg-white/5">
                                    <Play className="w-4 h-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="w-8 h-8 text-slate-400 hover:text-white hover:bg-white/5">
                                    <Download className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </Card>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Credits & Upgrade - 2 cols */}
            <div className="lg:col-span-2 space-y-4">
              {/* Credit usage */}
              <Card className="glass p-5">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-purple-400" />
                    Crédits & Utilisation
                  </h4>
                  <Badge variant="outline" className="border-purple-500/30 text-purple-300 bg-purple-500/5 text-[10px]">
                    {credits?.credits || 0} cr.
                  </Badge>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-400">Chansons IA</span>
                      <span className="text-white font-medium">{credits?.totalSongsUsed || 0} / {credits?.songsRemaining ? (credits.songsRemaining + (credits.totalSongsUsed || 0)) : "∞"}</span>
                    </div>
                    <Progress
                      value={credits ? Math.min(((credits.totalSongsUsed || 0) / ((credits.songsRemaining || 0) + (credits.totalSongsUsed || 0) || 1)) * 100, 100) : 0}
                      className="h-2 bg-white/5 [&>div]:bg-purple-500"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-400">Pochettes IA</span>
                      <span className="text-white font-medium">{credits?.totalCoversUsed || 0} / {credits?.coversRemaining ? (credits.coversRemaining + (credits.totalCoversUsed || 0)) : "∞"}</span>
                    </div>
                    <Progress
                      value={credits ? Math.min(((credits.totalCoversUsed || 0) / ((credits.coversRemaining || 0) + (credits.totalCoversUsed || 0) || 1)) * 100, 100) : 0}
                      className="h-2 bg-white/5 [&>div]:bg-amber-400"
                    />
                  </div>
                  {credits && credits.videosRemaining > 0 && (
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-slate-400">Clips vidéo</span>
                        <span className="text-white font-medium">{credits.totalVideosUsed || 0} / {(credits.videosRemaining || 0) + (credits.totalVideosUsed || 0)}</span>
                      </div>
                      <Progress
                        value={Math.min(((credits.totalVideosUsed || 0) / ((credits.videosRemaining || 0) + (credits.totalVideosUsed || 0) || 1)) * 100, 100)}
                        className="h-2 bg-white/5 [&>div]:bg-emerald-500"
                      />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-400">Stockage</span>
                      <span className="text-white font-medium">{credits?.totalCreditsUsed || 0} cr. utilisés</span>
                    </div>
                    <Progress value={credits ? Math.min(((credits.totalCreditsUsed || 0) / (credits.credits + (credits.totalCreditsUsed || 0) || 1)) * 100, 100) : 0} className="h-2 bg-white/5 [&>div]:bg-pink-500" />
                  </div>
                </div>
              </Card>

              {/* Upgrade prompt */}
              <Card className="glass p-5 border-purple-500/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full blur-[40px]" />
                <div className="relative">
                  <div className="flex items-center gap-3 mb-3">
                    <Crown className="w-5 h-5 text-amber-400" />
                    <h4 className="text-sm font-semibold text-white">Passe au plan supérieur</h4>
                  </div>
                  <p className="text-xs text-slate-400 mb-4">
                    Plus de chansons, clips vidéo, et modèles IA exclusifs.
                  </p>
                  <Link href="/subscription">
                    <Button className="w-full btn-gradient text-white font-bold text-xs py-2.5 rounded-lg">
                      Voir les 6 plans
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </Link>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
      {/* Navigation mobile en bas */}
      <MobileBottomNav />
    </div>
  );
}
