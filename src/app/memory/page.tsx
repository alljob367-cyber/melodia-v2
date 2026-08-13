"use client";

import nextDynamic from "next/dynamic";

const MemoryDashboardClient = nextDynamic(
  () => import("./memory-client").then((m) => ({ default: m.MemoryDashboardClient })),
  { ssr: false, loading: () => <div style={{ padding: "2rem", textAlign: "center", color: "#94a3b8" }}>Chargement...</div> }
);

export default function MemoryPage() {
  return <MemoryDashboardClient />;
}
