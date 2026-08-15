import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/lib/db";
import { z } from "zod";
import { Api } from "@/lib/core/api-responses";

/**
 * GET /api/core/credits/history
 * Returns paginated credit transaction history.
 */
const querySchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(20),
  category: z.string().optional(),
  type: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) {
    return Api.unauthorized();
  }

  try {
    const url = new URL(req.url);
    const params = querySchema.parse(Object.fromEntries(url.searchParams));

    const where: any = { userId: token.sub };
    if (params.category) where.category = params.category;
    if (params.type) where.type = params.type;

    const [transactions, total] = await Promise.all([
      db.creditTransaction.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      db.creditTransaction.count({ where }),
    ]);

    return Api.paginated(transactions, {
      page: params.page,
      limit: params.limit,
      total,
      totalPages: Math.ceil(total / params.limit),
    });
  } catch (err) {
    return Api.handleRouteError(err);
  }
}
