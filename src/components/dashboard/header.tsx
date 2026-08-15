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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useMelodia } from "@/contexts/melodia-context";

interface Notification {
  id: string;
  type: string;
  title: string;
  message?: string;
  isRead: boolean;
  createdAt: string;
}

interface HeaderProps {
  title: string;
  userName?: string;
  userPlan?: string;
  userImage?: string;
}

export function Header({ title, userName = "Utilisateur", userPlan = "basic", userImage }: HeaderProps) {
  const { context } = useMelodia();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Fetch unread notification count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch("/api/core/notifications/unread");
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count || 0);
      }
    } catch {
      // Silently fail
    }
  }, []);

  // Fetch notifications list when popover opens
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/core/notifications?limit=10");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch {
      // Silently fail
    }
  }, []);

  // Mark a notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await fetch(`/api/core/notifications/${notificationId}`, { method: "PATCH" });
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      // Silently fail
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      await fetch("/api/core/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markAllRead" }),
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // Silently fail
    }
  }, []);

  // Poll unread count every 30 seconds
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30_000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Fetch list when popover opens
  useEffect(() => {
    if (notificationsOpen) {
      fetchNotifications();
    }
  }, [notificationsOpen, fetchNotifications]);

  // Display plan name
  const planLabels: Record<string, string> = {
    basic: "Basic",
    artist_starter: "Starter",
    artist_production: "Production",
    video_creator: "Vidéo",
    artist_pro: "Pro",
    label: "Label",
  };
  const displayPlan = planLabels[context?.plan || userPlan] || userPlan;

  // Time ago helper
  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60_000);
    if (minutes < 1) return "À l'instant";
    if (minutes < 60) return `Il y a ${minutes}min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Il y a ${hours}h`;
    const days = Math.floor(hours / 24);
    return `Il y a ${days}j`;
  };

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
        {/* Notifications Popover */}
        <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative text-slate-400 hover:text-white hover:bg-white/5">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 bg-[#16162A] border-white/10 p-0">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <h3 className="text-sm font-semibold text-white">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-purple-400 hover:text-purple-300"
                >
                  Tout marquer lu
                </button>
              )}
            </div>
            <ScrollArea className="max-h-80">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-slate-500">
                  Aucune notification
                </div>
              ) : (
                notifications.map((notif) => (
                  <button
                    key={notif.id}
                    onClick={() => !notif.isRead && markAsRead(notif.id)}
                    className={`w-full text-left px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors ${
                      notif.isRead ? "opacity-60" : ""
                    }`}
                  >
                    <p className="text-sm text-white font-medium leading-tight">{notif.title}</p>
                    {notif.message && (
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{notif.message}</p>
                    )}
                    <p className="text-[10px] text-slate-600 mt-1">{timeAgo(notif.createdAt)}</p>
                  </button>
                ))
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>

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
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">{displayPlan}</p>
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
