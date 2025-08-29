import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor") || undefined;
  const limit = Math.min(parseInt(searchParams.get("limit") || "24", 10), 100);

  const items = await prisma.image.findMany({
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    take: limit,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      driveUrl: true,
      createdAt: true,
      //   userId: true,
    },
  });

  const nextCursor = items.length === limit ? items[items.length - 1].id : null;
  return NextResponse.json({ items, nextCursor });
}
