"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Brain,
  Clock,
  TrendingUp,
  Sparkles,
  Music,
  PenTool,
  Palette,
  Mic,
  Video,
  ArrowRight,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";

export function MemoryDashboardClient() {
  const { data: session } = useSession();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);

  const userName = session?.user?.name || "Créateur";
  const userPlan = (session?.user as any)?.plan || "decouverte";

  useEffect(() => {
    setLoading(false);
  }, []);

  const memoryStats = [
    { label: "Paroles sauvegardées", value: "0", icon: PenTool, color: "text-pink-400", bg: "bg-pink-500/10" },
    { label: "Compositions", value: "0", icon: Music, color: "text-purple-400", bg: "bg-purple-500/10" },
    { label: "Pochettes", value: "0", icon: Palette, color: "text-amber-400", bg: "bg-amber-500/10" },
    { label: "Préférences style", value: "0", icon: Brain, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  ];

  return (
    <div className="min-h-screen bg-[#0B0B14]">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        userPlan={userPlan}
        songsRemaining={3}
        songsTotal={3}
      />

      <main className={`transition-all duration-300 ${sidebarCollapsed ? "ml-[72px]" : "ml-[280px]"}`}>
        <Header title="Mémoire IA" userName={userName} userPlan={userPlan} />

        <div className="p-6 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="glass p-6">
              <div className="flex items-center gap-3 mb-2">
                <Brain className="w-6 h-6 text-purple-400" />
                <h2 className="text-xl font-bold text-white">Mémoire IA</h2>
                <Badge variant="outline" className="border-purple-500/30 text-purple-300 bg-purple-500/10 text-[10px]">
                  Bientôt
                </Badge>
              </div>
              <p className="text-slate-400 text-sm">
                L&apos;IA apprend de tes préférences musicales, styles favoris, et thèmes récurrents pour créer des chansons de plus en plus personnalisées.
              </p>
            </Card>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {memoryStats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="glass p-5">
                  <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-slate-400 mt-1">{stat.label}</p>
                </Card>
              </motion.div>
            ))}
          </div>

          <Card className="glass p-8 text-center">
            <Sparkles className="w-12 h-12 text-purple-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Bientôt disponible</h3>
            <p className="text-slate-400 text-sm mb-4">
              La mémoire IA apprendra de tes créations pour mieux comprendre ton style unique.
            </p>
            <Link href="/create">
              <Button className="btn-gradient text-white font-bold rounded-xl">
                <Music className="w-4 h-4 mr-2" />
                Créer une chanson
              </Button>
            </Link>
          </Card>
        </div>
      </main>
    </div>
  );
}
