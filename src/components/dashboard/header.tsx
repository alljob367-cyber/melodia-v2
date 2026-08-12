"use client";

import { Bell, ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

interface HeaderProps {
  title: string;
  userName?: string;
  userPlan?: string;
  userImage?: string;
}

export function Header({ title, userName = "Utilisateur", userPlan = "basic", userImage }: HeaderProps) {
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="h-16 border-b border-white/5 bg-[#0a0a12]/80 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Left: Page title */}
      <h1 className="text-lg font-bold text-white">{title}</h1>

      {/* Center: Search (hidden on mobile) */}
      <div className="hidden md:flex items-center max-w-sm flex-1 mx-8">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            placeholder="Rechercher une chanson..."
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-purple-500/50 h-9"
          />
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative text-slate-400 hover:text-white hover:bg-white/5">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
            3
          </span>
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 hover:bg-white/5 rounded-lg px-2 py-1.5 transition-colors">
              <Avatar className="w-8 h-8">
                <AvatarImage src={userImage} />
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-white leading-tight">{userName}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">{userPlan}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 hidden sm:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-[#16162A] border-white/10">
            <DropdownMenuItem asChild className="text-slate-300 focus:text-white focus:bg-white/5">
              <Link href="/subscription">Mon abonnement</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="text-slate-300 focus:text-white focus:bg-white/5">
              <Link href="/dashboard?tab=settings">Paramètres</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/5" />
            <DropdownMenuItem asChild className="text-red-400 focus:text-red-300 focus:bg-red-500/5">
              <Link href="/api/auth/signout">Déconnexion</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
