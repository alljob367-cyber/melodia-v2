import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { MelodiaCore, PermissionDeniedError } from "@/lib/core";
import { Api, ApiSchemas } from "@/lib/core";

/**
 * POST /api/core/credits/purchase
 * 
 * Credit purchase pipeline through MelodiaCore.
 * Delegates to core.purchaseCredits() for atomic transaction + event emission.
 * 
 * Pipeline: Auth → Core → Permission → Select Pack → Create Payment → Add Credits → Emit
 */
export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) {
    return Api.unauthorized();
  }

  try {
    const body = await req.json();
    const data = ApiSchemas.PurchaseCreditsSchema.parse(body);

    const core = new MelodiaCore(token.sub);
    await core.initialize();

    const result = await core.purchaseCredits(data.packId, data.paymentProvider);

    return Api.ok(result);
  } catch (err) {
    if (err instanceof PermissionDeniedError) {
      return Api.forbidden(err.message);
    }
    return Api.handleRouteError(err);
  }
}
