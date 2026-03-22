import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { previewFromBody } from "@/lib/notePreview";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }
  const notes = await prisma.note.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      body: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  const mapped = notes.map((n) => ({
    id: n.id,
    title: n.title,
    preview: previewFromBody(n.body),
    createdAt: n.createdAt.getTime(),
    updatedAt: n.updatedAt.getTime(),
  }));
  return Response.json(mapped);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const title = typeof body.title === "string" ? body.title : "";
  const note = await prisma.note.create({
    data: {
      userId: session.user.id,
      title,
      body: typeof body.body === "string" ? body.body : "",
    },
  });
  return Response.json({
    id: note.id,
    title: note.title,
    body: note.body,
    preview: previewFromBody(note.body),
    createdAt: note.createdAt.getTime(),
    updatedAt: note.updatedAt.getTime(),
  });
}
