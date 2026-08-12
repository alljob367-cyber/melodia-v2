"use client";

import { useState } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
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
import { cn } from "@/lib/utils";

// Demo songs
const songs = [
  {
    id: "1",
    title: "Afro Dreams",
    style: "Afrobeat",
    mood: "Joyeux",
    duration: "3:24",
    status: "completed",
    createdAt: "12 août 2026",
    coverUrl: null,
    plays: 24,
    downloads: 3,
  },
  {
    id: "2",
    title: "Lumière de Douala",
    style: "Makossa",
    mood: "Mélancolique",
    duration: "4:01",
    status: "completed",
    createdAt: "11 août 2026",
    coverUrl: null,
    plays: 18,
    downloads: 5,
  },
  {
    id: "3",
    title: "Freedom Song",
    style: "Amapiano",
    mood: "Énergique",
    duration: "2:58",
    status: "completed",
    createdAt: "10 août 2026",
    coverUrl: null,
    plays: 31,
    downloads: 8,
  },
  {
    id: "4",
    title: "Savane Solitude",
    style: "Afro R&B",
    mood: "Rêveur",
    duration: "3:45",
    status: "completed",
    createdAt: "9 août 2026",
    coverUrl: null,
    plays: 12,
    downloads: 2,
  },
  {
    id: "5",
    title: "Célébration",
    style: "Afropop",
    mood: "Joyeux",
    duration: "3:12",
    status: "generating",
    createdAt: "12 août 2026",
    coverUrl: null,
    plays: 0,
    downloads: 0,
  },
];

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

export default function CreationsPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filteredSongs = songs.filter((song) =>
    song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    song.style.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <Header title="Mes créations" userName="Jean Paul" userPlan="basic" />

        <div className="p-6 space-y-6">
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

          {/* Songs grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredSongs.map((song, i) => (
              <motion.div
                key={song.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                <Card className="glass overflow-hidden group hover:border-purple-500/20 transition-all">
                  {/* Cover area */}
                  <div className="relative aspect-square bg-gradient-to-br from-purple-500/20 via-pink-500/10 to-amber-500/10">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <Music className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 text-white/20" />

                    {/* Play button on hover */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
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
                      <Badge className={cn("text-[10px] font-medium", statusColors[song.status])}>
                        {statusLabels[song.status]}
                      </Badge>
                    </div>

                    {/* Info overlay */}
                    <div className="absolute bottom-3 left-3 right-3">
                      <p className="text-white font-bold text-sm truncate">{song.title}</p>
                      <p className="text-white/60 text-xs">{song.style} · {song.mood}</p>
                    </div>
                  </div>

                  {/* Card footer */}
                  <div className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {song.duration}
                      </span>
                      {song.status === "completed" && (
                        <span className="flex items-center gap-1">
                          <Play className="w-3 h-3" />
                          {song.plays}
                        </span>
                      )}
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="w-7 h-7 text-slate-500 hover:text-white hover:bg-white/5">
                          <MoreVertical className="w-3.5 h-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36 bg-[#16162A] border-white/10">
                        {song.status === "completed" && (
                          <>
                            <DropdownMenuItem className="text-slate-300 focus:text-white focus:bg-white/5">
                              <Download className="w-4 h-4 mr-2" />
                              Télécharger
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-slate-300 focus:text-white focus:bg-white/5">
                              <Share2 className="w-4 h-4 mr-2" />
                              Partager
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuItem className="text-red-400 focus:text-red-300 focus:bg-red-500/5">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Empty state */}
          {filteredSongs.length === 0 && (
            <div className="text-center py-20">
              <Disc className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Aucune chanson trouvée</h3>
              <p className="text-slate-400 text-sm mb-6">Crée ta première chanson avec l&apos;IA</p>
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
    </div>
  );
}
