import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { MelodiaCore, PermissionDeniedError, Api, ApiSchemas } from "@/lib/core";

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

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) {
    return Api.unauthorized();
  }

  try {
    const body = await req.json();
    const data = ApiSchemas.UploadMediaSchema.parse(body);

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

    return Api.created({
      media: {
        id: media.id,
        name: media.name,
        type: media.type,
        url: media.url,
        status: media.status,
      },
    });
  } catch (err) {
    if (err instanceof PermissionDeniedError) {
      return Api.forbidden(err.message);
    }
    return Api.handleRouteError(err);
  }
}
