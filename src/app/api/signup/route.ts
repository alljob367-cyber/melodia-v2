import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import bcrypt from "bcryptjs";

const signupSchema = z.object({
  name: z.string().min(2, "Le nom doit avoir au moins 2 caractères").transform(v => v.trim()),
  email: z.string().email("Email invalide").transform(v => v.toLowerCase().trim()),
  password: z.string().min(6, "Le mot de passe doit avoir au moins 6 caractères").max(128, "Mot de passe trop long"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = signupSchema.parse(body);

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Un compte avec cet email existe déjà" },
        { status: 409 }
      );
    }

    // Hash password with bcrypt (10 salt rounds)
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create user
    const user = await db.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: "user",
        plan: "basic",
      },
    });

    // Create default credits (Basic plan: 20 credits, 3 songs, 3 covers)
    await db.userCredits.create({
      data: {
        userId: user.id,
        credits: 20,
        songsRemaining: 3,
        coversRemaining: 3,
        videosRemaining: 0,
        totalSongsUsed: 0,
        totalCoversUsed: 0,
        totalVideosUsed: 0,
        totalCreditsUsed: 0,
        storageUsedMb: 0,
      },
    });

    // Log analytics
    await db.analyticsEvent.create({
      data: {
        userId: user.id,
        event: "signup",
        page: "/signup",
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        plan: user.plan,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }
    console.error("[signup] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'inscription: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}
