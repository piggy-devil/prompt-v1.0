import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { createDriveService } from "@/lib/drive-service-factory";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const sessionRes = await auth.api.getSession({ headers: req.headers });
    if (!sessionRes)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const form = await req.formData();

    // รับหลายไฟล์ผ่าน name="files"
    const files = form
      .getAll("files")
      .filter((f): f is File => f instanceof File);
    if (files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const category = (form.get("category") as string) || "Uncategorized";
    // รองรับ title[] / description[] ตรงตาม index (ถ้าไม่ส่งมา จะใช้ชื่อไฟล์)
    const titles = (form.getAll("titles[]") as string[]) ?? [];
    const descriptions = (form.getAll("descriptions[]") as string[]) ?? [];

    const drive = await createDriveService(sessionRes.user.id);

    // เตรียมโฟลเดอร์ครั้งเดียว
    const rootId = await drive.ensureAppRootFolder();
    const categoryId = await drive.ensureCategoryFolder(rootId, category);

    // อัปโหลดแบบขนาน (รวบผลลัพธ์ทั้งหมด)
    const results = await Promise.allSettled(
      files.map(async (file, i) => {
        const buf = Buffer.from(await file.arrayBuffer());
        const mime = file.type || "application/octet-stream";

        const { fileId, publicUrl } = await drive.uploadFile(
          `${Date.now()}_${file.name}`,
          buf,
          mime,
          categoryId
        );

        const image = await prisma.image.create({
          data: {
            title: titles[i] ?? file.name,
            description: descriptions[i] ?? "",
            category,
            driveFileId: fileId,
            driveUrl: publicUrl,
            mimeType: mime,
            size: file.size,
            userId: sessionRes.user.id,
          },
        });

        return image;
      })
    );

    const created = results
      .filter((r) => r.status === "fulfilled")
      .map((r: any) => r.value);
    const failed = results
      .filter((r) => r.status === "rejected")
      .map((r: any, idx) => ({
        file: files[idx]?.name,
        error: String(r.reason),
      }));

    return NextResponse.json({ created, failed });
  } catch (err) {
    console.error("Bulk upload error:", err);
    return NextResponse.json({ error: "Bulk upload failed" }, { status: 500 });
  }
}
