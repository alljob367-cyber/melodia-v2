import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { MelodiaCore, Api } from "@/lib/core";

/**
 * GET /api/core/credits/wallet
 * Returns the user's credit wallet with effective balance and recent transactions.
 */
export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) {
    return Api.unauthorized();
  }

  try {
    const core = new MelodiaCore(token.sub);
    await core.initialize();

    const wallet = await core.getWallet();
    if (!wallet) {
      return Api.notFound("Portefeuille");
    }

    return Api.ok({ wallet });
  } catch (err) {
    return Api.handleRouteError(err);
  }
}
