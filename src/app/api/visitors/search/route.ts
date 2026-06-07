import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query || query.length < 2) {
    return NextResponse.json({ error: "Query must be at least 2 characters" }, { status: 400 });
  }

  try {
    // Search appointments by code, visitor name, or phone
    const appointments = await prisma.appointment.findMany({
      where: {
        OR: [
          { appointmentCode: { contains: query, mode: "insensitive" } },
          { qrCodeToken: query },
          { visitor: { phone: { contains: query } } },
          { visitor: { firstName: { contains: query, mode: "insensitive" } } },
          { visitor: { lastName: { contains: query, mode: "insensitive" } } },
        ],
        date: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lt: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
      include: {
        visitor: true,
        recipient: { select: { firstName: true, lastName: true } },
      },
      take: 10,
    });

    return NextResponse.json(appointments);
  } catch (error) {
    console.error("Search failed:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
