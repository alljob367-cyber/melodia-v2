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
      // Générer l'audio via z-ai TTS
      const outputDir = path.join(process.cwd(), "public", "generated", "melo");
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const filename = `melo-${Date.now()}.wav`;
      const outputPath = path.join(outputDir, filename);

      try {
        await execFileAsync("z-ai", [
          "tts",
          "--text", text.slice(0, 500),
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
