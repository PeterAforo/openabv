import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allowedRoles = ["ADMIN", "SUPER_ADMIN", "SECURITY"];
  if (!allowedRoles.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const riskLevel = searchParams.get("riskLevel");
    const isActive = searchParams.get("isActive") !== "false";

    const where: Record<string, unknown> = { isActive };
    if (riskLevel) where.riskLevel = riskLevel;

    const entries = await prisma.watchlistEntry.findMany({
      where,
      include: {
        visitor: { select: { id: true, firstName: true, lastName: true, phone: true, photo: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(entries);
  } catch (error) {
    console.error("Failed to fetch watchlist:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allowedRoles = ["ADMIN", "SUPER_ADMIN", "SECURITY"];
  if (!allowedRoles.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { visitorId, firstName, lastName, phone, email, idNumber, riskLevel, reason, notes } = body;

    if (!reason) {
      return NextResponse.json({ error: "Reason is required" }, { status: 400 });
    }

    const entry = await prisma.watchlistEntry.create({
      data: {
        visitorId: visitorId || null,
        firstName: firstName || null,
        lastName: lastName || null,
        phone: phone || null,
        email: email || null,
        idNumber: idNumber || null,
        riskLevel: riskLevel || "MEDIUM",
        reason,
        notes: notes || null,
        addedBy: session.user.id,
      },
    });

    // If visitorId provided, mark visitor as blacklisted
    if (visitorId) {
      await prisma.visitor.update({
        where: { id: visitorId },
        data: { isBlacklisted: true },
      });
    }

    await createAuditLog({
      userId: session.user.id,
      action: "WATCHLIST_ADD",
      entity: "WatchlistEntry",
      entityId: entry.id,
      newValues: { riskLevel: entry.riskLevel, reason },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("Failed to add to watchlist:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
