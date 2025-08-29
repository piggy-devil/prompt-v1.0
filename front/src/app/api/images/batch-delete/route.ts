import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { createDriveService } from "@/lib/drive-service-factory";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { ids } = (await req.json()) as { ids?: string[] };
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "ids required" }, { status: 400 });
    }

    // ดึงข้อมูลรูปทั้งหมดตาม ids
    const images = await prisma.image.findMany({
      where: { id: { in: ids } },
      select: { id: true, userId: true, driveFileId: true },
    });

    let drive;
    try {
      drive = await createDriveService(session.user.id);
    } catch (e: any) {
      return NextResponse.json(
        { error: "Google auth required", detail: String(e?.message ?? e) },
        { status: 401 }
      );
    }

    const promises = ids.map(async (id) => {
      const img = images.find((x) => x.id === id);
      if (!img) return { id, status: "not_found" as const };

      if (img.userId !== session.user.id) {
        return { id, status: "forbidden" as const };
      }

      try {
        if (img.driveFileId) {
          await drive.deleteFile(img.driveFileId);
        }
        await prisma.image.delete({ where: { id } });
        return { id, status: "deleted" as const };
      } catch (e) {
        console.error("delete failed", id, e);
        return { id, status: "failed" as const, error: String(e) };
      }
    });

    const results = await Promise.all(promises);

    return NextResponse.json({
      summary: {
        deleted: results.filter((r) => r.status === "deleted").length,
        forbidden: results.filter((r) => r.status === "forbidden").length,
        not_found: results.filter((r) => r.status === "not_found").length,
        failed: results.filter((r) => r.status === "failed").length,
      },
      results,
    });
  } catch (e) {
    console.error("batch delete error:", e);
    return NextResponse.json({ error: "Batch delete failed" }, { status: 500 });
  }
}
