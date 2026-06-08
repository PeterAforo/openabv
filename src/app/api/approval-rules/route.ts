import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const rules = await prisma.approvalRule.findMany({
      orderBy: { priority: "desc" },
    });
    return NextResponse.json(rules);
  } catch (error) {
    console.error("Failed to fetch approval rules:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, description, conditions, action, priority } = body;

    if (!name || !conditions || !action) {
      return NextResponse.json({ error: "name, conditions, action required" }, { status: 400 });
    }

    const validActions = ["auto_approve", "require_approval", "block"];
    if (!validActions.includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const rule = await prisma.approvalRule.create({
      data: {
        name,
        description: description || null,
        conditions: typeof conditions === "string" ? conditions : JSON.stringify(conditions),
        action,
        priority: priority || 0,
      },
    });

    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    console.error("Failed to create rule:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    await prisma.approvalRule.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete rule:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
