"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { MobileBottomNav } from "@/components/mobile-nav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Music,
  Play,
  Download,
  Share2,
  MoreVertical,
  Search,
  Filter,
  PlusCircle,
  Trash2,
  Heart,
  Clock,
  Disc,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
  lyrics?: { content: string }[];
}

const statusColors: Record<string, string> = {
  completed: "bg-emerald-500/10 text-emerald-400",
  generating: "bg-amber-500/10 text-amber-400",
  failed: "bg-red-500/10 text-red-400",
  draft: "bg-slate-500/10 text-slate-400",
};

const statusLabels: Record<string, string> = {
  completed: "Terminé",
  generating: "En cours",
  failed: "Échoué",
  draft: "Brouillon",
};

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
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

export default function CreationsPage() {
  const { data: session } = useSession();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);

  const userId = (session?.user as any)?.id as string | undefined;
  const userName = session?.user?.name || "Créateur";
  const userPlan = (session?.user as any)?.plan || "basic";

  const fetchSongs = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/songs?userId=${userId}`);
      const data = await res.json();
      if (data.songs) {
        setSongs(data.songs);
      }
    } catch {
      toast.error("Erreur lors du chargement des chansons");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchSongs();
  }, [fetchSongs]);

  const handleDelete = async (songId: string) => {
    try {
      const res = await fetch(`/api/songs/${songId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setSongs((prev) => prev.filter((s) => s.id !== songId));
        toast.success("Chanson supprimée");
      } else {
        toast.error(data.error || "Erreur lors de la suppression");
      }
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  const filteredSongs = songs.filter((song) =>
    song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    song.style.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0B0B14]">
      {/* Sidebar desktop uniquement */}
      <div className="hidden lg:block">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          userPlan={userPlan}
          songsRemaining={2}
          songsTotal={2}
        />
      </div>

      <main className={`transition-all duration-300 lg:${sidebarCollapsed ? "ml-[72px]" : "ml-[280px]"} pb-20 lg:pb-0`}>
        <Header title="Mes créations" userName={userName} userPlan={userPlan} />

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Top bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
              <div className="relative flex-1 sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-purple-500/50"
                />
              </div>
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-white/5">
                <Filter className="w-4 h-4" />
              </Button>
            </div>
            <Link href="/create">
              <Button className="btn-gradient text-white font-bold rounded-xl shadow-lg shadow-purple-500/25">
                <PlusCircle className="w-4 h-4 mr-2" />
                Nouvelle chanson
              </Button>
            </Link>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
              <span className="ml-3 text-slate-400">Chargement...</span>
            </div>
          )}

          {/* Songs grid */}
          {!loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredSongs.map((song, i) => (
                <motion.div
                  key={song.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                >
                  <Link href={`/song/${song.id}`}>
                    <Card className="glass overflow-hidden group hover:border-purple-500/20 transition-all">
                      {/* Cover area */}
                      <div className="relative aspect-square bg-gradient-to-br from-purple-500/20 via-pink-500/10 to-amber-500/10">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        <Music className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 text-white/20" />

                        {/* Play button on hover */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                          {song.status === "completed" && (
                            <Button size="icon" className="w-12 h-12 rounded-full btn-gradient text-white shadow-lg">
                              <Play className="w-5 h-5" />
                            </Button>
                          )}
                          {song.status === "generating" && (
                            <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                              <svg className="animate-spin w-6 h-6 text-amber-400" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* Status badge */}
                        <div className="absolute top-3 right-3">
                          <Badge className={cn("text-[10px] font-medium", statusColors[song.status] || statusColors.draft)}>
                            {statusLabels[song.status] || song.status}
                          </Badge>
                        </div>

                        {/* Info overlay */}
                        <div className="absolute bottom-3 left-3 right-3">
                          <p className="text-white font-bold text-sm truncate">{song.title}</p>
                          <p className="text-white/60 text-xs">{song.style} · {song.mood || ""}</p>
                        </div>
                      </div>

                      {/* Card footer */}
                      <div className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDuration(song.duration)}
                          </span>
                          <span className="flex items-center gap-1">
                            {formatTimeAgo(song.createdAt)}
                          </span>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="w-7 h-7 text-slate-500 hover:text-white hover:bg-white/5" onClick={(e) => e.preventDefault()}>
                              <MoreVertical className="w-3.5 h-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-36 bg-[#16162A] border-white/10">
                            {song.status === "completed" && (
                              <>
                                <DropdownMenuItem className="text-slate-300 focus:text-white focus:bg-white/5" onClick={() => toast.info("Téléchargement en préparation...")}>
                                  <Download className="w-4 h-4 mr-2" />
                                  Télécharger
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-slate-300 focus:text-white focus:bg-white/5" onClick={() => { navigator.clipboard?.writeText(`${window.location.origin}/song/${song.id}`); toast.success("Lien copié !"); }}>
                                  <Share2 className="w-4 h-4 mr-2" />
                                  Partager
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuItem className="text-red-400 focus:text-red-300 focus:bg-red-500/5" onClick={() => handleDelete(song.id)}>
                              <Trash2 className="w-4 h-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && filteredSongs.length === 0 && (
            <div className="text-center py-20">
              <Disc className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              {songs.length === 0 ? (
                <>
                  <h3 className="text-lg font-semibold text-white mb-2">Aucune chanson encore</h3>
                  <p className="text-slate-400 text-sm mb-6">Crée ta première chanson avec l&apos;IA</p>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-semibold text-white mb-2">Aucune chanson trouvée</h3>
                  <p className="text-slate-400 text-sm mb-6">Essaie avec un autre terme de recherche</p>
                </>
              )}
              <Link href="/create">
                <Button className="btn-gradient text-white font-bold rounded-xl">
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Créer une chanson
                </Button>
              </Link>
            </div>
          )}
        </div>
      </main>
      <MobileBottomNav />
    </div>
  );
}
