import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { MelodiaCore, PermissionDeniedError } from "@/lib/core";
import { Api, ApiSchemas } from "@/lib/core";

/**
 * GET /api/core/projects
 * List the authenticated user's projects via MelodiaCore.
 */
export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) {
    return Api.unauthorized();
  }

  try {
    const core = new MelodiaCore(token.sub);
    await core.initialize();

    const projects = await core.listProjects();
    return Api.ok({ projects });
  } catch (err) {
    return Api.handleRouteError(err);
  }
}

/**
 * POST /api/core/projects
 * Create a new project. Requires CREATE_PROJECT permission.
 */
export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) {
    return Api.unauthorized();
  }

  try {
    const body = await req.json();
    const data = ApiSchemas.CreateProjectSchema.parse(body);

    const core = new MelodiaCore(token.sub);
    await core.initialize();

    // CREATE_PROJECT permission is checked inside core.createProject()
    const project = await core.createProject(data);

    return Api.created({ project });
  } catch (err) {
    if (err instanceof PermissionDeniedError) {
      return Api.forbidden(err.message);
    }
    return Api.handleRouteError(err);
  }
}
