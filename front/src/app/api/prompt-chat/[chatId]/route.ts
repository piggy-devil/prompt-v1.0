import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  const { chatId } = await params;

  const chat = await prisma.chatSession.findUnique({
    where: { id: chatId },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!chat) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(chat);
}

// export async function POST(
//   req: NextRequest,
//   { params }: { params: { chatId: string } }
// ) {
//   const { chatId } = params;
//   const { role, content } = await req.json();

//   const newMessage = await prisma.chatMessage.create({
//     data: {
//       role,
//       content,
//       chatSessionId: chatId,
//     },
//   });

//   return NextResponse.json(newMessage);
// }

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  const headersList = await headers();

  const session = await auth.api.getSession({
    headers: headersList,
  });

  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { chatId } = await params;

  // 🔒 ตรวจสอบว่า chat เป็นของผู้ใช้คนนี้
  const chatSession = await prisma.chatSession.findUnique({
    where: { id: chatId },
  });

  if (!chatSession || chatSession.userId !== userId) {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  try {
    await prisma.chatSession.delete({
      where: { id: chatId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting messages:", error);
    return NextResponse.json(
      { success: false, error: "Unable to delete messages" },
      { status: 500 }
    );
  }
}
