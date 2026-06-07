import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const staff = await prisma.user.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        role: { in: ["STAFF", "DEPARTMENT_HEAD", "ADMIN"] },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        department: { select: { name: true } },
      },
      orderBy: { firstName: "asc" },
    });

    return NextResponse.json(staff);
  } catch (error) {
    console.error("Failed to fetch staff:", error);
    return NextResponse.json([], { status: 500 });
  }
}
