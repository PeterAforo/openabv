import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET: List subscription plans
export async function GET() {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { price: "asc" },
    });
    return NextResponse.json(plans);
  } catch (error) {
    console.error("Failed to fetch plans:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// POST: Create a new tenant subscription
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { tenantId, planId, trialDays } = body;

    if (!tenantId || !planId) {
      return NextResponse.json({ error: "tenantId and planId required" }, { status: 400 });
    }

    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + (plan.interval === "yearly" ? 12 : 1));

    const trialEnd = trialDays ? new Date(now.getTime() + trialDays * 86400000) : null;

    const subscription = await prisma.tenantSubscription.create({
      data: {
        tenantId,
        planId,
        status: trialDays ? "TRIAL" : "ACTIVE",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        trialEndsAt: trialEnd,
      },
      include: { plan: true, tenant: true },
    });

    return NextResponse.json(subscription, { status: 201 });
  } catch (error) {
    console.error("Subscription creation failed:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
