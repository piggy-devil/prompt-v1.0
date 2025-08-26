import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const headersList = await headers();

  const session = await auth.api.getSession({
    headers: headersList,
  });

  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // return NextResponse.redirect(
    //   new URL("/auth/login", process.env.NEXT_PUBLIC_FRONTEND_API_URL)
    // );
  }

  const chats = await prisma.chatSession.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return NextResponse.json(chats);
}
