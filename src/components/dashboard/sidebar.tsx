"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Music,
  Home,
  PlusCircle,
  Crown,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  Rocket,
  Mic,
  Video,
  Palette,
  Building2,
  FolderOpen,
  Image as ImageIcon,
  Bell,
  Headphones,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ============ NAVIGATION STRUCTURE ============

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  planRequired?: string;
  launchLocked?: boolean;  // Disabled during initial launch
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: "Principal",
    items: [
      { href: "/dashboard", label: "Tableau de bord", icon: Home },
      { href: "/create", label: "Créer une chanson", icon: PlusCircle },
      { href: "/creations", label: "Mes créations", icon: Music },
      { href: "/projects", label: "Projets", icon: FolderOpen },
      { href: "/media", label: "Médiathèque", icon: ImageIcon },
    ],
  },
  {
    title: "Studios",
    items: [
      { href: "/studio/audio", label: "Audio Studio", icon: Headphones },
      { href: "/studio/video", label: "Vidéo Studio", icon: Video, planRequired: "video_studio", launchLocked: true },
      { href: "/studio/artist", label: "Artist Studio", icon: Palette, planRequired: "artiste_actif" },
      { href: "/studio/label", label: "Label Studio", icon: Building2, planRequired: "label", launchLocked: true },
    ],
  },
  {
    title: "Compte",
    items: [
      { href: "/subscription", label: "Abonnement", icon: Crown },
      { href: "/notifications", label: "Notifications", icon: Bell },
      { href: "/settings", label: "Paramètres", icon: Settings },
    ],
  },
];

// ============ PLAN HIERARCHY ============

const PLAN_LEVEL: Record<string, number> = {
  decouverte: 0,
  production: 1,
  artiste_actif: 2,
  video_studio: 3,
  artiste_pro: 4,
  label: 5,
};

// ============ SIDEBAR COMPONENT ============

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  userPlan?: string;
  songsRemaining?: number;
  songsTotal?: number;
  unreadNotifications?: number;
}

export function Sidebar({
  collapsed,
  onToggle,
  userPlan = "decouverte",
  songsRemaining = 2,
  songsTotal = 2,
  unreadNotifications = 0,
}: SidebarProps) {
  const pathname = usePathname();
  const progressPercent = songsTotal > 0 ? ((songsTotal - songsRemaining) / songsTotal) * 100 : 0;
  const userLevel = PLAN_LEVEL[userPlan] ?? 0;

  const planLabels: Record<string, string> = {
    decouverte: "Découverte",
    production: "Production",
    artiste_actif: "Artiste Actif",
    video_studio: "Vidéo",
    artiste_pro: "Artiste Pro",
    label: "Label/Studio",
    // Legacy compat
    basic: "Découverte",
    artist_starter: "Production",
    artist_production: "Artiste Actif",
    video_creator: "Vidéo",
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 bottom-0 z-40 bg-[#0a0a12] border-r border-white/5 flex flex-col transition-all duration-300",
        collapsed ? "w-[72px]" : "w-[280px]"
      )}
    >
      {/* Logo + Collapse toggle */}
      <div className="h-16 flex items-center px-4 border-b border-white/5">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Logo size="sm" showSubtitle={!collapsed} link={false} />
        </div>
        <button
          onClick={onToggle}
          className="flex-shrink-0 w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <ChevronLeft className={cn("w-4 h-4 transition-transform", collapsed && "rotate-180")} />
        </button>
      </div>

      {/* Navigation sections */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {navSections.map((section) => (
          <div key={section.title}>
            {/* Section title (hidden when collapsed) */}
            {!collapsed && (
              <p className="px-3 mb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                {section.title}
              </p>
            )}

            {/* Section items */}
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href));
                const isLaunchLocked = item.launchLocked === true;
                const isLocked =
                  isLaunchLocked || (item.planRequired && (PLAN_LEVEL[item.planRequired] ?? 0) > userLevel);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-[#2D1F5E] text-white"
                        : isLocked
                        ? "text-slate-600 hover:text-slate-400"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "flex-shrink-0 w-5 h-5",
                        isActive && "text-purple-400",
                        isLocked && "opacity-40"
                      )}
                    />
                    {!collapsed && (
                      <>
                        <span className="truncate flex-1">{item.label}</span>
                        {isLocked && (
                          <Badge variant="outline" className="text-[8px] border-white/10 text-slate-500 px-1 py-0">
                            {isLaunchLocked ? "BIENTÔT" : "PRO"}
                          </Badge>
                        )}
                        {item.href === "/notifications" && unreadNotifications > 0 && (
                          <span className="ml-auto w-4 h-4 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center">
                            {unreadNotifications > 9 ? "9+" : unreadNotifications}
                          </span>
                        )}
                      </>
                    )}
                    {isActive && !collapsed && !isLocked && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-400" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* Logout */}
        <div className="pt-4 border-t border-white/5">
          <Link
            href="/api/auth/signout"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/5 transition-all"
          >
            <LogOut className="flex-shrink-0 w-5 h-5" />
            {!collapsed && <span>Déconnexion</span>}
          </Link>
        </div>
      </nav>

      {/* Subscription widget (bottom) */}
      {!collapsed && (
        <div className="p-4 border-t border-white/5 space-y-4">
          {/* Current plan */}
          <div className="glass rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-semibold text-white">
                Plan {planLabels[userPlan] || userPlan}
              </span>
            </div>
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                <span>{songsRemaining} créations restantes</span>
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

          {/* Upgrade CTA for basic plan */}
          {userLevel < 2 && (
            <div className="glass rounded-xl p-4 text-center">
              <Rocket className="w-5 h-5 text-purple-400 mx-auto mb-2" />
              <p className="text-xs text-slate-300 mb-3">
                Débloque les Studios et plus de créations
              </p>
              <Link href="/subscription">
                <Button className="w-full btn-gradient text-white text-xs font-bold py-2 rounded-lg">
                  Voir les plans
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
