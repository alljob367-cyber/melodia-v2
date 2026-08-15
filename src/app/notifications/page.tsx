"use client";

import { useState, useMemo } from "react";
import { AppLayout } from "@/components/dashboard/app-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bell,
  BellOff,
  Music,
  CreditCard,
  Info,
  CheckCheck,
  Loader2,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useUnreadCount,
} from "@/hooks/use-core-queries";

// ============ TYPES ============

interface Notification {
  id: string;
  type: "generation" | "payment" | "system";
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

type FilterTab = "all" | "unread" | "generation" | "payment" | "system";

// ============ HELPERS ============

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins}min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function getNotificationIconStyles(type: Notification["type"]) {
  switch (type) {
    case "generation":
      return {
        bg: "bg-purple-500/15",
        text: "text-purple-400",
        border: "border-purple-500/20",
      };
    case "payment":
      return {
        bg: "bg-amber-500/15",
        text: "text-amber-400",
        border: "border-amber-500/20",
      };
    case "system":
      return {
        bg: "bg-pink-500/15",
        text: "text-pink-400",
        border: "border-pink-500/20",
      };
    default:
      return {
        bg: "bg-white/5",
        text: "text-slate-400",
        border: "border-white/10",
      };
  }
}

// ============ FILTER TABS CONFIG ============

const filterTabs: { value: FilterTab; label: string }[] = [
  { value: "all", label: "Toutes" },
  { value: "unread", label: "Non lues" },
  { value: "generation", label: "Génération" },
  { value: "payment", label: "Paiement" },
  { value: "system", label: "Système" },
];

// ============ SKELETON LOADER ============

function NotificationSkeleton() {
  return (
    <Card className="glass p-4">
      <div className="flex items-start gap-3">
        <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
    </Card>
  );
}

// ============ NOTIFICATION CARD ============

function NotificationIcon({ type, className }: { type: Notification["type"]; className?: string }) {
  const iconStyles = getNotificationIconStyles(type);
  const combinedClass = className || "";

  switch (type) {
    case "generation":
      return <Music className={`${combinedClass} ${iconStyles.text}`} />;
    case "payment":
      return <CreditCard className={`${combinedClass} ${iconStyles.text}`} />;
    case "system":
      return <Info className={`${combinedClass} ${iconStyles.text}`} />;
    default:
      return <Bell className={`${combinedClass} ${iconStyles.text}`} />;
  }
}

function NotificationCard({
  notification,
  index,
  onMarkRead,
}: {
  notification: Notification;
  index: number;
  onMarkRead: (id: string) => void;
}) {
  const iconStyles = getNotificationIconStyles(notification.type);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: "easeOut" }}
      layout
    >
      <Card
        className={`glass p-4 cursor-pointer transition-all duration-200 hover:bg-white/[0.03] group ${
          !notification.isRead
            ? "border-l-2 border-l-purple-500 border-white/10"
            : "border-white/[0.06]"
        }`}
        onClick={() => {
          if (!notification.isRead) {
            onMarkRead(notification.id);
          }
        }}
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className={`w-10 h-10 rounded-xl ${iconStyles.bg} flex items-center justify-center flex-shrink-0 border ${iconStyles.border} group-hover:scale-105 transition-transform`}
          >
            <NotificationIcon type={notification.type} className="w-5 h-5" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p
                className={`text-sm leading-snug ${
                  notification.isRead
                    ? "text-slate-300 font-medium"
                    : "text-white font-bold"
                }`}
              >
                {notification.title}
              </p>
              {/* Unread dot */}
              {!notification.isRead && (
                <span className="flex-shrink-0 w-2.5 h-2.5 rounded-full bg-purple-500 mt-1 shadow-sm shadow-purple-500/50" />
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
              {notification.message}
            </p>
            <p className="text-[11px] text-slate-500 mt-2">
              {formatTimeAgo(notification.createdAt)}
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// ============ MAIN PAGE ============

export default function NotificationsPage() {
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [visibleCount, setVisibleCount] = useState(20);

  // React Query hooks
  const { data: notificationsData, isLoading } = useNotifications(visibleCount);
  const { data: unreadCountData } = useUnreadCount();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const notifications: Notification[] = notificationsData?.notifications || [];
  const unreadCount: number = unreadCountData?.count || 0;
  const hasMore: boolean = notificationsData?.hasMore || false;

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    let filtered = notifications;

    switch (activeFilter) {
      case "unread":
        filtered = filtered.filter((n: Notification) => !n.isRead);
        break;
      case "generation":
        filtered = filtered.filter((n: Notification) => n.type === "generation");
        break;
      case "payment":
        filtered = filtered.filter((n: Notification) => n.type === "payment");
        break;
      case "system":
        filtered = filtered.filter((n: Notification) => n.type === "system");
        break;
      default:
        break;
    }

    return filtered;
  }, [notifications, activeFilter]);

  // Count per type for badges
  const unreadGenerationCount = notifications.filter(
    (n: Notification) => n.type === "generation" && !n.isRead
  ).length;
  const unreadPaymentCount = notifications.filter(
    (n: Notification) => n.type === "payment" && !n.isRead
  ).length;
  const unreadSystemCount = notifications.filter(
    (n: Notification) => n.type === "system" && !n.isRead
  ).length;

  function getTabBadge(value: FilterTab): number | null {
    switch (value) {
      case "unread":
        return unreadCount || null;
      case "generation":
        return unreadGenerationCount || null;
      case "payment":
        return unreadPaymentCount || null;
      case "system":
        return unreadSystemCount || null;
      default:
        return null;
    }
  }

  function handleMarkRead(id: string) {
    markRead.mutate(id);
  }

  function handleMarkAllRead() {
    markAllRead.mutate(undefined, {
      onSuccess: () => {
        toast.success("Toutes les notifications marquées comme lues");
      },
      onError: () => {
        toast.error("Erreur lors de la mise à jour");
      },
    });
  }

  function handleLoadMore() {
    setVisibleCount((prev) => prev + 20);
  }

  return (
    <AppLayout title="Notifications">
      <div className="space-y-5">
        {/* ===== HEADER SECTION ===== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center border border-purple-500/20">
                <Bell className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Notifications</h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  {unreadCount > 0
                    ? `${unreadCount} notification${unreadCount > 1 ? "s" : ""} non lue${unreadCount > 1 ? "s" : ""}`
                    : "Aucune notification non lue"}
                </p>
              </div>
              {unreadCount > 0 && (
                <Badge className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] ml-1">
                  {unreadCount}
                </Badge>
              )}
            </div>

            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="border-white/10 text-slate-300 hover:text-white hover:bg-white/5 hover:border-white/20 transition-all"
                onClick={handleMarkAllRead}
                disabled={markAllRead.isPending}
              >
                {markAllRead.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : (
                  <CheckCheck className="w-3.5 h-3.5 mr-1.5" />
                )}
                Tout marquer comme lu
              </Button>
            )}
          </div>
        </motion.div>

        {/* ===== FILTER TABS ===== */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="flex items-center gap-2 overflow-x-auto pb-1 -mb-1 scrollbar-none">
            {filterTabs.map((tab) => {
              const isActive = activeFilter === tab.value;
              const badge = getTabBadge(tab.value);

              return (
                <button
                  key={tab.value}
                  onClick={() => setActiveFilter(tab.value)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                      : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
                >
                  {tab.label}
                  {badge !== null && badge > 0 && (
                    <span
                      className={`text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center ${
                        isActive
                          ? "bg-purple-500/30 text-purple-300"
                          : "bg-white/10 text-slate-400"
                      }`}
                    >
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* ===== NOTIFICATION LIST ===== */}
        <div className="space-y-3">
          {isLoading ? (
            // Loading skeletons
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <NotificationSkeleton />
                </motion.div>
              ))}
            </div>
          ) : filteredNotifications.length === 0 ? (
            // Empty state
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="glass p-10 text-center border-white/[0.06]">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/10">
                  <BellOff className="w-8 h-8 text-slate-500" />
                </div>
                <p className="text-slate-300 font-medium mb-1">
                  {activeFilter === "unread"
                    ? "Aucune notification non lue"
                    : activeFilter === "generation"
                    ? "Aucune notification de génération"
                    : activeFilter === "payment"
                    ? "Aucune notification de paiement"
                    : activeFilter === "system"
                    ? "Aucune notification système"
                    : "Aucune notification"}
                </p>
                <p className="text-slate-500 text-sm">
                  {activeFilter === "all"
                    ? "Tes notifications apparaîtront ici lorsque tu utiliseras la plateforme"
                    : "Aucune notification dans cette catégorie pour le moment"}
                </p>
              </Card>
            </motion.div>
          ) : (
            // Notification cards
            <AnimatePresence mode="popLayout">
              {filteredNotifications.map((notification: Notification, index: number) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  index={index}
                  onMarkRead={handleMarkRead}
                />
              ))}
            </AnimatePresence>
          )}

          {/* ===== LOAD MORE ===== */}
          {hasMore && !isLoading && filteredNotifications.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex justify-center pt-2"
            >
              <Button
                variant="outline"
                className="border-white/10 text-slate-300 hover:text-white hover:bg-white/5 hover:border-white/20 transition-all"
                onClick={handleLoadMore}
              >
                <ChevronDown className="w-4 h-4 mr-2" />
                Charger plus de notifications
              </Button>
            </motion.div>
          )}
        </div>

        {/* ===== BOTTOM INFO ===== */}
        {!isLoading && notifications.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500 pt-2">
              <Sparkles className="w-3 h-3" />
              <span>
                {filteredNotifications.length} notification{filteredNotifications.length > 1 ? "s" : ""}
                {activeFilter !== "all" && ` dans cette catégorie`}
              </span>
            </div>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}
