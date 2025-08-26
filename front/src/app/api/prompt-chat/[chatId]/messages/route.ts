import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  const { chatId } = await params;

  const messages = await prisma.chatMessage.findMany({
    where: { chatSessionId: chatId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(messages);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  const { chatId } = await params;
  const { role, content } = await req.json();

  const headersList = await headers();

  const session = await auth.api.getSession({
    headers: headersList,
  });

  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const newMessage = await prisma.chatMessage.create({
    data: {
      role,
      content,
      chatSessionId: chatId,
    },
  });

  await prisma.chatSession.update({
    where: { id: chatId },
    data: {
      updatedAt: new Date(),
    },
  });

  // ✅ ตรวจสอบว่าเป็นข้อความแรกของแชทหรือไม่
  const messageCount = await prisma.chatMessage.count({
    where: { chatSessionId: chatId },
  });

  if (messageCount === 1 && role === "HUMAN") {
    // 📝 ตัดชื่อไม่ให้ยาวเกินไป
    const trimmed = content.trim().slice(0, 40);
    await prisma.chatSession.update({
      where: { id: chatId },
      data: {
        title: trimmed + (content.length > 40 ? "…" : ""),
      },
    });
  }

  return NextResponse.json(newMessage);
}
