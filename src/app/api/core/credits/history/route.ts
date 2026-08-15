import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { MelodiaCore } from "@/lib/core";
import { Api, ApiSchemas } from "@/lib/core";

/**
 * GET /api/core/credits/history
 * Returns paginated credit transaction history through MelodiaCore.
 */
export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) {
    return Api.unauthorized();
  }

  try {
    const url = new URL(req.url);
    const params = ApiSchemas.CreditHistorySchema.parse(Object.fromEntries(url.searchParams));

    const core = new MelodiaCore(token.sub);
    await core.initialize();

    const result = await core.getCreditHistory(params);

    return Api.ok(result);
  } catch (err) {
    return Api.handleRouteError(err);
  }
}
