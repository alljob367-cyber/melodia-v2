import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { MelodiaCore, PermissionDeniedError } from "@/lib/core";
import { Api, ApiSchemas } from "@/lib/core";

/**
 * POST /api/core/subscriptions/change
 * 
 * Plan change pipeline through MelodiaCore.
 * Delegates to core.changePlan() for atomic plan change + event emission.
 * Handles both upgrade and downgrade.
 * 
 * Pipeline: Auth → Core → Permission → Validate Plan → Update User → Update Subscription → Emit
 */
export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) {
    return Api.unauthorized();
  }

  try {
    const body = await req.json();
    const data = ApiSchemas.ChangePlanSchema.parse(body);

    const core = new MelodiaCore(token.sub);
    await core.initialize();

    const result = await core.changePlan(data.newPlan);

    return Api.ok(result);
  } catch (err) {
    if (err instanceof PermissionDeniedError) {
      return Api.forbidden(err.message);
    }
    return Api.handleRouteError(err);
  }
}
