import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { MelodiaCore } from "@/lib/core";
import { z } from "zod";

/**
 * POST /api/core/media/upload
 * 
 * File upload pipeline through MelodiaCore.
 * Accepts file metadata + Vercel Blob URL, creates a Media record.
 * 
 * In production, the actual file upload to Vercel Blob happens client-side
 * (using @vercel/blob/client upload), then the URL is sent here to register it.
 * 
 * Pipeline: Auth → Core → Permission → Validate → Create Media → Emit
 */
const uploadSchema = z.object({
  name: z.string(),
  type: z.enum(["audio", "image", "video", "document", "lyrics"]),
  mimeType: z.string(),
  url: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  fileSizeKb: z.number().optional(),
  duration: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  projectId: z.string().optional(),
  artistId: z.string().optional(),
  songId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
  isPublic: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = uploadSchema.parse(body);

    // Initialize Core
    const core = new MelodiaCore(token.sub);
    await core.initialize();

    // Check permission
    core.requirePermission("UPLOAD_MEDIA");

    // Create media through Core
    const media = await core.createMedia({
      name: data.name,
      type: data.type,
      mimeType: data.mimeType,
      url: data.url,
      thumbnailUrl: data.thumbnailUrl,
      fileSizeKb: data.fileSizeKb,
      duration: data.duration,
      width: data.width,
      height: data.height,
      projectId: data.projectId,
      artistId: data.artistId,
      songId: data.songId,
      tags: data.tags,
      metadata: data.metadata,
    });

    return NextResponse.json({
      success: true,
      media: {
        id: media.id,
        name: media.name,
        type: media.type,
        url: media.url,
        status: media.status,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[core/media/upload] Error:", errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
