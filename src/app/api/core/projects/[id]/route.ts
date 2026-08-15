import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { MelodiaCore, PermissionDeniedError } from "@/lib/core";
import { Api, ApiSchemas } from "@/lib/core";

/**
 * GET /api/core/projects/[id]
 * Get a project by ID with ownership verification.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) {
    return Api.unauthorized();
  }

  const { id } = await params;

  try {
    const core = new MelodiaCore(token.sub);
    await core.initialize();

    const project = await core.getProject(id);
    if (!project) {
      return Api.notFound("Projet");
    }

    return Api.ok({ project });
  } catch (err) {
    return Api.handleRouteError(err);
  }
}

/**
 * PATCH /api/core/projects/[id]
 * Update a project. Requires UPDATE_PROJECT permission and ownership.
 * Uses MelodiaCore.updateProject() which emits PROJECT_UPDATED event.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) {
    return Api.unauthorized();
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const data = ApiSchemas.UpdateProjectSchema.parse(body);

    const core = new MelodiaCore(token.sub);
    await core.initialize();

    const project = await core.updateProject(id, data);

    return Api.ok({ project });
  } catch (err) {
    if (err instanceof PermissionDeniedError) {
      return Api.forbidden(err.message);
    }
    return Api.handleRouteError(err);
  }
}

/**
 * DELETE /api/core/projects/[id]
 * Archive a project (soft delete). Requires DELETE_PROJECT permission and ownership.
 * Uses MelodiaCore.archiveProject() which emits PROJECT_ARCHIVED event.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) {
    return Api.unauthorized();
  }

  const { id } = await params;

  try {
    const core = new MelodiaCore(token.sub);
    await core.initialize();

    const project = await core.archiveProject(id);

    return Api.ok({ project });
  } catch (err) {
    if (err instanceof PermissionDeniedError) {
      return Api.forbidden(err.message);
    }
    return Api.handleRouteError(err);
  }
}
