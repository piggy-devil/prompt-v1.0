import { drive_v3, google } from "googleapis";
import { Readable } from "node:stream";

const APP_ROOT_NAME = process.env.DRIVE_APP_ROOT_NAME || "ImageApp"; // ← ตั้งชื่อ ROOT ได้ที่นี่

function escapeQuote(s: string) {
  return s.replace(/'/g, "\\'");
}

export class GoogleDriveService {
  private drive: drive_v3.Drive;

  constructor(accessToken: string, refreshToken?: string) {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    this.drive = google.drive({
      version: "v3",
      auth: oauth2Client,
    });
  }

  /** หา/สร้าง ROOT โฟลเดอร์ของแอปในไดรฟ์ของผู้ใช้ */
  async ensureAppRootFolder(): Promise<string> {
    const q =
      "mimeType='application/vnd.google-apps.folder' and trashed=false " +
      "and appProperties has { key='app' and value='" +
      escapeQuote(APP_ROOT_NAME) +
      "' } " +
      "and appProperties has { key='role' and value='root' }";

    const found = await this.drive.files.list({
      q,
      fields: "files(id,name,appProperties)",
      supportsAllDrives: true,
      pageSize: 1,
    });

    const existing = found.data.files?.[0];
    if (existing?.id) return existing.id;

    const created = await this.drive.files.create({
      requestBody: {
        name: APP_ROOT_NAME,
        mimeType: "application/vnd.google-apps.folder",
        appProperties: { app: APP_ROOT_NAME, role: "root" },
      },
      fields: "id",
      supportsAllDrives: true,
    });

    return created.data.id!;
  }

  /** หา/สร้างโฟลเดอร์ย่อยใต้ ROOT (เช่นตามหมวดหมู่) */
  async ensureCategoryFolder(
    rootId: string,
    categoryRaw?: string
  ): Promise<string> {
    const category = (categoryRaw || "Uncategorized").trim() || "Uncategorized";
    // หาโฟลเดอร์ชื่อนี้ใต้ ROOT
    const q = `'${rootId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false and name='${escapeQuote(
      category
    )}'`;

    const found = await this.drive.files.list({
      q,
      fields: "files(id,name)",
      supportsAllDrives: true,
      pageSize: 1,
    });

    const existing = found.data.files?.[0];
    if (existing?.id) return existing.id;

    // ไม่พบ -> สร้างใหม่
    const created = await this.drive.files.create({
      requestBody: {
        name: category,
        parents: [rootId],
        mimeType: "application/vnd.google-apps.folder",
        appProperties: { app: APP_ROOT_NAME, role: "category", category },
      },
      fields: "id",
      supportsAllDrives: true,
    });

    return created.data.id!;
  }

  async uploadFile(
    fileName: string,
    buffer: Buffer,
    mimeType: string,
    folderId?: string
  ): Promise<{ fileId: string; webViewLink: string; publicUrl: string }> {
    const media = {
      mimeType: mimeType || "application/octet-stream",
      body: Readable.from(buffer), // 👈 สำคัญ: ใช้ Node Readable stream
    };

    // 1) สร้างไฟล์
    const fileRes = await this.drive.files.create({
      requestBody: {
        name: fileName,
        parents: folderId ? [folderId] : undefined,
      },
      media,
      fields: "id, webViewLink",
      supportsAllDrives: true,
    });

    const fileId = fileRes.data.id!;
    const webViewLink = fileRes.data.webViewLink ?? "";

    // 2) แชร์แบบ public read
    await this.drive.permissions.create({
      fileId,
      requestBody: { type: "anyone", role: "reader" },
      supportsAllDrives: true,
    });

    // 3) public URL ที่ฝัง <img> ได้
    // ทางที่เวิร์กที่สุดคือแบบ uc?export=view
    const publicUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;

    return { fileId, webViewLink, publicUrl };
  }

  async createFolder(
    folderName: string,
    parentFolderId?: string
  ): Promise<string> {
    try {
      const response = await this.drive.files.create({
        requestBody: {
          name: folderName,
          mimeType: "application/vnd.google-apps.folder",
          parents: parentFolderId ? [parentFolderId] : undefined,
        },
      });
      return response.data.id as string;
    } catch (error) {
      console.error("Error creating folder:", error);
      throw error;
    }
  }

  async updateFile(
    fileId: string,
    fileName: string,
    buffer: Buffer,
    mimeType: string
  ): Promise<void> {
    try {
      await this.drive.files.update({
        fileId,
        requestBody: {
          name: fileName,
        },
        media: {
          mimeType,
          body: buffer,
        },
      });
    } catch (error) {
      console.error("Error updating Google Drive file:", error);
      throw error;
    }
  }

  // ลบไฟล์ออกจาก Drive (permanent)
  async deleteFile(fileId: string): Promise<void> {
    try {
      await this.drive.files.delete({
        fileId,
        supportsAllDrives: true,
      });
    } catch (err: any) {
      const status = err?.code ?? err?.response?.status;
      // ถ้าไฟล์ไม่มีแล้ว (404) ถือว่าโอเค ทำต่อได้
      if (status === 404) return;
      throw err; // อย่างอื่นให้เด้งขึ้นไปให้ route ตัดสินใจ
    }
  }

  // (ถ้าอยากโยนลงถังขยะแทน permanent delete)
  async trashFile(fileId: string): Promise<void> {
    await this.drive.files.update({
      fileId,
      supportsAllDrives: true,
      requestBody: { trashed: true },
    });
  }
}
