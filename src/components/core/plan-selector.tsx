/**
 * PlanSelector — Plan comparison and selection component
 * 
 * Shows all 6 plans with features, prices in FCFA,
 * and triggers PaymentCheckout on selection.
 */

"use client";

import { useState } from "react";
import { useMelodia } from "@/contexts/melodia-context";
import { PermissionGate } from "@/components/core/permission-gate";
import { PaymentCheckout } from "@/components/core/payment-checkout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Sparkles } from "lucide-react";

interface PlanSelectorProps {
  currentPlan?: string;
  onPlanChange?: (plan: string) => void;
  className?: string;
}

const PLANS = [
  {
    id: "basic",
    name: "Basic",
    price: 2000,
    credits: 20,
    songs: 3,
    covers: 3,
    videos: 0,
    features: ["Paroles IA", "Beat/Composition", "Cover IA", "1 projet"],
    color: "gray",
  },
  {
    id: "artist_starter",
    name: "Starter",
    price: 5000,
    credits: 50,
    songs: 8,
    covers: 8,
    videos: 0,
    features: ["Tout Basic +", "Vidéo Économique", "Voice Studio", "Mix & Master", "5 projets"],
    color: "purple",
    popular: true,
  },
  {
    id: "artist_production",
    name: "Production",
    price: 10000,
    credits: 100,
    songs: 15,
    covers: 15,
    videos: 0,
    features: ["Tout Starter +", "Storyboard", "Identité visuelle", "AI Producer", "10 projets"],
    color: "blue",
  },
  {
    id: "video_creator",
    name: "Vidéo",
    price: 15000,
    credits: 150,
    songs: 20,
    covers: 20,
    videos: 3,
    features: ["Tout Production +", "Vidéo Standard", "Export vidéo", "15 projets"],
    color: "pink",
  },
  {
    id: "artist_pro",
    name: "Artiste Pro",
    price: 25000,
    credits: 250,
    songs: 50,
    covers: 50,
    videos: 10,
    features: ["Tout Vidéo +", "Vidéo Premium", "Projets illimités", "Priorité IA"],
    color: "yellow",
  },
  {
    id: "label",
    name: "Label/Studio",
    price: 50000,
    credits: 500,
    songs: 999,
    covers: 999,
    videos: 30,
    features: ["Tout Pro +", "Multi-artistes", "Gestion d'équipe", "Analytics avancés", "API access"],
    color: "emerald",
  },
];

const PLAN_ORDER = ["basic", "artist_starter", "artist_production", "video_creator", "artist_pro", "label"];

export function PlanSelector({ currentPlan, onPlanChange, className }: PlanSelectorProps) {
  const { context } = useMelodia();
  const activePlan = currentPlan || context?.plan || "basic";
  const activeIndex = PLAN_ORDER.indexOf(activePlan);

  // Payment checkout state
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedPack, setSelectedPack] = useState<{ id: string; name: string; price: number; credits: number } | null>(null);

  const handleSelectPlan = (plan: typeof PLANS[0]) => {
    const planIndex = PLAN_ORDER.indexOf(plan.id);
    const isUpgrade = planIndex > activeIndex;

    if (isUpgrade) {
      // Open payment checkout for upgrade
      setSelectedPack({
        id: `plan-${plan.id}`, // This would be a real pack ID from the DB
        name: `Plan ${plan.name}`,
        price: plan.price,
        credits: plan.credits,
      });
      setCheckoutOpen(true);
    } else {
      // Downgrade — confirm and call API directly
      onPlanChange?.(plan.id);
    }
  };

  const formatPrice = (fcfa: number) => {
    return new Intl.NumberFormat("fr-FR").format(fcfa);
  };

  const colorMap: Record<string, string> = {
    gray: "border-white/10 hover:border-white/20",
    purple: "border-purple-500/30 hover:border-purple-500/50",
    blue: "border-blue-500/30 hover:border-blue-500/50",
    pink: "border-pink-500/30 hover:border-pink-500/50",
    yellow: "border-yellow-500/30 hover:border-yellow-500/50",
    emerald: "border-emerald-500/30 hover:border-emerald-500/50",
  };

  return (
    <div className={className}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {PLANS.map((plan) => {
          const isActive = plan.id === activePlan;
          const planIndex = PLAN_ORDER.indexOf(plan.id);
          const isUpgrade = planIndex > activeIndex;
          const isDowngrade = planIndex < activeIndex;

          return (
            <Card
              key={plan.id}
              className={`glass transition-all ${colorMap[plan.color]} ${
                isActive ? "ring-2 ring-purple-500 shadow-lg shadow-purple-500/20" : ""
              } ${plan.popular ? "relative" : ""}`}
            >
              {plan.popular && (
                <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-purple-600 text-white gap-1">
                  <Sparkles className="h-3 w-3" />
                  Populaire
                </Badge>
              )}

              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    {plan.id === "label" && <Crown className="h-5 w-5 text-yellow-400" />}
                    {plan.name}
                  </span>
                  {isActive && (
                    <Badge variant="outline" className="text-xs border-green-400 text-green-400">
                      Plan actuel
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  <span className="text-2xl font-bold text-white">
                    {formatPrice(plan.price)}
                  </span>
                  <span className="text-muted-foreground"> FCFA/mois</span>
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Credits summary */}
                <div className="flex gap-2">
                  <Badge variant="secondary" className="text-xs gap-1">
                    <Sparkles className="h-3 w-3" />
                    {plan.credits} crédits
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {plan.songs >= 999 ? "∞" : plan.songs} chansons
                  </Badge>
                  {plan.videos > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {plan.videos} vidéos
                    </Badge>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-1.5">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-3.5 w-3.5 text-green-400 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {!isActive && (
                  <Button
                    onClick={() => handleSelectPlan(plan)}
                    className={`w-full gap-2 ${
                      isUpgrade ? "btn-gradient" : "bg-white/10 hover:bg-white/15 text-white"
                    }`}
                    size="sm"
                  >
                    {isUpgrade ? (
                      <>Passer à {plan.name}</>
                    ) : (
                      <>Rétrograder à {plan.name}</>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Payment checkout modal */}
      {selectedPack && (
        <PaymentCheckout
          open={checkoutOpen}
          onOpenChange={setCheckoutOpen}
          packId={selectedPack.id}
          packName={selectedPack.name}
          priceFcfa={selectedPack.price}
          credits={selectedPack.credits}
        />
      )}
    </div>
  );
}
