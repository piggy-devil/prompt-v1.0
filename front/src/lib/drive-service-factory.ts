import prisma from "./prisma";
import { GoogleDriveService } from "./google-drive-service";
import { ensureFreshAccessToken } from "./google-refresh-token";

export async function createDriveService(
  userId: string
): Promise<GoogleDriveService> {
  const account = await prisma.account.findFirst({
    where: { userId, providerId: "google" },
    select: { refreshToken: true },
  });
  if (!account) throw new Error("Google account not connected for this user.");
  if (!account.refreshToken)
    throw new Error("Missing Google refresh token. Please re-authenticate.");

  // ✅ ดึง token ที่สดแน่นอน (และรู้ด้วยว่า refresh token หมุนหรือไม่)
  const fresh = await ensureFreshAccessToken(userId);

  return new GoogleDriveService(
    fresh.accessToken,
    // ถ้า Google หมุน refresh token ใหม่ ให้ใช้ตัวใหม่, ไม่งั้นใช้ตัวเดิมจาก DB
    fresh.refreshToken ?? account.refreshToken
  );
}
