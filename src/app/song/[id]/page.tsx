"use client";

import { useState } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Music, Play, Pause, SkipBack, SkipForward, Download, Share2, Heart,
  Volume2, Repeat, Shuffle, Copy, FileText, Image as ImageIcon,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const demoLyrics = `[Couplet 1]
Dans les rues de Douala, les rêves s'éveillent
Sous le soleil africain, mon cœur bat fort
Les étoiles chantent, la nuit s'habille
De mille couleurs, de mille accords

[Refrain]
Afro dreams, rêves d'Afrique
Danser sur les rythmes de la vie
Afro dreams, l'avenir qui s'écrit
Avec l'IA, la musique nous unit

[Couplet 2]
Du Lagos au Kinshasa, même fréquence
Les basses résonnent, les cœurs en danse
La technologie au service de l'art
Chaque note est un nouveau départ

[Refrain]
Afro dreams, rêves d'Afrique
Danser sur les rythmes de la vie
Afro dreams, l'avenir qui s'écrit
Avec l'IA, la musique nous unit`;

export default function SongResultPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  return (
    <div className="min-h-screen bg-[#0B0B14]">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} userPlan="basic" songsRemaining={2} songsTotal={2} />
      <main className={`transition-all duration-300 ${sidebarCollapsed ? "ml-[72px]" : "ml-[280px]"}`}>
        <Header title="Afro Dreams" userName="Jean Paul" userPlan="basic" />
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Cover art */}
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-purple-600/40 via-pink-500/30 to-amber-500/30 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <Music className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 text-white/30" />
                <div className="absolute bottom-6 left-6 right-6">
                  <Badge className="bg-purple-500/20 text-purple-300 text-xs mb-2">Afrobeat</Badge>
                  <h1 className="text-3xl font-bold text-white">Afro Dreams</h1>
                  <p className="text-white/60 text-sm mt-1">Joyeux · 3:24 · 320 kbps</p>
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
                      <span>1:12</span><span>3:24</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-4 mb-6">
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-white/5"><Shuffle className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/5"><SkipBack className="w-5 h-5" /></Button>
                    <Button size="icon" onClick={() => setIsPlaying(!isPlaying)} className="w-14 h-14 rounded-full btn-gradient text-white shadow-lg shadow-purple-500/25">
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
                  <Button className="bg-white/5 text-white hover:bg-white/10 border border-white/10" onClick={() => toast.success("Téléchargement commencé !")}>
                    <Download className="w-4 h-4 mr-2" />Télécharger MP3
                  </Button>
                  <Button className="bg-white/5 text-white hover:bg-white/10 border border-white/10" onClick={() => { navigator.clipboard?.writeText("https://melodia.ai/song/afro-dreams"); toast.success("Lien copié !"); }}>
                    <Share2 className="w-4 h-4 mr-2" />Partager
                  </Button>
                  <Button variant="ghost" className={cn("hover:bg-white/5", isLiked ? "text-pink-400" : "text-slate-400")} onClick={() => setIsLiked(!isLiked)}>
                    <Heart className={cn("w-4 h-4 mr-2", isLiked && "fill-current")} />{isLiked ? "Favori" : "Ajouter aux favoris"}
                  </Button>
                  <Button variant="ghost" className="text-slate-400 hover:bg-white/5 hover:text-white"><ImageIcon className="w-4 h-4 mr-2" />Régénérer pochette</Button>
                </div>
              </div>
            </motion.div>

            {/* Lyrics */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="glass p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2"><FileText className="w-5 h-5 text-purple-400" /><h3 className="text-lg font-bold text-white">Paroles</h3></div>
                  <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white hover:bg-white/5" onClick={() => { navigator.clipboard?.writeText(demoLyrics); toast.success("Paroles copiées !"); }}>
                    <Copy className="w-4 h-4 mr-1" />Copier
                  </Button>
                </div>
                <div className="whitespace-pre-line text-slate-300 text-sm leading-relaxed">{demoLyrics}</div>
              </Card>
            </motion.div>

            {/* Details */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-6">
              <Card className="glass p-6">
                <h3 className="text-lg font-bold text-white mb-4">Détails</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[{ label: "Style", value: "Afrobeat" }, { label: "Ambiance", value: "Joyeux" }, { label: "Durée", value: "3:24" }, { label: "Qualité", value: "320 kbps" }, { label: "Écoutes", value: "24" }, { label: "Téléchargements", value: "3" }, { label: "Partages", value: "2" }, { label: "Créé le", value: "12 août 2026" }].map((d, i) => (
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
