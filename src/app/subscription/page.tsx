"use client";

import { useState } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { MobileBottomNav } from "@/components/mobile-nav";
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
  Star,
  Users,
  Code,
  Headphones,
  Gift,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface PlanFeature {
  text: string;
  highlighted?: boolean;
}

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  priceLabel: string;
  credits: number;
  creditsLabel: string;
  features: PlanFeature[];
  popular?: boolean;
  badge?: string;
  accentColor: string;
  borderColor: string;
  bgGlow: string;
}

const plans: PricingPlan[] = [
  {
    id: "decouverte",
    name: "Découverte",
    price: 2000,
    priceLabel: "2 000 FCFA",
    credits: 20,
    creditsLabel: "20 crédits",
    accentColor: "text-slate-300",
    borderColor: "border-white/10",
    bgGlow: "",
    features: [
      { text: "3 chansons" },
      { text: "3 pochettes" },
      { text: "Paroles IA" },
      { text: "Audio 128 kbps" },
      { text: "Format MP3" },
      { text: "Partage" },
    ],
  },
  {
    id: "production",
    name: "Production Musicale",
    price: 5000,
    priceLabel: "5 000 FCFA",
    credits: 50,
    creditsLabel: "50 crédits",
    accentColor: "text-blue-400",
    borderColor: "border-blue-500/20",
    bgGlow: "",
    features: [
      { text: "8 chansons" },
      { text: "8 pochettes" },
      { text: "Composition IA", highlighted: true },
      { text: "Audio 320 kbps" },
      { text: "Voix IA" },
      { text: "MP3 + WAV" },
      { text: "Mix basique" },
      { text: "5 GB stockage" },
    ],
  },
  {
    id: "artiste-actif",
    name: "Artiste Actif",
    price: 10000,
    priceLabel: "10 000 FCFA",
    credits: 100,
    creditsLabel: "100 crédits",
    popular: true,
    badge: "Le plus populaire",
    accentColor: "text-purple-400",
    borderColor: "border-purple-500/40",
    bgGlow: "shadow-lg shadow-purple-500/20",
    features: [
      { text: "15 chansons" },
      { text: "15 pochettes" },
      { text: "Voix premium", highlighted: true },
      { text: "Mix avancé", highlighted: true },
      { text: "Pochettes premium" },
      { text: "2 générations parallèles" },
      { text: "15 GB stockage" },
      { text: "Support prioritaire" },
    ],
  },
  {
    id: "video",
    name: "Vidéo",
    price: 15000,
    priceLabel: "15 000 FCFA",
    credits: 150,
    creditsLabel: "150 crédits",
    accentColor: "text-cyan-400",
    borderColor: "border-cyan-500/20",
    bgGlow: "",
    features: [
      { text: "20 chansons" },
      { text: "20 pochettes" },
      { text: "3 clips vidéo", highlighted: true },
      { text: "Storyboard IA", highlighted: true },
      { text: "Audio 320 kbps" },
      { text: "Voix premium" },
      { text: "Mix avancé" },
      { text: "3 générations parallèles" },
      { text: "25 GB stockage" },
    ],
  },
  {
    id: "artiste-pro",
    name: "Artiste Professionnel",
    price: 25000,
    priceLabel: "25 000 FCFA",
    credits: 250,
    creditsLabel: "250 crédits",
    accentColor: "text-amber-400",
    borderColor: "border-amber-500/20",
    bgGlow: "",
    features: [
      { text: "50 chansons" },
      { text: "50 pochettes" },
      { text: "10 clips vidéo", highlighted: true },
      { text: "Studio vidéo", highlighted: true },
      { text: "Voix + harmonies", highlighted: true },
      { text: "Mix pro" },
      { text: "Modèles exclusifs" },
      { text: "Pages cadeaux" },
      { text: "5 générations parallèles" },
      { text: "50 GB stockage" },
      { text: "Support VIP" },
    ],
  },
  {
    id: "label-studio",
    name: "Label / Studio",
    price: 50000,
    priceLabel: "50 000 FCFA",
    credits: 500,
    creditsLabel: "500 crédits",
    accentColor: "text-emerald-400",
    borderColor: "border-emerald-500/20",
    bgGlow: "",
    features: [
      { text: "Chansons illimitées", highlighted: true },
      { text: "Pochettes illimitées", highlighted: true },
      { text: "30 clips vidéo", highlighted: true },
      { text: "Multi-artistes (10)", highlighted: true },
      { text: "Tous modèles IA" },
      { text: "API access", highlighted: true },
      { text: "10 générations parallèles" },
      { text: "100 GB stockage" },
      { text: "Account manager" },
      { text: "Support 24/7" },
    ],
  },
];

// Comparison table features for all 6 plans
const comparisonFeatures = [
  {
    name: "Chansons",
    values: ["3", "8", "15", "20", "50", "Illimité"],
  },
  {
    name: "Pochettes",
    values: ["3", "8", "15", "20", "50", "Illimité"],
  },
  {
    name: "Crédits",
    values: ["20", "50", "100", "150", "250", "500"],
  },
  {
    name: "Qualité audio",
    values: ["128 kbps", "320 kbps", "320 kbps", "320 kbps", "320 kbps", "320 kbps"],
  },
  {
    name: "Formats",
    values: ["MP3", "MP3+WAV", "MP3+WAV", "MP3+WAV", "MP3+WAV", "MP3+WAV"],
  },
  {
    name: "Voix IA",
    values: ["—", "Standard", "Premium", "Premium", "Harmonies", "Harmonies"],
  },
  {
    name: "Clips vidéo",
    values: ["—", "—", "—", "3", "10", "30"],
  },
  {
    name: "Mixage",
    values: ["—", "Basique", "Avancé", "Avancé", "Pro", "Pro"],
  },
  {
    name: "Parallèles",
    values: ["1", "1", "2", "3", "5", "10"],
  },
  {
    name: "Stockage",
    values: ["—", "5 GB", "15 GB", "25 GB", "50 GB", "100 GB"],
  },
  {
    name: "Support",
    values: ["Standard", "Standard", "Prioritaire", "Standard", "VIP", "24/7"],
  },
];

export default function SubscriptionPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");

  return (
    <div className="min-h-screen bg-[#0B0B14]">
      {/* Sidebar desktop uniquement */}
      <div className="hidden lg:block">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          userPlan="basic"
          songsRemaining={2}
          songsTotal={2}
        />
      </div>

      <main className={`transition-all duration-300 lg:${sidebarCollapsed ? "ml-[72px]" : "ml-[280px]"} pb-20 lg:pb-0`}>
        <Header title="Abonnement" userName="Jean Paul" userPlan="basic" />

        <div className="p-4 sm:p-6">
          {/* Page title */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="w-6 h-6 text-amber-400" />
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                Melodia <span className="gradient-text">Up To Africa</span>
              </h1>
              <Sparkles className="w-6 h-6 text-amber-400" />
            </div>
            <p className="text-slate-400 max-w-xl mx-auto">
              Choisis le plan qui correspond à ton ambition musicale. Du premier son au studio professionnel.
            </p>

            {/* Billing toggle */}
            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                onClick={() => setBillingPeriod("monthly")}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  billingPeriod === "monthly"
                    ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                    : "text-slate-400 hover:text-white border border-transparent"
                )}
              >
                Mensuel
              </button>
              <button
                onClick={() => setBillingPeriod("yearly")}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                  billingPeriod === "yearly"
                    ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                    : "text-slate-400 hover:text-white border border-transparent"
                )}
              >
                Annuel
                <Badge className="bg-emerald-500/20 text-emerald-400 text-[9px] border border-emerald-500/20">
                  -20%
                </Badge>
              </button>
            </div>
          </motion.div>

          {/* Pricing cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mb-12">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index, duration: 0.4 }}
              >
                <Card
                  className={cn(
                    "glass relative overflow-hidden transition-all duration-300 hover:scale-[1.02]",
                    plan.popular ? "border-purple-500/40" : "border-white/10",
                    plan.bgGlow
                  )}
                >
                  {/* Popular badge top bar */}
                  {plan.popular && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500" />
                  )}

                  <div className="p-6">
                    {/* Plan header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                          {plan.popular && (
                            <div className="flex items-center gap-1 bg-gradient-to-r from-amber-500/20 to-purple-500/20 px-2 py-0.5 rounded-full border border-amber-500/20">
                              <Crown className="w-3.5 h-3.5 text-amber-400" />
                              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                                Populaire
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Zap className="w-3.5 h-3.5 text-amber-400" />
                          <span className="text-sm text-amber-400 font-semibold">{plan.creditsLabel}</span>
                        </div>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="mb-5">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold text-white">
                          {billingPeriod === "yearly"
                            ? Math.round(plan.price * 0.8).toLocaleString("fr-FR")
                            : plan.price.toLocaleString("fr-FR")}
                        </span>
                        <span className="text-sm text-slate-400 font-medium">FCFA</span>
                      </div>
                      <span className="text-xs text-slate-500">
                        /{billingPeriod === "yearly" ? "mois (facturé annuellement)" : "mois"}
                      </span>
                      {billingPeriod === "yearly" && (
                        <p className="text-xs text-emerald-400 mt-1">
                          Économie de {((plan.price * 12) - (Math.round(plan.price * 0.8) * 12)).toLocaleString("fr-FR")} FCFA/an
                        </p>
                      )}
                    </div>

                    {/* Features list */}
                    <div className="space-y-2.5 mb-6">
                      {plan.features.map((feature, i) => (
                        <div key={i} className="flex items-center gap-2.5">
                          <div
                            className={cn(
                              "flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center",
                              feature.highlighted
                                ? "bg-purple-500/20"
                                : "bg-white/5"
                            )}
                          >
                            <Check
                              className={cn(
                                "w-3 h-3",
                                feature.highlighted ? "text-purple-400" : "text-slate-400"
                              )}
                            />
                          </div>
                          <span
                            className={cn(
                              "text-sm",
                              feature.highlighted ? "text-white font-medium" : "text-slate-300"
                            )}
                          >
                            {feature.text}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* CTA button */}
                    <Button
                      className={cn(
                        "w-full font-bold py-3 rounded-xl transition-all",
                        plan.popular
                          ? "btn-gradient text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40"
                          : "bg-white/10 text-white hover:bg-white/20 border border-white/10"
                      )}
                      onClick={() => toast.success(`Plan ${plan.name} sélectionné ! Redirection vers le paiement...`)}
                    >
                      {plan.popular ? (
                        <>
                          <Crown className="w-4 h-4 mr-2" />
                          Choisir ce plan
                        </>
                      ) : (
                        "Choisir ce plan"
                      )}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Comparison table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-white">Comparaison des plans</h2>
              <p className="text-sm text-slate-400 mt-1">Trouve le plan parfait pour tes besoins</p>
            </div>

            <Card className="glass overflow-hidden overflow-x-auto">
              <div className="min-w-[800px]">
                {/* Table header */}
                <div className="grid grid-cols-7 border-b border-white/5">
                  <div className="p-4">
                    <span className="text-sm text-slate-400">Fonctionnalité</span>
                  </div>
                  {plans.map((plan, i) => (
                    <div
                      key={plan.id}
                      className={cn(
                        "p-4 text-center border-l border-white/5",
                        plan.popular && "bg-purple-500/5 border-l-purple-500/10"
                      )}
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <p className={cn("text-xs font-bold", plan.popular ? "text-purple-400" : "text-white")}>
                          {plan.name}
                        </p>
                        {plan.popular && <Crown className="w-3 h-3 text-amber-400" />}
                      </div>
                      <p className="text-xs font-bold text-amber-400 mt-1">{plan.priceLabel}</p>
                    </div>
                  ))}
                </div>

                {/* Table rows */}
                {comparisonFeatures.map((feature, i) => (
                  <div
                    key={i}
                    className={cn(
                      "grid grid-cols-7",
                      i % 2 === 0 ? "bg-white/[0.02]" : ""
                    )}
                  >
                    <div className="p-3 px-4 text-sm text-slate-300">{feature.name}</div>
                    {feature.values.map((value, j) => (
                      <div
                        key={j}
                        className={cn(
                          "p-3 px-4 text-sm text-center border-l border-white/5",
                          plans[j].popular && "bg-purple-500/[0.03] border-l-purple-500/10",
                          value === "—" ? "text-slate-500" : plans[j].popular ? "text-white" : "text-slate-300"
                        )}
                      >
                        {value !== "—" && plans[j].popular ? (
                          <span className="flex items-center justify-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                            {value}
                          </span>
                        ) : (
                          value
                        )}
                      </div>
                    ))}
                  </div>
                ))}

                {/* CTA row */}
                <div className="grid grid-cols-7 border-t border-white/5">
                  <div className="p-3 px-4" />
                  {plans.map((plan) => (
                    <div
                      key={plan.id}
                      className={cn(
                        "p-3 px-4 text-center border-l border-white/5",
                        plan.popular && "bg-purple-500/5 border-l-purple-500/10"
                      )}
                    >
                      <Button
                        size="sm"
                        className={cn(
                          "font-bold text-xs rounded-lg",
                          plan.popular
                            ? "btn-gradient text-white"
                            : "bg-white/10 text-white hover:bg-white/20 border border-white/10"
                        )}
                        onClick={() => toast.success(`Plan ${plan.name} sélectionné !`)}
                      >
                        Choisir
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Bottom section: launch offer + secure payment */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {/* Launch offer */}
            <Card className="glass p-5">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🎉</span>
                <div>
                  <span className="text-white font-semibold">Offre de lancement</span>
                  <span className="text-slate-400 mx-2">—</span>
                  <span className="text-slate-300">
                    Premier mois à{" "}
                    <span className="line-through text-slate-500">5 000 FCFA</span>{" "}
                    <span className="text-amber-400 font-bold">4 000 FCFA</span>
                  </span>
                </div>
              </div>
            </Card>

            {/* Secure payment */}
            <Card className="glass p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Paiement 100% sécurisé</p>
                    <p className="text-xs text-slate-400">Mobile Money, Wave, Carte bancaire</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] border-emerald-500/20 text-emerald-400">
                    Fpay
                  </Badge>
                  <Badge variant="outline" className="text-[10px] border-emerald-500/20 text-emerald-400">
                    Wave
                  </Badge>
                  <Badge variant="outline" className="text-[10px] border-emerald-500/20 text-emerald-400">
                    Visa
                  </Badge>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* FAQ-style trust signals */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-8 text-center"
          >
            <div className="flex items-center justify-center gap-6 flex-wrap">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Annulation à tout moment
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Essai gratuit 7 jours
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Support Afrique francophone
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Crédits reportables
              </div>
            </div>
          </motion.div>
        </div>
      </main>
      <MobileBottomNav />
    </div>
  );
}
