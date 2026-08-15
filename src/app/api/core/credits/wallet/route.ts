import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { CreditEngine } from "@/lib/core/credit-engine";
import { Api } from "@/lib/core/api-responses";

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
    const wallet = await CreditEngine.getWallet(token.sub);
    if (!wallet) {
      return Api.notFound("Portefeuille");
    }

    return Api.ok({ wallet });
  } catch (err) {
    return Api.handleRouteError(err);
  }
}
