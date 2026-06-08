import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const types = searchParams.get("types");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");

  try {
    // If types param is provided, return Visitor records (for contractor/vendor page)
    if (types) {
      const typeList = types.split(",").map(t => t.trim());
      const visitors = await prisma.visitor.findMany({
        where: { visitorType: { in: typeList as never[] } },
        include: {
          documents: { select: { id: true, type: true, fileName: true, expiresAt: true } },
          _count: { select: { appointments: true, visitorLogs: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(visitors);
    }

    const where: Record<string, unknown> = {};
    if (status && status !== "all") where.status = status;

    const [logs, total] = await Promise.all([
      prisma.visitorLog.findMany({
        where,
        include: {
          visitor: {
            select: { firstName: true, lastName: true, phone: true, company: true },
          },
        },
        orderBy: { checkInTime: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.visitorLog.count({ where }),
    ]);

    return NextResponse.json({
      logs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Failed to fetch visitor logs:", error);
    return NextResponse.json({ error: "Failed to fetch visitor logs" }, { status: 500 });
  }
}
