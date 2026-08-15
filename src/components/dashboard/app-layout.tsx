"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { MobileBottomNav } from "@/components/mobile-nav";
import { useMelodia } from "@/contexts/melodia-context";

interface AppLayoutProps {
  children: React.ReactNode;
  title: string;
}

/**
 * AppLayout — Shared layout for all authenticated pages.
 * Renders: Sidebar (desktop) → Header → Main content → MobileBottomNav
 *
 * Usage:
 *   <AppLayout title="Audio Studio">
 *     <MyPageContent />
 *   </AppLayout>
 */
export function AppLayout({ children, title }: AppLayoutProps) {
  const { data: session } = useSession();
  const { context } = useMelodia();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const userName = session?.user?.name || context?.name || "Créateur";
  const userPlan = (session?.user as any)?.plan || context?.plan || "basic";
  const userImage = (session?.user as any)?.image || undefined;

  const songsRemaining = context?.songsRemaining || 0;
  const songsTotal = songsRemaining + (context?.creditBalance || 0) / 7;

  return (
    <div className="min-h-screen bg-[#0B0B14]">
      {/* Sidebar — desktop only */}
      <div className="hidden lg:block">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          userPlan={userPlan}
          songsRemaining={songsRemaining}
          songsTotal={Math.floor(songsTotal)}
        />
      </div>

      {/* Main content area */}
      <main
        className={`transition-all duration-300 ${
          sidebarCollapsed ? "lg:ml-[72px]" : "lg:ml-[280px]"
        } pb-20 lg:pb-0`}
      >
        <Header
          title={title}
          userName={userName}
          userPlan={userPlan}
          userImage={userImage}
        />

        <div className="p-4 sm:p-6">{children}</div>
      </main>

      {/* Mobile bottom navigation */}
      <MobileBottomNav />
    </div>
  );
}
