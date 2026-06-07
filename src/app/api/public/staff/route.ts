import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {
      isActive: true,
      deletedAt: null,
    };

    // If no search param, default to staff/dept-head/admin only (original behavior)
    if (!search) {
      where.role = { in: ["STAFF", "DEPARTMENT_HEAD", "ADMIN"] };
    } else {
      // Search across all active users by name
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const staff = await prisma.user.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true,
        department: { select: { name: true } },
      },
      orderBy: { firstName: "asc" },
      take: 20,
    });

    return NextResponse.json(staff);
  } catch (error) {
    console.error("Failed to fetch staff:", error);
    return NextResponse.json([], { status: 500 });
  }
}
