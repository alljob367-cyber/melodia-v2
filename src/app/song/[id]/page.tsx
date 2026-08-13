"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Music, Play, Pause, SkipBack, SkipForward, Download, Share2, Heart,
  Volume2, Repeat, Shuffle, Copy, FileText, Image as ImageIcon,
  Loader2, ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SongData {
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

function formatDuration(seconds: number | null): string {
  if (!seconds) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function SongResultPage() {
  const { data: session } = useSession();
  const params = useParams();
  const songId = params.id as string;

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [song, setSong] = useState<SongData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const userName = session?.user?.name || "Créateur";
  const userPlan = (session?.user as any)?.plan || "basic";

  useEffect(() => {
    if (!songId) return;
    setLoading(true);
    setNotFound(false);
    fetch(`/api/songs/${songId}`)
      .then((res) => {
        if (res.status === 404) {
          setNotFound(true);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.song) {
          setSong(data.song);
        }
      })
      .catch(() => {
        toast.error("Erreur lors du chargement");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [songId]);

  const lyricsContent = song?.lyrics?.[0]?.content || "Aucunes paroles disponibles";

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      toast.success("Lecture en cours...");
    }
  };

  const handleDownload = () => {
    toast.info("Téléchargement en préparation...");
  };

  const handleShare = () => {
    const url = `${window.location.origin}/song/${songId}`;
    navigator.clipboard?.writeText(url);
    toast.success("Lien copié !");
  };

  const handleCopyLyrics = () => {
    navigator.clipboard?.writeText(lyricsContent);
    toast.success("Paroles copiées !");
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0B14] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
        <span className="ml-3 text-slate-400">Chargement...</span>
      </div>
    );
  }

  // Not found state
  if (notFound || !song) {
    return (
      <div className="min-h-screen bg-[#0B0B14] flex flex-col items-center justify-center gap-4">
        <Music className="w-16 h-16 text-slate-600" />
        <h2 className="text-xl font-bold text-white">Chanson introuvable</h2>
        <p className="text-slate-400 text-sm">Cette chanson n&apos;existe pas ou a été supprimée</p>
        <Link href="/creations">
          <Button className="btn-gradient text-white font-bold rounded-xl">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Mes créations
          </Button>
        </Link>
      </div>
    );
  }

  const styleName = song.style || "Inconnu";
  const moodName = song.mood || "";
  const durationStr = formatDuration(song.duration);

  return (
    <div className="min-h-screen bg-[#0B0B14]">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} userPlan={userPlan} songsRemaining={2} songsTotal={2} />
      <main className={`transition-all duration-300 ${sidebarCollapsed ? "ml-[72px]" : "ml-[280px]"}`}>
        <Header title={song.title} userName={userName} userPlan={userPlan} />
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Cover art */}
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-purple-600/40 via-pink-500/30 to-amber-500/30 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <Music className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 text-white/30" />
                <div className="absolute bottom-6 left-6 right-6">
                  <Badge className="bg-purple-500/20 text-purple-300 text-xs mb-2">{styleName}</Badge>
                  <h1 className="text-3xl font-bold text-white">{song.title}</h1>
                  <p className="text-white/60 text-sm mt-1">{moodName}{moodName ? " · " : ""}{durationStr} · 320 kbps</p>
                </div>
              </div>

              {/* Player & Info */}
              <div className="space-y-6">
                <Card className="glass p-6">
                  <div className="mb-6">
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full w-1/3 rounded-full btn-gradient" />
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-slate-500">
                      <span>0:00</span><span>{durationStr}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-4 mb-6">
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-white/5"><Shuffle className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/5"><SkipBack className="w-5 h-5" /></Button>
                    <Button size="icon" onClick={handlePlayPause} className="w-14 h-14 rounded-full btn-gradient text-white shadow-lg shadow-purple-500/25">
                      {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/5"><SkipForward className="w-5 h-5" /></Button>
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-white/5"><Repeat className="w-4 h-4" /></Button>
                  </div>
                  <div className="flex items-center gap-3">
                    <Volume2 className="w-4 h-4 text-slate-400" />
                    <div className="flex-1 h-1.5 bg-white/10 rounded-full"><div className="h-full w-3/4 rounded-full bg-white/30" /></div>
                  </div>
                </Card>
                <div className="grid grid-cols-2 gap-3">
                  <Button className="bg-white/5 text-white hover:bg-white/10 border border-white/10" onClick={handleDownload}>
                    <Download className="w-4 h-4 mr-2" />Télécharger MP3
                  </Button>
                  <Button className="bg-white/5 text-white hover:bg-white/10 border border-white/10" onClick={handleShare}>
                    <Share2 className="w-4 h-4 mr-2" />Partager
                  </Button>
                  <Button variant="ghost" className={cn("hover:bg-white/5", isLiked ? "text-pink-400" : "text-slate-400")} onClick={() => { setIsLiked(!isLiked); toast.success(isLiked ? "Retiré des favoris" : "Ajouté aux favoris ! ❤️"); }}>
                    <Heart className={cn("w-4 h-4 mr-2", isLiked && "fill-current")} />{isLiked ? "Favori" : "Ajouter aux favoris"}
                  </Button>
                  <Button variant="ghost" className="text-slate-400 hover:bg-white/5 hover:text-white" onClick={() => toast.info("Régénération de la pochette...")}>
                    <ImageIcon className="w-4 h-4 mr-2" />Régénérer pochette
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Lyrics */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="glass p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2"><FileText className="w-5 h-5 text-purple-400" /><h3 className="text-lg font-bold text-white">Paroles</h3></div>
                  <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white hover:bg-white/5" onClick={handleCopyLyrics}>
                    <Copy className="w-4 h-4 mr-1" />Copier
                  </Button>
                </div>
                <div className="whitespace-pre-line text-slate-300 text-sm leading-relaxed">{lyricsContent}</div>
              </Card>
            </motion.div>

            {/* Details */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-6">
              <Card className="glass p-6">
                <h3 className="text-lg font-bold text-white mb-4">Détails</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: "Style", value: styleName },
                    { label: "Ambiance", value: moodName || "—" },
                    { label: "Durée", value: durationStr },
                    { label: "Qualité", value: "320 kbps" },
                    { label: "Thème", value: song.theme || "—" },
                    { label: "Statut", value: song.status === "completed" ? "Terminé" : song.status === "generating" ? "En cours" : song.status },
                    { label: "Audio", value: song.audioUrl ? "Disponible" : "Non disponible" },
                    { label: "Créé le", value: formatDate(song.createdAt) },
                  ].map((d, i) => (
                    <div key={i}><p className="text-xs text-slate-500">{d.label}</p><p className="text-sm text-white font-medium">{d.value}</p></div>
                  ))}
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
