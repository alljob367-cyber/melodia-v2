"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Music,
  Home,
  PlusCircle,
  Pen,
  Share2,
  Crown,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  Sparkles,
  Rocket,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Tableau de bord", icon: Home },
  { href: "/creations", label: "Mes créations", icon: Music },
  { href: "/create", label: "Créer une chanson", icon: PlusCircle },
  { href: "/create?tab=lyrics", label: "Paroles IA", icon: Pen },
  { href: "/creations?tab=shared", label: "Partages", icon: Share2 },
  { href: "/subscription", label: "Abonnement", icon: Crown },
  { href: "/dashboard?tab=settings", label: "Paramètres", icon: Settings },
  { href: "/dashboard?tab=help", label: "Aide", icon: HelpCircle },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  userPlan?: string;
  songsRemaining?: number;
  songsTotal?: number;
}

export function Sidebar({
  collapsed,
  onToggle,
  userPlan = "basic",
  songsRemaining = 2,
  songsTotal = 2,
}: SidebarProps) {
  const pathname = usePathname();
  const progressPercent = songsTotal > 0 ? ((songsTotal - songsRemaining) / songsTotal) * 100 : 0;

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 bottom-0 z-40 bg-[#0a0a12] border-r border-white/5 flex flex-col transition-all duration-300",
        collapsed ? "w-[72px]" : "w-[280px]"
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-white/5">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex-shrink-0 w-9 h-9 rounded-lg btn-gradient flex items-center justify-center">
            <Music className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <span className="text-lg font-extrabold text-white tracking-wider truncate">MELODIA</span>
          )}
        </div>
        <button
          onClick={onToggle}
          className="flex-shrink-0 w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <ChevronLeft className={cn("w-4 h-4 transition-transform", collapsed && "rotate-180")} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href.split("?")[0]));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-[#2D1F5E] text-white"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon className={cn("flex-shrink-0 w-5 h-5", isActive && "text-purple-400")} />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {isActive && !collapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-400" />
              )}
            </Link>
          );
        })}

        {/* Logout */}
        <Link
          href="/api/auth/signout"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/5 transition-all"
        >
          <LogOut className="flex-shrink-0 w-5 h-5" />
          {!collapsed && <span>Déconnexion</span>}
        </Link>
      </nav>

      {/* Subscription widget */}
      {!collapsed && (
        <div className="p-4 border-t border-white/5 space-y-4">
          {/* Current plan */}
          <div className="glass rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-semibold text-white">Pack {userPlan === "basic" ? "Basic" : userPlan === "pro" ? "Pro" : "Studio"}</span>
            </div>
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                <span>{songsRemaining} créations restantes sur {songsTotal}</span>
              </div>
              <Progress
                value={progressPercent}
                className="h-2 bg-white/5 [&>div]:bg-amber-400"
              />
            </div>
            <Link href="/subscription">
              <Button variant="ghost" className="w-full text-xs text-slate-400 hover:text-white h-8">
                Gérer mon abonnement
              </Button>
            </Link>
          </div>

          {/* Upgrade CTA */}
          {userPlan === "basic" && (
            <div className="glass rounded-xl p-4 text-center">
              <Rocket className="w-5 h-5 text-purple-400 mx-auto mb-2" />
              <p className="text-xs text-slate-300 mb-3">
                Passez à PRO et libère tout ton potentiel
              </p>
              <Link href="/subscription">
                <Button className="w-full btn-gradient text-white text-xs font-bold py-2 rounded-lg">
                  Découvrir PRO
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
