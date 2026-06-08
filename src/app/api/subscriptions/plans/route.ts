import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// POST: Create a new subscription plan
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, description, price, currency, interval, maxUsers, maxBranches, maxVisitors, maxRooms, features } = body;

    if (!name || price === undefined) {
      return NextResponse.json({ error: "name and price required" }, { status: 400 });
    }

    const plan = await prisma.subscriptionPlan.create({
      data: {
        name,
        description: description || null,
        price: parseFloat(price),
        currency: currency || "GHS",
        interval: interval || "monthly",
        maxUsers: maxUsers || 10,
        maxBranches: maxBranches || 1,
        maxVisitors: maxVisitors || 500,
        maxRooms: maxRooms || 3,
        features: features || "[]",
      },
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error("Plan creation failed:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
