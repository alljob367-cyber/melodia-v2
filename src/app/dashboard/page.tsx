"use client";

import { useState } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

// Demo data
const recentSongs = [
  { id: "1", title: "Afro Dreams", style: "Afrobeat", duration: "3:24", status: "completed", coverUrl: null, createdAt: "Il y a 2h" },
  { id: "2", title: "Lumière de Douala", style: "Makossa", duration: "4:01", status: "completed", coverUrl: null, createdAt: "Il y a 5h" },
  { id: "3", title: "Freedom Song", style: "Amapiano", duration: "2:58", status: "generating", coverUrl: null, createdAt: "Il y a 1j" },
];

const stats = [
  { label: "Chansons créées", value: "3", icon: Music, color: "text-purple-400", bg: "bg-purple-500/10" },
  { label: "Pochettes IA", value: "2", icon: Image, color: "text-amber-400", bg: "bg-amber-500/10" },
  { label: "Téléchargements", value: "7", icon: Download, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  { label: "Partages", value: "4", icon: Share2, color: "text-pink-400", bg: "bg-pink-500/10" },
];

export default function DashboardPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#0B0B14]">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        userPlan="basic"
        songsRemaining={2}
        songsTotal={2}
      />

      <main
        className={`transition-all duration-300 ${sidebarCollapsed ? "ml-[72px]" : "ml-[280px]"}`}
      >
        <Header title="Tableau de bord" userName="Jean Paul" userPlan="basic" />

        <div className="p-6 space-y-6">
          {/* Welcome banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="glass p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/5 rounded-full blur-[60px]" />
              <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">
                    Bienvenue, Jean Paul ! 👋
                  </h2>
                  <p className="text-slate-400 text-sm">
                    Tu as <span className="text-purple-400 font-semibold">2 créations restantes</span> sur ton pack Basic. Continue à créer !
                  </p>
                </div>
                <Link href="/create">
                  <Button className="btn-gradient text-white font-bold rounded-xl shadow-lg shadow-purple-500/25 hover:scale-105 transition-transform">
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Créer une chanson
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

              <div className="space-y-3">
                {recentSongs.map((song, i) => (
                  <motion.div
                    key={song.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.1 }}
                  >
                    <Card className="glass p-4 hover:border-purple-500/20 transition-all group">
                      <div className="flex items-center gap-4">
                        {/* Cover thumbnail */}
                        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                          <Music className="w-5 h-5 text-purple-400" />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{song.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-slate-500">{song.style}</span>
                            <span className="text-xs text-slate-600">•</span>
                            <span className="text-xs text-slate-500">{song.duration}</span>
                            {song.status === "generating" && (
                              <span className="text-xs text-amber-400 flex items-center gap-1">
                                <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                                Génération...
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Time & Actions */}
                        <span className="text-xs text-slate-500 hidden sm:block">{song.createdAt}</span>
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
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Quick actions & Credits - 2 cols */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-lg font-bold text-white">Actions rapides</h3>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Music, label: "Nouvelle chanson", href: "/create", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
                  { icon: Mic, label: "Paroles IA", href: "/create?tab=lyrics", color: "text-pink-400", bg: "bg-pink-500/10", border: "border-pink-500/20" },
                  { icon: Image, label: "Pochette IA", href: "/create?tab=cover", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
                  { icon: Video, label: "Clip vidéo", href: "/create?tab=video", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
                ].map((action, i) => (
                  <Link key={i} href={action.href}>
                    <Card className={`glass p-4 hover:${action.border} transition-all text-center group cursor-pointer`}>
                      <div className={`w-10 h-10 rounded-xl ${action.bg} flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                        <action.icon className={`w-5 h-5 ${action.color}`} />
                      </div>
                      <p className="text-xs font-medium text-slate-300">{action.label}</p>
                    </Card>
                  </Link>
                ))}
              </div>

              {/* Credit usage */}
              <Card className="glass p-5 mt-4">
                <h4 className="text-sm font-semibold text-white mb-4">Utilisation du mois</h4>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-400">Chansons IA</span>
                      <span className="text-white font-medium">1 / 2</span>
                    </div>
                    <Progress value={50} className="h-2 bg-white/5 [&>div]:bg-purple-500" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-400">Pochettes IA</span>
                      <span className="text-white font-medium">1 / 2</span>
                    </div>
                    <Progress value={50} className="h-2 bg-white/5 [&>div]:bg-amber-400" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-400">Stockage</span>
                      <span className="text-white font-medium">12 Mo / 1 Go</span>
                    </div>
                    <Progress value={1} className="h-2 bg-white/5 [&>div]:bg-emerald-500" />
                  </div>
                </div>
              </Card>

              {/* Upgrade prompt */}
              <Card className="glass p-5 border-purple-500/20">
                <div className="flex items-center gap-3 mb-3">
                  <Crown className="w-5 h-5 text-amber-400" />
                  <h4 className="text-sm font-semibold text-white">Passe à PRO</h4>
                </div>
                <p className="text-xs text-slate-400 mb-4">
                  Débloque 20 chansons/mois, voix IA, clips vidéo et plus.
                </p>
                <Link href="/subscription">
                  <Button className="w-full btn-gradient text-white font-bold text-xs py-2.5 rounded-lg">
                    Voir les plans
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
