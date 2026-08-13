"use client";

import dynamic from "next/dynamic";

const CreateFlowClient = dynamic(
  () => import("./create-flow-client").then((m) => ({ default: m.CreateFlowClient })),
  { ssr: false, loading: () => <div style={{ padding: "2rem", textAlign: "center", color: "#94a3b8" }}>Chargement du studio...</div> }
);

/**
 * /create
 * Client Component wrapper that lazy-loads the heavy creation flow
 * with `ssr: false` to avoid hydrating the full studio on the server.
 */
export default function CreatePage() {
  return <CreateFlowClient />;
}
