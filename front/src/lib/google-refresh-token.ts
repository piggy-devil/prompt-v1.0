import prisma from "./prisma";

type GoogleTokenResponse = {
  access_token: string;
  expires_in: number;
  token_type: "Bearer";
  scope?: string;
  id_token?: string;
  refresh_token?: string;
};

function addSeconds(date: Date, seconds: number) {
  return new Date(date.getTime() + seconds * 1000);
}

export async function refreshGoogleAccessToken(userId: string) {
  const account = await prisma.account.findFirst({
    where: { userId, providerId: "google" },
    select: { id: true, refreshToken: true },
  });

  if (!account) throw new Error("Google account not found.");
  if (!account.refreshToken)
    throw new Error("Missing Google refresh token. Please re-authenticate.");

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? "",
    client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    grant_type: "refresh_token",
    refresh_token: account.refreshToken,
  });

  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!resp.ok) {
    // พยายามตีความ error ของ Google ให้ชัดเจน
    let errText = "";
    try {
      const j = await resp.json();
      errText = `${j.error || resp.statusText}: ${j.error_description || ""}`;
      if (j.error === "invalid_grant") {
        // refresh token โดน revoke/หมดอายุ → ให้ไป re-auth
        throw new Error(
          "Google refresh token revoked. Please re-authenticate."
        );
      }
    } catch {
      errText = await resp.text().catch(() => "");
    }
    throw new Error(
      `Failed to refresh Google token: ${resp.status} ${errText}`
    );
  }

  const data = (await resp.json()) as GoogleTokenResponse;

  const accessTokenExpiresAt = addSeconds(
    new Date(),
    Math.max(0, (data.expires_in ?? 0) - 60)
  );
  const newRefreshToken = data.refresh_token ?? account.refreshToken;

  const updated = await prisma.account.update({
    where: { id: account.id },
    data: {
      accessToken: data.access_token,
      accessTokenExpiresAt,
      refreshToken: newRefreshToken,
    },
    select: {
      accessToken: true,
      refreshToken: true,
      accessTokenExpiresAt: true,
    },
  });

  return updated; // { accessToken, refreshToken, accessTokenExpiresAt }
}

// ✅ เปลี่ยนให้คืนทั้งคู่ (ไม่ใช่เฉพาะ accessToken)
export async function ensureFreshAccessToken(userId: string): Promise<{
  accessToken: string;
  refreshToken?: string | null;
  accessTokenExpiresAt?: Date | null;
}> {
  const account = await prisma.account.findFirst({
    where: { userId, providerId: "google" },
    select: {
      accessToken: true,
      accessTokenExpiresAt: true,
      refreshToken: true, // << ต้องดึงมาด้วย
    },
  });

  if (!account) throw new Error("Google account not found.");

  const threshold = new Date(Date.now() + 2 * 60 * 1000);
  const needRefresh =
    !account.accessToken ||
    !account.accessTokenExpiresAt ||
    account.accessTokenExpiresAt <= threshold;

  if (needRefresh) {
    const refreshed = await refreshGoogleAccessToken(userId);
    return {
      accessToken: refreshed.accessToken!,
      refreshToken: refreshed.refreshToken,
      accessTokenExpiresAt: refreshed.accessTokenExpiresAt,
    };
  }

  return {
    accessToken: account.accessToken!,
    refreshToken: account.refreshToken,
    accessTokenExpiresAt: account.accessTokenExpiresAt,
  };
}
