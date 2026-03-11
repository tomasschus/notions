import { NextRequest } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();
    if (!email || !password || typeof email !== "string" || typeof password !== "string") {
      return Response.json(
        { error: "Email y contraseña son requeridos" },
        { status: 400 }
      );
    }
    const existing = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    if (existing) {
      return Response.json(
        { error: "Ya existe una cuenta con ese email" },
        { status: 409 }
      );
    }
    const hashed = await hash(password, 12);
    await prisma.user.create({
      data: {
        email: email.trim().toLowerCase(),
        password: hashed,
        name: typeof name === "string" ? name.trim() || null : null,
      },
    });
    return Response.json({ ok: true });
  } catch (e) {
    console.error("[register]", e);
    return Response.json(
      { error: "Error al crear la cuenta" },
      { status: 500 }
    );
  }
}
