import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const showAll = searchParams.get("all") === "true";

  try {
    const where = showAll ? {} : { status: "CHECKED_IN" as const };

    const visitors = await prisma.visitorLog.findMany({
      where,
      include: {
        visitor: true,
      },
      orderBy: { checkInTime: "desc" },
      take: showAll ? 200 : undefined,
    });

    return NextResponse.json({ visitors });
  } catch (error) {
    console.error("Failed to fetch visitors:", error);
    return NextResponse.json({ error: "Failed to fetch visitors" }, { status: 500 });
  }
}
