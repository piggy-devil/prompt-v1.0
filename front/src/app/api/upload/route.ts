import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { createDriveService } from "@/lib/drive-service-factory";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = (formData.get("title") as string) || "";
    const description = (formData.get("description") as string) || "";
    const category = (formData.get("category") as string) || "Uncategorized";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const arrayBuf = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);
    const mimeType = file.type || "application/octet-stream";

    // ใช้ factory ในการสร้าง drive service ที่เหมาะสม
    const driveService = await createDriveService(session.user.id);

    // 1) ROOT โฟลเดอร์ของแอป (สร้างครั้งเดียว/ค้นหาในครั้งต่อๆ ไป)
    const rootFolderId = await driveService.ensureAppRootFolder();

    // 2) โฟลเดอร์ย่อยตามหมวดหมู่ใต้ ROOT
    const categoryFolderId = await driveService.ensureCategoryFolder(
      rootFolderId,
      category
    );

    // สร้างชื่อ folder สำหรับผู้ใช้ (optional)
    const folderName = `ImageApp_${session.user.email?.split("@")[0]}`;

    // 3) อัปโหลดเข้าโฟลเดอร์ย่อยนั้น
    const { fileId, webViewLink, publicUrl } = await driveService.uploadFile(
      `${Date.now()}_${file.name}`,
      buffer,
      mimeType,
      categoryFolderId
    );

    // Save to database
    const image = await prisma.image.create({
      data: {
        title,
        description,
        category,
        driveFileId: fileId,
        driveUrl: publicUrl,
        mimeType,
        size: file.size,
        userId: session.user.id,
      },
    });

    return NextResponse.json(image);
  } catch (error) {
    console.error("Upload error:", error);

    // ตรวจสอบ error types ต่างๆ
    if (error instanceof Error) {
      if (error.message.includes("access token")) {
        return NextResponse.json(
          { error: "Google Drive access expired. Please sign in again." },
          { status: 401 }
        );
      }
    }

    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
