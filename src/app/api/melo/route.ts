import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";

const execFileAsync = promisify(execFile);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, text } = body;

    if (action === "tts" && text) {
      // Use /tmp on Vercel (read-only filesystem), otherwise local cwd
      const IS_VERCEL = !!process.env.VERCEL;
      const outputDir = IS_VERCEL
        ? path.join("/tmp", "melodia-generated", "melo")
        : path.join(process.cwd(), "public", "generated", "melo");
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const filename = `melo-${Date.now()}.wav`;
      const outputPath = path.join(outputDir, filename);

      // Try Mistral Voxtral TTS first (better quality, works on Vercel)
      const mistralKey = process.env.MISTRAL_API_KEY;
      if (mistralKey) {
        try {
          const response = await fetch("https://api.mistral.ai/v1/audio/speech", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${mistralKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "voxtral-mini-tts-latest",
              input: text.slice(0, 500),
              voice: "en_paul_happy",
              response_format: "wav",
            }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data.audio_data) {
              const audioBuffer = Buffer.from(data.audio_data, "base64");
              fs.writeFileSync(outputPath, audioBuffer);
              const audioUrl = `/generated/melo/${filename}`;
              return NextResponse.json({ audioUrl });
            }
          }
          console.error("[melo-tts] Mistral TTS failed, falling back to z-ai");
        } catch (mistralErr) {
          console.error("[melo-tts] Mistral TTS error:", mistralErr);
        }
      }

      // Fallback: z-ai CLI TTS
      try {
        await execFileAsync("z-ai", [
          "tts",
          "--input", text.slice(0, 500),
          "--format", "wav",
          "--speed", "1.0",
          "--output", outputPath,
        ], { timeout: 30000 });

        const audioUrl = `/generated/melo/${filename}`;
        return NextResponse.json({ audioUrl });
      } catch {
        return NextResponse.json({ audioUrl: null, fallback: true });
      }
    }

    if (action === "faq-search") {
      const { searchFAQ } = await import("@/components/melo/faq-data");
      const results = searchFAQ(text || "");
      return NextResponse.json({ results: results.slice(0, 5) });
    }

    return NextResponse.json({ error: "Action non reconnue" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
