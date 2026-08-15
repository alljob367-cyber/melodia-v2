import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { MelodiaCore, PermissionDeniedError } from "@/lib/core";
import { db } from "@/lib/db";
import { z } from "zod";

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
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const core = new MelodiaCore(token.sub);
    await core.initialize();

    const project = await core.getProject(id);
    if (!project) {
      return NextResponse.json(
        { error: "Projet non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json({ project });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[core/projects/[id] GET] Error:", errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

/**
 * PATCH /api/core/projects/[id]
 * Update a project. Requires UPDATE_PROJECT permission and ownership.
 */
const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.string().optional(),
  description: z.string().optional(),
  genre: z.string().optional(),
  mood: z.string().optional(),
  status: z.enum(["active", "archived"]).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const data = updateProjectSchema.parse(body);

    // Ownership check via direct DB query
    const existing = await db.project.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Projet non trouvé" },
        { status: 404 }
      );
    }
    if (existing.userId !== token.sub) {
      return NextResponse.json(
        { error: "Accès refusé" },
        { status: 403 }
      );
    }

    const core = new MelodiaCore(token.sub);
    await core.initialize();
    core.requirePermission("UPDATE_PROJECT");

    const project = await db.project.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, project });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0].message },
        { status: 400 }
      );
    }
    if (err instanceof PermissionDeniedError) {
      return NextResponse.json(
        { error: "Permission refusée : " + err.message },
        { status: 403 }
      );
    }
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[core/projects/[id] PATCH] Error:", errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
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
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Ownership check via direct DB query
    const existing = await db.project.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Projet non trouvé" },
        { status: 404 }
      );
    }
    if (existing.userId !== token.sub) {
      return NextResponse.json(
        { error: "Accès refusé" },
        { status: 403 }
      );
    }

    const core = new MelodiaCore(token.sub);
    await core.initialize();
    core.requirePermission("DELETE_PROJECT");

    // Soft delete: set status to "archived"
    const project = await db.project.update({
      where: { id },
      data: { status: "archived" },
    });

    return NextResponse.json({ success: true, project });
  } catch (err) {
    if (err instanceof PermissionDeniedError) {
      return NextResponse.json(
        { error: "Permission refusée : " + err.message },
        { status: 403 }
      );
    }
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[core/projects/[id] DELETE] Error:", errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
