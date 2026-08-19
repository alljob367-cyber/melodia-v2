import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/generate — Legacy create-flow compatible endpoint
 * 
 * The create-flow-client.tsx calls this endpoint and expects a {song} response.
 * This route:
 *   1. Calls /api/core/generate internally (with cookies forwarded)
 *   2. Polls the generation status until complete
 *   3. Returns the song data in the legacy format expected by the frontend
 */
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Corps de requête invalide" },
      { status: 400 }
    );
  }

  // Map to Core schema
  const coreBody = {
    operation: "full_song",
    title: body.title || "Sans titre",
    style: body.style || "afrobeat",
    mood: body.mood || "joyful",
    theme: body.theme || "africa",
    language: body.language || "fr",
    additionalPrompt: body.additionalPrompt,
  };

  // Forward to Core endpoint with auth cookies
  let coreData: Record<string, any>;
  try {
    const coreUrl = new URL("/api/core/generate", req.url);
    const coreResponse = await fetch(coreUrl.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: req.headers.get("cookie") || "",
      },
      body: JSON.stringify(coreBody),
    });
    coreData = await coreResponse.json();

    if (!coreResponse.ok) {
      return NextResponse.json(coreData, { status: coreResponse.status });
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[generate] Core call failed:", errorMsg);
    return NextResponse.json(
      { error: "Erreur lors de la génération: " + errorMsg },
      { status: 500 }
    );
  }

  // Core returned successfully — poll generation status
  const generationId = coreData.generationId;
  if (!generationId) {
    // If no generationId, it might have completed instantly or failed
    // Return a minimal song-like response
    return NextResponse.json({
      success: true,
      song: {
        id: coreData.songId || "demo",
        title: body.title || "Sans titre",
        style: body.style || "afrobeat",
        coverUrl: "",
        audioUrl: "",
        lyrics: coreData.lyrics || "",
        duration: 0,
      },
      creditsUsed: coreData.creditsConsumed || 0,
    });
  }

  // Poll generation status (max 120 seconds)
  const MAX_POLLS = 60;
  const POLL_INTERVAL = 2000;

  for (let i = 0; i < MAX_POLLS; i++) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL));

    try {
      const statusUrl = new URL(`/api/core/generate-status/${generationId}`, req.url);
      const statusResp = await fetch(statusUrl.toString(), {
        headers: { cookie: req.headers.get("cookie") || "" },
      });
      const statusData = await statusResp.json();
      const gen = statusData.generation || statusData;

      if (gen.status === "completed") {
        // Extract song data from generation
        // The generation has outputMediaIds — fetch the actual song
        let songData: any = {
          id: generationId,
          title: body.title || "Sans titre",
          style: body.style || "afrobeat",
          coverUrl: "",
          audioUrl: "",
          lyrics: "",
          duration: 0,
        };

        // Try to find the song created by this generation
        try {
          const songsUrl = new URL("/api/songs?latest=true", req.url);
          const songsResp = await fetch(songsUrl.toString(), {
            headers: { cookie: req.headers.get("cookie") || "" },
          });
          if (songsResp.ok) {
            const songsData = await songsResp.json();
            if (songsData.songs && songsData.songs.length > 0) {
              const latestSong = songsData.songs[0];
              songData = {
                id: latestSong.id,
                title: latestSong.title || body.title || "Sans titre",
                style: latestSong.style || body.style || "afrobeat",
                coverUrl: latestSong.coverUrl || "",
                audioUrl: latestSong.audioUrl || "",
                lyrics: latestSong.lyricsText || "",
                duration: latestSong.duration || 0,
              };
            }
          }
        } catch {}

        return NextResponse.json({
          success: true,
          song: songData,
          creditsUsed: coreData.creditsConsumed || 0,
        });
      }

      if (gen.status === "failed" || gen.status === "cancelled") {
        return NextResponse.json({
          error: gen.error || "La génération a échoué. Réessaie.",
        }, { status: 422 });
      }

      // Still processing — continue polling
      console.log(`[generate] Poll ${i + 1}/${MAX_POLLS}: status=${gen.status}, progress=${gen.progress || 0}%`);
    } catch (pollErr) {
      console.warn(`[generate] Poll ${i + 1} failed:`, pollErr);
    }
  }

  // Timeout — return what we have
  return NextResponse.json({
    success: true,
    song: {
      id: generationId,
      title: body.title || "Sans titre",
      style: body.style || "afrobeat",
      coverUrl: "",
      audioUrl: "",
      lyrics: "",
      duration: 0,
    },
    creditsUsed: coreData.creditsConsumed || 0,
    _timeout: true,
  });
}
