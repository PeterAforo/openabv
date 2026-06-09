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
    const departments = await prisma.department.findMany({
      include: {
        _count: { select: { users: true } },
        branch: { select: { name: true } },
        contactPerson: { select: { firstName: true, lastName: true } },
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ departments });
  } catch (error) {
    console.error("Failed to fetch departments:", error);
    return NextResponse.json({ error: "Failed to fetch departments" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, description, branchId, contactPersonId } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const existing = await prisma.department.findUnique({ where: { name } });
    if (existing) {
      return NextResponse.json({ error: "Department already exists" }, { status: 409 });
    }

    const department = await prisma.department.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        branchId: branchId || null,
        contactPersonId: contactPersonId || null,
      },
    });

    await createAuditLog({
      userId: session.user.id,
      action: "DEPARTMENT_CREATED",
      entity: "Department",
      entityId: department.id,
      newValues: { name: department.name },
    });

    return NextResponse.json(department, { status: 201 });
  } catch (error) {
    console.error("Failed to create department:", error);
    return NextResponse.json({ error: "Failed to create department" }, { status: 500 });
  }
}
