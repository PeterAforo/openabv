import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "PENDING";

    const where: Record<string, unknown> = {};

    if (status === "ACTIVE") {
      // PENDING + WAIT (visitors currently in queue)
      where.decision = { in: ["PENDING", "WAIT"] };
    } else if (status === "ALL_TODAY") {
      // All walk-ins from today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      where.createdAt = { gte: today };
    } else {
      where.decision = status;
    }

    // If staff role, only show their own walk-ins
    if (["STAFF", "DEPARTMENT_HEAD"].includes(session.user.role)) {
      where.recipientId = session.user.id;
    }

    const walkIns = await prisma.walkInRequest.findMany({
      where,
      include: {
        visitor: {
          select: { id: true, firstName: true, lastName: true, phone: true, company: true },
        },
        recipient: {
          select: { id: true, firstName: true, lastName: true, department: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const now = new Date();
    const queue = walkIns.map((w, index) => ({
      id: w.id,
      position: index + 1,
      visitor: w.visitor,
      recipient: w.recipient,
      purpose: w.purpose,
      decision: w.decision,
      decisionNote: w.decisionNote,
      createdAt: w.createdAt,
      waitTimeMinutes: Math.round((now.getTime() - new Date(w.createdAt).getTime()) / 60000),
      respondedAt: w.respondedAt,
    }));

    return NextResponse.json(queue);
  } catch (error) {
    console.error("Failed to fetch queue:", error);
    return NextResponse.json({ error: "Failed to fetch queue" }, { status: 500 });
  }
}
