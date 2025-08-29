import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { createDriveService } from "@/lib/drive-service-factory";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const img = await prisma.image.findUnique({ where: { id: id } });
  if (!img) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (img.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ลบที่ Google Drive ก่อน (best-effort)
  try {
    if (img.driveFileId) {
      const drive = await createDriveService(session.user.id);
      await drive.deleteFile(img.driveFileId); // หรือ await drive.trashFile(img.driveFileId)
    }
  } catch (e) {
    console.error("Failed to delete file on Drive:", e);
    // ถ้าอยากหยุดไม่ลบ DB เมื่อ Drive ล้มเหลว ให้ return 502 ตรงนี้
    return NextResponse.json(
      { error: "Failed to delete file on Google Drive" },
      { status: 502 }
    );
  }

  await prisma.image.delete({ where: { id: id } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json(); // { title?, description? }
  const img = await prisma.image.findUnique({ where: { id: id } });
  if (!img) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (img.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const updated = await prisma.image.update({
    where: { id: id },
    data: { title: body.title, description: body.description },
  });
  return NextResponse.json(updated);
}
