"use client";

import { useSession } from "next-auth/react";
import { AppLayout } from "@/components/dashboard/app-layout";
import { GenerationTracker } from "@/components/studio/generation-tracker";
import { CreditWallet } from "@/components/core/credit-wallet";
import { PermissionGate, StudioGate } from "@/components/core/permission-gate";
import { useMelodia, useCredits, useGenerations } from "@/contexts/melodia-context";
import { useCreditWallet, useProjects, useMedia } from "@/hooks/use-core-queries";
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
  Headphones,
  Building2,
  Lock,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

// ============ HELPERS ============

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
  basic: "Basic",
  artist_starter: "Starter",
  artist_production: "Production",
  video_creator: "Vidéo",
  artist_pro: "Artiste Pro",
  label: "Label / Studio",
  decouverte: "Découverte",
  production: "Production",
  artiste: "Artiste Actif",
  video: "Vidéo",
  professionnel: "Pro",
  studio: "Studio",
};

// ============ STUDIO QUICK ACTIONS ============

interface StudioAction {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  desc: string;
  href: string;
  color: string;
  bg: string;
  studio: "audio" | "video" | "artist" | "label";
}

const studioActions: StudioAction[] = [
  {
    icon: Headphones,
    label: "Audio Studio",
    desc: "Paroles, Audio, Mix",
    href: "/studio/audio",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    studio: "audio",
  },
  {
    icon: Video,
    label: "Vidéo Studio",
    desc: "Clips vidéo IA",
    href: "/studio/video",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    studio: "video",
  },
  {
    icon: Palette,
    label: "Artist Studio",
    desc: "Identité visuelle IA",
    href: "/studio/artist",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    studio: "artist",
  },
  {
    icon: Building2,
    label: "Label Studio",
    desc: "Gestion label & roster",
    href: "/studio/label",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    studio: "label",
  },
  {
    icon: PenTool,
    label: "Paroles IA",
    desc: "Écrire des paroles",
    href: "/studio/audio",
    color: "text-pink-400",
    bg: "bg-pink-500/10",
    studio: "audio",
  },
  {
    icon: Volume2,
    label: "Mix & Master",
    desc: "Finaliser l'audio",
    href: "/studio/audio",
    color: "text-red-400",
    bg: "bg-red-500/10",
    studio: "audio",
  },
];

// ============ MAIN COMPONENT ============

export default function DashboardPage() {
  const { data: session } = useSession();
  const { context, canPerform } = useMelodia();
  const { balance, effective, songsRemaining, coversRemaining, videosRemaining } = useCredits();
  const { hasActive } = useGenerations();

  // React Query hooks for Core API data
  const { data: creditWallet, isLoading: creditsLoading } = useCreditWallet();
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const { data: media, isLoading: mediaLoading } = useMedia();

  const userName = session?.user?.name || context?.name || "Créateur";
  const userPlan = (session?.user as any)?.plan || context?.plan || "basic";

  // Derive data from React Query responses
  const wallet = creditWallet as any;
  const projectList = (projects as any)?.projects || [];
  const mediaList = (media as any)?.media || [];

  // Use recent media as "songs" for the recent songs section
  const recentMedia = mediaList.slice(0, 5);
  const completedMedia = mediaList.filter((m: any) => m.status === "completed" || m.status === "ready");
  const mediaWithCovers = mediaList.filter((m: any) => m.coverUrl || m.thumbnailUrl);

  const isLoading = creditsLoading && mediaLoading;

  // Stats derived from context + React Query
  const stats = [
    {
      label: "Chansons créées",
      value: String(mediaList.length),
      icon: Music,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
    },
    {
      label: "Pochettes IA",
      value: String(mediaWithCovers.length),
      icon: Palette,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      label: "Terminées",
      value: String(completedMedia.length),
      icon: CheckCircle2,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Crédits",
      value: String(effective),
      icon: Wallet,
      color: "text-pink-400",
      bg: "bg-pink-500/10",
    },
  ];

  return (
    <AppLayout title="Tableau de bord">
      <div className="space-y-4 sm:space-y-6">
        {/* Active Generations Tracker */}
        <AnimatePresence>
          {hasActive && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <GenerationTracker maxItems={3} />
            </motion.div>
          )}
        </AnimatePresence>

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
                  <Badge
                    variant="outline"
                    className="border-purple-500/30 text-purple-300 bg-purple-500/10 text-[10px]"
                  >
                    {planNames[userPlan] || userPlan}
                  </Badge>
                  <CreditWallet compact />
                </div>
                <p className="text-slate-400 text-sm">
                  Tu as{" "}
                  <span className="text-purple-400 font-semibold">
                    {songsRemaining} chansons restantes
                  </span>{" "}
                  et{" "}
                  <span className="text-pink-400 font-semibold">
                    {effective} crédits
                  </span>
                  . L&apos;IA est prête à créer !
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/studio/audio">
                  <Button className="btn-gradient text-white font-bold rounded-xl shadow-lg shadow-purple-500/25 hover:scale-105 transition-transform px-6">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Studio IA
                  </Button>
                </Link>
              </div>
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
                  <div
                    className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}
                  >
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-slate-400 mt-1">{stat.label}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Studio Quick Actions — with permission gating */}
        <div>
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Rocket className="w-5 h-5 text-purple-400" />
            Studio rapide
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {studioActions.map((action, i) => (
              <StudioGate
                key={i}
                studio={action.studio}
                fallback={
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Card className="glass p-4 transition-all text-center opacity-40 cursor-not-allowed">
                      <div
                        className={`w-12 h-12 rounded-xl ${action.bg} flex items-center justify-center mx-auto mb-3`}
                      >
                        <action.icon className={`w-6 h-6 ${action.color}`} />
                      </div>
                      <p className="text-sm font-medium text-white">{action.label}</p>
                      <p className="text-[10px] text-slate-500 mt-1">{action.desc}</p>
                      <div className="mt-2 flex items-center justify-center gap-1 text-slate-500">
                        <Lock className="w-3 h-3" />
                        <span className="text-[9px]">Plan requis</span>
                      </div>
                    </Card>
                  </motion.div>
                }
              >
                <Link href={action.href}>
                  <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}>
                    <Card className="glass p-4 hover:border-purple-500/20 transition-all text-center group cursor-pointer">
                      <div
                        className={`w-12 h-12 rounded-xl ${action.bg} flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}
                      >
                        <action.icon className={`w-6 h-6 ${action.color}`} />
                      </div>
                      <p className="text-sm font-medium text-white">{action.label}</p>
                      <p className="text-[10px] text-slate-500 mt-1">{action.desc}</p>
                    </Card>
                  </motion.div>
                </Link>
              </StudioGate>
            ))}
          </div>
        </div>

        {/* Two column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Recent media/songs - 3 cols */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Créations récentes</h3>
              <Link
                href="/creations"
                className="text-sm text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1"
              >
                Voir tout <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                <span className="ml-2 text-slate-400 text-sm">Chargement...</span>
              </div>
            ) : recentMedia.length === 0 ? (
              <Card className="glass p-8 text-center">
                <Disc className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 mb-2">Aucune création encore</p>
                <p className="text-slate-500 text-xs mb-4">
                  Lance le studio IA pour créer ton premier hit
                </p>
                <Link href="/studio/audio" className="inline-block">
                  <Button className="btn-gradient text-white font-bold rounded-xl">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Créer ma première chanson
                  </Button>
                </Link>
              </Card>
            ) : (
              <div className="space-y-3">
                {recentMedia.map((item: any, i: number) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.1 }}
                  >
                    <Link href={`/song/${item.id}`}>
                      <Card className="glass p-4 hover:border-purple-500/20 transition-all group">
                        <div className="flex items-center gap-4">
                          {/* Cover thumbnail */}
                          <div className="flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden">
                            {(item.coverUrl || item.thumbnailUrl) &&
                            !(item.coverUrl || item.thumbnailUrl).startsWith("/covers/") ? (
                              <img
                                src={item.coverUrl || item.thumbnailUrl}
                                alt={item.title || item.name || "Média"}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                                <Music className="w-6 h-6 text-purple-400" />
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">
                              {item.title || item.name || "Sans titre"}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {item.style && (
                                <span className="text-xs text-slate-500">{item.style}</span>
                              )}
                              {item.style && <span className="text-xs text-slate-600">•</span>}
                              {item.duration && (
                                <span className="text-xs text-slate-500">
                                  {formatDuration(item.duration)}
                                </span>
                              )}
                              {(item.status === "completed" || item.status === "ready") && (
                                <Badge
                                  variant="outline"
                                  className="text-[9px] border-emerald-500/20 text-emerald-400 px-1.5 py-0"
                                >
                                  Prête
                                </Badge>
                              )}
                              {(item.status === "generating" || item.status === "processing") && (
                                <Badge
                                  variant="outline"
                                  className="text-[9px] border-amber-500/20 text-amber-400 px-1.5 py-0"
                                >
                                  <Loader2 className="w-2.5 h-2.5 mr-0.5 animate-spin" />
                                  En cours
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Time & Actions */}
                          <span className="text-xs text-slate-500 hidden sm:block">
                            {formatTimeAgo(item.createdAt)}
                          </span>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {(item.status === "completed" || item.status === "ready") && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="w-8 h-8 text-slate-400 hover:text-white hover:bg-white/5"
                                >
                                  <Play className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="w-8 h-8 text-slate-400 hover:text-white hover:bg-white/5"
                                >
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
            {/* Credit Wallet Component */}
            <CreditWallet showUsage showPurchase className="mb-4" />

            {/* Credit usage details — legacy-style progress bars with Core API data */}
            <Card className="glass p-5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-purple-400" />
                  Utilisation détaillée
                </h4>
                <Badge
                  variant="outline"
                  className="border-purple-500/30 text-purple-300 bg-purple-500/5 text-[10px]"
                >
                  {effective} cr.
                </Badge>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-400">Chansons IA</span>
                    <span className="text-white font-medium">
                      {songsRemaining} restantes
                    </span>
                  </div>
                  <Progress
                    value={
                      songsRemaining > 0
                        ? Math.min(
                            ((context?.creditBalance || 0) > 0
                              ? ((context?.creditBalance || 0) - songsRemaining) /
                                (context?.creditBalance || 1)
                              : 0) * 100,
                            100
                          )
                        : 100
                    }
                    className="h-2 bg-white/5 [&>div]:bg-purple-500"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-400">Pochettes IA</span>
                    <span className="text-white font-medium">
                      {coversRemaining} restantes
                    </span>
                  </div>
                  <Progress
                    value={
                      coversRemaining > 0
                        ? Math.min(
                            ((context?.creditBalance || 0) > 0
                              ? ((context?.creditBalance || 0) - coversRemaining) /
                                (context?.creditBalance || 1)
                              : 0) * 100,
                            100
                          )
                        : 100
                    }
                    className="h-2 bg-white/5 [&>div]:bg-amber-400"
                  />
                </div>
                {/* Video usage — only for users with video permission */}
                <PermissionGate
                  feature="CREATE_VIDEO"
                  fallback={null}
                >
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-400">Clips vidéo</span>
                      <span className="text-white font-medium">
                        {videosRemaining} restantes
                      </span>
                    </div>
                    <Progress
                      value={
                        videosRemaining > 0
                          ? Math.min(
                              ((context?.creditBalance || 0) > 0
                                ? ((context?.creditBalance || 0) - videosRemaining) /
                                  (context?.creditBalance || 1)
                                : 0) * 100,
                              100
                            )
                          : 100
                      }
                      className="h-2 bg-white/5 [&>div]:bg-emerald-500"
                    />
                  </div>
                </PermissionGate>
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-400">Stockage</span>
                    <span className="text-white font-medium">
                      {balance - effective} cr. réservés
                    </span>
                  </div>
                  <Progress
                    value={
                      balance > 0
                        ? Math.min(((balance - effective) / balance) * 100, 100)
                        : 0
                    }
                    className="h-2 bg-white/5 [&>div]:bg-pink-500"
                  />
                </div>
              </div>
            </Card>

            {/* Upgrade prompt */}
            <Card className="glass p-5 border-purple-500/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full blur-[40px]" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-3">
                  <Crown className="w-5 h-5 text-amber-400" />
                  <h4 className="text-sm font-semibold text-white">
                    Passe au plan supérieur
                  </h4>
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
    </AppLayout>
  );
}
