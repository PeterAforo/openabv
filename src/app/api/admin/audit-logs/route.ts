import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "25");
  const search = searchParams.get("search") || "";
  const action = searchParams.get("action") || "";
  const entity = searchParams.get("entity") || "";
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  try {
    const where: Record<string, unknown> = {};

    if (action) where.action = { contains: action, mode: "insensitive" };
    if (entity) where.entity = { contains: entity, mode: "insensitive" };

    if (from || to) {
      const dateFilter: Record<string, Date> = {};
      if (from) dateFilter.gte = new Date(from);
      if (to) dateFilter.lte = new Date(to + "T23:59:59");
      where.createdAt = dateFilter;
    }

    if (search) {
      where.OR = [
        { action: { contains: search, mode: "insensitive" } },
        { entity: { contains: search, mode: "insensitive" } },
        { entityId: { contains: search, mode: "insensitive" } },
        { user: { firstName: { contains: search, mode: "insensitive" } } },
        { user: { lastName: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { firstName: true, lastName: true, email: true, role: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    // Get distinct actions and entities for filter dropdowns
    const [actions, entities] = await Promise.all([
      prisma.auditLog.findMany({ select: { action: true }, distinct: ["action"], orderBy: { action: "asc" } }),
      prisma.auditLog.findMany({ select: { entity: true }, distinct: ["entity"], orderBy: { entity: "asc" } }),
    ]);

    const serialized = logs.map((l) => ({
      id: l.id,
      action: l.action,
      entity: l.entity,
      entityId: l.entityId,
      oldValues: l.oldValues,
      newValues: l.newValues,
      ipAddress: l.ipAddress,
      createdAt: l.createdAt.toISOString(),
      user: l.user
        ? { firstName: l.user.firstName, lastName: l.user.lastName, email: l.user.email, role: l.user.role }
        : null,
    }));

    return NextResponse.json({
      logs: serialized,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      filters: {
        actions: actions.map((a) => a.action),
        entities: entities.map((e) => e.entity),
      },
    });
  } catch (error) {
    console.error("Failed to fetch audit logs:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
