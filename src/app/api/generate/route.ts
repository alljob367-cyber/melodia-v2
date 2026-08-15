import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/generate — DEPRECATED
 * 
 * This route is DEPRECATED. Use POST /api/core/generate instead.
 * The legacy route bypassed MelodiaCore and directly debited credits
 * without the reserve→consume→refund pipeline, meaning failed generations
 * still consumed credits.
 * 
 * This route now redirects to the Core endpoint.
 */
export async function POST(req: NextRequest) {
  // Read the request body to forward it
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Corps de requête invalide" },
      { status: 400 }
    );
  }

  // Map legacy schema to Core schema
  // Legacy: { style, theme, mood, title, language, additionalPrompt, generateCover, generateAudio }
  // Core:   { operation, title, style, mood, theme, language, additionalPrompt, ... }
  const coreBody = {
    operation: "full_song",
    title: body.title || "Untitled",
    style: body.style || "afrobeat",
    mood: body.mood || "joyful",
    theme: body.theme || "africa",
    language: body.language || "fr",
    additionalPrompt: body.additionalPrompt,
    // Note: generateCover and generateAudio are handled by the full_song operation
    // in the Core pipeline. The Core always generates all components.
  };

  // Forward to Core endpoint
  const coreUrl = new URL("/api/core/generate", req.url);
  
  try {
    const coreResponse = await fetch(coreUrl.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Forward the auth cookies
        cookie: req.headers.get("cookie") || "",
      },
      body: JSON.stringify(coreBody),
    });

    const coreData = await coreResponse.json();

    // If Core succeeded, transform the response to match legacy format
    if (coreResponse.ok && coreData.success) {
      return NextResponse.json({
        success: true,
        _deprecated: true,
        _redirectTo: "/api/core/generate",
        generationId: coreData.generationId,
        operation: coreData.operation,
        creditsUsed: coreData.creditsConsumed,
        // Note: The Core endpoint returns generationId + outputMediaIds
        // The legacy endpoint returned a full song object.
        // The frontend should migrate to use /api/core/generate directly.
        message: "Cette route est dépréciée. Utilisez /api/core/generate à la place.",
      });
    }

    // Forward error from Core
    return NextResponse.json(coreData, { status: coreResponse.status });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[generate/deprecated] Forward error:", errorMsg);
    return NextResponse.json(
      { error: "Erreur de redirection vers /api/core/generate: " + errorMsg },
      { status: 500 }
    );
  }
}
