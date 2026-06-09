import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

export async function GET() {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const branches = await prisma.branch.findMany({
      include: {
        _count: { select: { users: true } },
        contactPerson: { select: { firstName: true, lastName: true } },
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ branches });
  } catch (error) {
    console.error("Failed to fetch branches:", error);
    return NextResponse.json({ error: "Failed to fetch branches" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, address, city, phone, contactPersonId } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const existing = await prisma.branch.findUnique({ where: { name } });
    if (existing) {
      return NextResponse.json({ error: "Branch already exists" }, { status: 409 });
    }

    const branch = await prisma.branch.create({
      data: {
        name: name.trim(),
        address: address?.trim() || null,
        city: city?.trim() || null,
        phone: phone?.trim() || null,
        contactPersonId: contactPersonId || null,
      },
    });

    await createAuditLog({
      userId: session.user.id,
      action: "BRANCH_CREATED",
      entity: "Branch",
      entityId: branch.id,
      newValues: { name: branch.name },
    });

    return NextResponse.json(branch, { status: 201 });
  } catch (error) {
    console.error("Failed to create branch:", error);
    return NextResponse.json({ error: "Failed to create branch" }, { status: 500 });
  }
}
