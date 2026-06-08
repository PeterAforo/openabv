import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// Check if a visitor matches any active watchlist entry
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { phone, email, idNumber, firstName, lastName, visitorId } = body;

    const conditions: Record<string, unknown>[] = [];

    if (visitorId) conditions.push({ visitorId });
    if (phone) conditions.push({ phone });
    if (email) conditions.push({ email });
    if (idNumber) conditions.push({ idNumber });

    // Name-based matching (less reliable, lower priority)
    if (firstName && lastName) {
      conditions.push({
        AND: [
          { firstName: { equals: firstName, mode: "insensitive" } },
          { lastName: { equals: lastName, mode: "insensitive" } },
        ],
      });
    }

    if (conditions.length === 0) {
      return NextResponse.json({ matched: false, entries: [] });
    }

    const entries = await prisma.watchlistEntry.findMany({
      where: {
        isActive: true,
        OR: conditions,
      },
      orderBy: { riskLevel: "desc" },
    });

    return NextResponse.json({
      matched: entries.length > 0,
      entries,
      highestRisk: entries[0]?.riskLevel || null,
    });
  } catch (error) {
    console.error("Watchlist check failed:", error);
    return NextResponse.json({ matched: false, entries: [] });
  }
}
