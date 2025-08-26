import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const headersList = await headers();

  const session = await auth.api.getSession({
    headers: headersList,
  });

  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const chat = await prisma.chatSession.create({
    data: {
      title: "เริ่มแชทใหม่",
      userId: session?.user.id,
    },
  });

  await prisma.chatSession.update({
    where: { id: chat.id },
    data: {
      updatedAt: new Date(),
    },
  });

  return NextResponse.json({ id: chat.id });
}
