/**
 * CreditWallet — Reusable credit balance display component
 * 
 * Shows current credits, usage bars, and purchase CTA.
 * Uses MelodiaProvider context.
 */

"use client";

import { useCredits, useMelodia } from "@/contexts/melodia-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Wallet, Plus, Music, Image as ImageIcon, Video, Zap } from "lucide-react";
import Link from "next/link";

interface CreditWalletProps {
  compact?: boolean;     // Show only balance badge (for sidebar/header)
  showPurchase?: boolean; // Show purchase CTA button
  showUsage?: boolean;    // Show usage progress bars
  className?: string;
}

export function CreditWallet({ compact, showPurchase = true, showUsage = true, className }: CreditWalletProps) {
  const { balance, reserved, effective, songsRemaining, coversRemaining, videosRemaining } = useCredits();
  const { context, canPerform } = useMelodia();

  // Compact mode: just a badge
  if (compact) {
    return (
      <Badge variant="secondary" className="gap-1.5 bg-purple-500/20 text-purple-300 border-purple-500/30">
        <Zap className="h-3 w-3" />
        {effective} cr.
      </Badge>
    );
  }

  const planName = context?.plan || "basic";
  const planLabels: Record<string, string> = {
    basic: "Basic",
    artist_starter: "Starter",
    artist_production: "Production",
    video_creator: "Vidéo",
    artist_pro: "Artiste Pro",
    label: "Label/Studio",
  };

  return (
    <Card className={`glass border-purple-500/20 ${className || ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wallet className="h-5 w-5 text-purple-400" />
            Portefeuille
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs border-purple-500/40 text-purple-300">
              {planLabels[planName] || planName}
            </Badge>
            <Badge className="bg-purple-600 text-white gap-1">
              <Zap className="h-3 w-3" />
              {effective} crédits
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Balance summary */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="space-y-1">
            <p className="text-2xl font-bold text-white">{balance}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-yellow-400">{reserved}</p>
            <p className="text-xs text-muted-foreground">Réservés</p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-green-400">{effective}</p>
            <p className="text-xs text-muted-foreground">Disponibles</p>
          </div>
        </div>

        {/* Usage bars */}
        {showUsage && (
          <div className="space-y-3">
            <UsageBar
              icon={<Music className="h-3.5 w-3.5" />}
              label="Chansons"
              remaining={songsRemaining}
              max={songsRemaining > 100 ? 999 : songsRemaining + 5}
              color="purple"
            />
            <UsageBar
              icon={<ImageIcon className="h-3.5 w-3.5" />}
              label="Covers"
              remaining={coversRemaining}
              max={coversRemaining > 100 ? 999 : coversRemaining + 5}
              color="pink"
            />
            {canPerform("CREATE_VIDEO") && (
              <UsageBar
                icon={<Video className="h-3.5 w-3.5" />}
                label="Vidéos"
                remaining={videosRemaining}
                max={videosRemaining > 100 ? 999 : videosRemaining + 5}
                color="blue"
              />
            )}
          </div>
        )}

        {/* Purchase CTA */}
        {showPurchase && effective < 15 && (
          <Link href="/subscription" className="block">
            <Button className="w-full btn-gradient gap-2" size="sm">
              <Plus className="h-4 w-4" />
              {effective === 0 ? "Crédits épuisés — Recharger" : "Crédits faibles — Recharger"}
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

// ============ INTERNAL: UsageBar ============

function UsageBar({ icon, label, remaining, max, color }: {
  icon: React.ReactNode;
  label: string;
  remaining: number;
  max: number;
  color: "purple" | "pink" | "blue";
}) {
  const percentage = max > 0 ? Math.round((remaining / max) * 100) : 0;
  const colorClasses = {
    purple: "text-purple-400 [&>div]:bg-purple-500",
    pink: "text-pink-400 [&>div]:bg-pink-500",
    blue: "text-blue-400 [&>div]:bg-blue-500",
  };

  return (
    <div className="flex items-center gap-3">
      <div className={`flex-shrink-0 ${colorClasses[color]}`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-muted-foreground">{label}</span>
          <span className={colorClasses[color]}>{remaining} restants</span>
        </div>
        <Progress value={percentage} className="h-1.5 bg-white/5" />
      </div>
    </div>
  );
}
