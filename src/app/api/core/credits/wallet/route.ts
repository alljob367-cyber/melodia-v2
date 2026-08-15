import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { CreditEngine } from "@/lib/core/credit-engine";

/**
 * GET /api/core/credits/wallet
 * Returns the user's credit wallet with effective balance and recent transactions.
 */
export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const wallet = await CreditEngine.getWallet(token.sub);
  if (!wallet) {
    return NextResponse.json({ error: "Portefeuille non trouvé" }, { status: 404 });
  }

  return NextResponse.json({ wallet });
}
