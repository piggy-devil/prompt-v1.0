"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";

export async function createChatSession() {
  const headersList = await headers();

  const session = await auth.api.getSession({
    headers: headersList,
  });

  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }

  const chat = await prisma.chatSession.create({
    data: {
      title: "เริ่มแชทใหม่",
      userId: session.user.id,
    },
  });

  return chat;
}

export async function getChatSession(chatId: string) {
  const headersList = await headers();

  const session = await auth.api.getSession({
    headers: headersList,
  });

  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }

  const chat = await prisma.chatSession.findUnique({
    where: {
      id: chatId,
      userId: session.user.id,
    },
  });

  return chat;
}
