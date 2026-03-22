import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { previewFromBody } from "@/lib/notePreview";

async function getNoteAndCheck(id: string, userId: string) {
  const note = await prisma.note.findUnique({
    where: { id },
  });
  if (!note || note.userId !== userId) return null;
  return note;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = await params;
  const note = await getNoteAndCheck(id, session.user.id);
  if (!note) {
    return Response.json({ error: "Nota no encontrada" }, { status: 404 });
  }
  return Response.json({
    id: note.id,
    title: note.title,
    body: note.body,
    preview: previewFromBody(note.body),
    createdAt: note.createdAt.getTime(),
    updatedAt: note.updatedAt.getTime(),
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = await params;
  const note = await getNoteAndCheck(id, session.user.id);
  if (!note) {
    return Response.json({ error: "Nota no encontrada" }, { status: 404 });
  }
  const body = await req.json().catch(() => ({}));
  const data: { title?: string; body?: string } = {};
  if (typeof body.title === "string") data.title = body.title;
  if (typeof body.body === "string") data.body = body.body;
  const updated = await prisma.note.update({
    where: { id },
    data,
  });
  return Response.json({
    id: updated.id,
    title: updated.title,
    body: updated.body,
    preview: previewFromBody(updated.body),
    createdAt: updated.createdAt.getTime(),
    updatedAt: updated.updatedAt.getTime(),
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = await params;
  const note = await getNoteAndCheck(id, session.user.id);
  if (!note) {
    return Response.json({ error: "Nota no encontrada" }, { status: 404 });
  }
  await prisma.note.delete({ where: { id } });
  return Response.json({ ok: true });
}
