"use client";

import { useState } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Crown,
  Check,
  CheckCircle2,
  Zap,
  Music,
  Image,
  Mic,
  Video,
  Volume2,
  Clock,
  Cloud,
  Lock,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Pricing comparison data
const comparisonFeatures = [
  { name: "Chansons IA", basic: "2/mois", pro: "20/mois" },
  { name: "Pochettes IA", basic: "2/mois", pro: "20/mois" },
  { name: "Qualité audio", basic: "Standard (128 kbps)", pro: "Haute qualité (320 kbps)" },
  { name: "Durée max", basic: "Jusqu'à 3 min", pro: "Jusqu'à 6 min" },
  { name: "Paroles & IA", basic: "Assisté", pro: "Avancé (IA Pro)" },
  { name: "Voix IA", basic: "Limité", pro: "Voix & chant IA" },
  { name: "Générations parallèles", basic: "1 à la fois", pro: "3 en parallèle" },
  { name: "Téléchargements", basic: "MP3", pro: "MP3 + WAV" },
  { name: "Stockage", basic: "1 GB", pro: "10 GB" },
  { name: "Vidéo & clips IA", basic: "Non inclus", pro: "Inclus (clips courts)" },
  { name: "Support", basic: "Standard", pro: "Prioritaire" },
];

const proFeatures = [
  { icon: Music, text: "20 chansons IA par mois", color: "text-purple-400", bg: "bg-purple-500/10" },
  { icon: Image, text: "20 pochettes IA par mois", color: "text-amber-400", bg: "bg-amber-500/10" },
  { icon: Volume2, text: "Haute qualité audio 320 kbps", color: "text-emerald-400", bg: "bg-emerald-500/10" },
  { icon: Clock, text: "Jusqu'à 6 min par chanson", color: "text-blue-400", bg: "bg-blue-500/10" },
  { icon: Mic, text: "Voix & chant IA illimité", color: "text-pink-400", bg: "bg-pink-500/10" },
  { icon: Video, text: "Clips vidéo IA courts inclus", color: "text-cyan-400", bg: "bg-cyan-500/10" },
  { icon: Zap, text: "Générations 3 en parallèle", color: "text-purple-400", bg: "bg-purple-500/10" },
  { icon: Cloud, text: "Stockage 10 GB", color: "text-orange-400", bg: "bg-orange-500/10" },
];

export default function SubscriptionPage() {
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

      <main className={`transition-all duration-300 ${sidebarCollapsed ? "ml-[72px]" : "ml-[280px]"}`}>
        <Header title="Abonnement" userName="Jean Paul" userPlan="basic" />

        <div className="p-6">
          {/* Page title */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              Passe à <span className="gradient-text">MELODIA PRO</span>
            </h1>
            <p className="text-slate-400 mt-2">Débloque tout le potentiel de la création musicale IA</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left: Comparison table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-3 space-y-6"
            >
              <Card className="glass overflow-hidden">
                {/* Table header */}
                <div className="grid grid-cols-3 border-b border-white/5">
                  <div className="p-4">
                    <span className="text-sm text-slate-400">Fonctionnalité</span>
                  </div>
                  <div className="p-4 text-center border-l border-white/5">
                    <p className="text-sm font-bold text-white">PACK BASIC</p>
                    <p className="text-lg font-extrabold text-amber-400 mt-1">2 000 FCFA</p>
                  </div>
                  <div className="p-4 text-center border-l border-purple-500/10 bg-purple-500/5">
                    <div className="flex items-center justify-center gap-2">
                      <p className="text-sm font-bold text-purple-400">PACK PRO</p>
                      <Badge className="bg-pink-500/20 text-pink-400 text-[9px]">Le plus populaire</Badge>
                    </div>
                    <p className="text-lg font-extrabold text-amber-400 mt-1">5 000 FCFA</p>
                  </div>
                </div>

                {/* Table rows */}
                {comparisonFeatures.map((feature, i) => (
                  <div
                    key={i}
                    className={cn(
                      "grid grid-cols-3",
                      i % 2 === 0 ? "bg-white/[0.02]" : ""
                    )}
                  >
                    <div className="p-3 px-4 text-sm text-slate-300">{feature.name}</div>
                    <div className="p-3 px-4 text-sm text-slate-400 text-center border-l border-white/5">{feature.basic}</div>
                    <div className="p-3 px-4 text-sm text-white text-center border-l border-purple-500/10 bg-purple-500/[0.03]">
                      <span className="flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        {feature.pro}
                      </span>
                    </div>
                  </div>
                ))}
              </Card>

              {/* Launch offer */}
              <Card className="glass p-5">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🎉</span>
                  <div>
                    <span className="text-white font-semibold">Offre de lancement</span>
                    <span className="text-slate-400 mx-2">—</span>
                    <span className="text-slate-300">Premier mois à <span className="line-through text-slate-500">5 000 FCFA</span> <span className="text-amber-400 font-bold">4 000 FCFA</span></span>
                  </div>
                </div>
              </Card>

              {/* CTA */}
              <Button
                className="w-full btn-gradient text-white font-bold text-lg py-6 rounded-xl shadow-lg shadow-purple-500/25 hover:scale-[1.02] transition-transform"
                onClick={() => toast.success("Redirection vers le paiement...")}
              >
                Passer à PRO maintenant
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <p className="text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                Paiement 100% sécurisé
              </p>
            </motion.div>

            {/* Right: Success state & features */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2 space-y-6"
            >
              {/* Success card */}
              <Card className="glass p-6 text-center">
                <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4 glow-green">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-1">Bienvenue dans MELODIA !</h2>
                <p className="text-slate-400 text-sm mb-4">Choisis le plan qui te convient</p>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-xs text-slate-500">Votre plan</p>
                    <p className="text-sm font-bold text-purple-400">BASIC</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Montant</p>
                    <p className="text-sm font-bold text-amber-400">2 000 FCFA</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Renouvellement</p>
                    <p className="text-sm font-bold text-white">10 Sep 2026</p>
                  </div>
                </div>
              </Card>

              {/* Features grid */}
              <Card className="glass p-6">
                <h3 className="text-lg font-bold text-white mb-4">Ce que vous obtenez avec PRO</h3>
                <div className="grid grid-cols-2 gap-3">
                  {proFeatures.map((feature, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-lg ${feature.bg} flex items-center justify-center`}>
                        <feature.icon className={`w-4 h-4 ${feature.color}`} />
                      </div>
                      <p className="text-xs text-slate-300 leading-tight pt-1">{feature.text}</p>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Action footer */}
              <Card className="glass p-5">
                <h4 className="text-sm font-bold text-white mb-1">Continuez à créer !</h4>
                <p className="text-xs text-slate-400 mb-4">Utilisez maintenant toutes les fonctionnalités PRO.</p>
                <div className="flex gap-2">
                  <Link href="/creations" className="flex-1">
                    <Button variant="outline" className="w-full text-xs border-white/10 text-white hover:bg-white/5">
                      Voir mes créations
                    </Button>
                  </Link>
                  <Link href="/create" className="flex-1">
                    <Button className="w-full btn-gradient text-white font-bold text-xs">
                      + Créer une chanson
                    </Button>
                  </Link>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
