"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Music,
  PlusCircle,
  Crown,
  Headphones,
  Menu,
  X,
  Sparkles,
  LogOut,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ===== MOBILE HAMBURGER MENU =====
// Remplace la navigation desktop cachée sur mobile

interface MobileMenuProps {
  isLoggedIn?: boolean;
  userName?: string;
}

export function MobileMenu({ isLoggedIn = false, userName }: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Fermer au changement de route
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Bloquer le scroll quand le menu est ouvert
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const navLinks = [
    { href: "#accueil", label: "Accueil" },
    { href: "#pipeline", label: "Pipeline" },
    { href: "#fonctionnalites", label: "Fonctionnalités" },
    { href: "#tarifs", label: "Tarifs" },
    { href: "#faq", label: "FAQ" },
  ];

  return (
    <>
      {/* Hamburger button */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
        aria-label="Ouvrir le menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Overlay */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-[280px] bg-[#0a0a12] border-l border-white/5 flex flex-col overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg btn-gradient flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-base font-bold text-white">MELODIA</span>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* User info */}
              {isLoggedIn && (
                <div className="px-4 py-3 border-b border-white/5">
                  <p className="text-sm font-medium text-white">{userName || "Artiste"}</p>
                  <p className="text-xs text-purple-400">Pack Actif</p>
                </div>
              )}

              {/* Navigation links */}
              <nav className="flex-1 py-4 px-3 space-y-1">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-all"
                  >
                    {link.label}
                  </a>
                ))}

                <div className="my-3 border-t border-white/5" />

                {isLoggedIn ? (
                  <>
                    <Link
                      href="/dashboard"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-all"
                    >
                      <Home className="w-4 h-4" />
                      Tableau de bord
                    </Link>
                    <Link
                      href="/create"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-purple-300 hover:text-white hover:bg-purple-500/10 transition-all"
                    >
                      <PlusCircle className="w-4 h-4" />
                      Créer une chanson
                    </Link>
                    <Link
                      href="/subscription"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-all"
                    >
                      <Crown className="w-4 h-4" />
                      Abonnement
                    </Link>
                    <Link
                      href="/dashboard?tab=settings"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-all"
                    >
                      <Settings className="w-4 h-4" />
                      Paramètres
                    </Link>
                    <a
                      href="/api/auth/signout"
                      className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-all"
                    >
                      <LogOut className="w-4 h-4" />
                      Déconnexion
                    </a>
                  </>
                ) : (
                  <div className="space-y-2 px-3">
                    <Link href="/login">
                      <Button
                        variant="outline"
                        className="w-full border-white/10 text-slate-300 hover:text-white hover:border-white/20 text-sm"
                      >
                        Se connecter
                      </Button>
                    </Link>
                    <Link href="/signup">
                      <Button className="w-full btn-gradient text-white text-sm border-0">
                        S'inscrire gratuitement
                      </Button>
                    </Link>
                  </div>
                )}
              </nav>

              {/* Melo badge */}
              <div className="p-4 border-t border-white/5">
                <div className="glass rounded-xl p-3 flex items-center gap-3">
                  <Headphones className="w-5 h-5 text-purple-400" />
                  <div>
                    <p className="text-xs font-medium text-white">Besoin d'aide ?</p>
                    <p className="text-[10px] text-purple-400">Demande à Melo !</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// ===== MOBILE BOTTOM NAVIGATION =====
// Navigation fixe en bas pour les pages authentifiées

export function MobileBottomNav() {
  const pathname = usePathname();

  const tabs = [
    { href: "/dashboard", label: "Accueil", icon: Home },
    { href: "/creations", label: "Créations", icon: Music },
    { href: "/create", label: "Créer", icon: PlusCircle, primary: true },
    { href: "/subscription", label: "Pack", icon: Crown },
    { href: "/dashboard?tab=help", label: "Aide", icon: Headphones },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-[#0a0a12]/95 backdrop-blur-lg border-t border-white/5 safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-1">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || (tab.href !== "/dashboard" && pathname.startsWith(tab.href.split("?")[0]));
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] transition-colors ${
                tab.primary
                  ? "relative -top-3"
                  : ""
              }`}
            >
              {tab.primary ? (
                <div className="w-12 h-12 rounded-full btn-gradient flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <tab.icon className="w-5 h-5 text-white" />
                </div>
              ) : (
                <tab.icon
                  className={`w-5 h-5 transition-colors ${
                    isActive ? "text-purple-400" : "text-slate-500"
                  }`}
                />
              )}
              <span
                className={`text-[10px] font-medium transition-colors ${
                  tab.primary
                    ? "text-purple-300"
                    : isActive
                    ? "text-purple-400"
                    : "text-slate-500"
                }`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
