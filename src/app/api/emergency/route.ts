import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET: Fetch all currently checked-in visitors (emergency roll call)
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branchId");
    const hostId = searchParams.get("hostId");

    const where: Record<string, unknown> = { status: "CHECKED_IN" };
    if (branchId) where.branchId = branchId;
    if (hostId) where.hostId = hostId;

    const visitors = await prisma.visitorLog.findMany({
      where,
      include: {
        visitor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            company: true,
            photo: true,
            visitorType: true,
          },
        },
        branch: { select: { name: true } },
      },
      orderBy: { checkInTime: "desc" },
    });

    const totalCount = visitors.length;
    const accountedCount = visitors.filter((v) => v.isAccountedFor).length;

    return NextResponse.json({
      visitors,
      summary: {
        total: totalCount,
        accounted: accountedCount,
        unaccounted: totalCount - accountedCount,
      },
    });
  } catch (error) {
    console.error("Emergency roll call failed:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// POST: Mark visitor as accounted for
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { visitorLogId, isAccountedFor } = body;

    if (!visitorLogId) {
      return NextResponse.json({ error: "visitorLogId required" }, { status: 400 });
    }

    const updated = await prisma.visitorLog.update({
      where: { id: visitorLogId },
      data: {
        isAccountedFor: isAccountedFor !== false,
        accountedAt: isAccountedFor !== false ? new Date() : null,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Mark accounted failed:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
