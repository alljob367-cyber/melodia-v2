import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { MelodiaCore, PermissionDeniedError } from "@/lib/core";
import { z } from "zod";

/**
 * GET /api/core/projects
 * List the authenticated user's projects via MelodiaCore.
 */
export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const core = new MelodiaCore(token.sub);
    await core.initialize();

    const projects = await core.listProjects();
    return NextResponse.json({ projects });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[core/projects GET] Error:", errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

/**
 * POST /api/core/projects
 * Create a new project. Requires CREATE_PROJECT permission.
 */
const createProjectSchema = z.object({
  name: z.string().min(1, "Le nom du projet est requis"),
  type: z.string().optional(),
  description: z.string().optional(),
  artistId: z.string().optional(),
  genre: z.string().optional(),
  mood: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = createProjectSchema.parse(body);

    const core = new MelodiaCore(token.sub);
    await core.initialize();

    // CREATE_PROJECT permission is checked inside core.createProject()
    const project = await core.createProject(data);

    return NextResponse.json(
      { success: true, project },
      { status: 201 }
    );
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
    console.error("[core/projects POST] Error:", errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
