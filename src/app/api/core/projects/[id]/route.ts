import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { MelodiaCore, PermissionDeniedError } from "@/lib/core";
import { Api, ApiSchemas } from "@/lib/core";
import { db } from "@/lib/db";

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

    // Ownership check via direct DB query
    const existing = await db.project.findUnique({ where: { id } });
    if (!existing) {
      return Api.notFound("Projet");
    }
    if (existing.userId !== token.sub) {
      return Api.forbidden("Accès refusé");
    }

    const core = new MelodiaCore(token.sub);
    await core.initialize();
    core.requirePermission("UPDATE_PROJECT");

    const project = await db.project.update({
      where: { id },
      data,
    });

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
 * Sets status to "archived" instead of hard deleting.
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
    // Ownership check via direct DB query
    const existing = await db.project.findUnique({ where: { id } });
    if (!existing) {
      return Api.notFound("Projet");
    }
    if (existing.userId !== token.sub) {
      return Api.forbidden("Accès refusé");
    }

    const core = new MelodiaCore(token.sub);
    await core.initialize();
    core.requirePermission("DELETE_PROJECT");

    // Soft delete: set status to "archived"
    const project = await db.project.update({
      where: { id },
      data: { status: "archived" },
    });

    return Api.ok({ project });
  } catch (err) {
    if (err instanceof PermissionDeniedError) {
      return Api.forbidden(err.message);
    }
    return Api.handleRouteError(err);
  }
}
