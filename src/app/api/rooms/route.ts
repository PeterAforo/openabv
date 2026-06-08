import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branchId");
    const date = searchParams.get("date");

    const where: Record<string, unknown> = { isActive: true };
    if (branchId) where.branchId = branchId;

    const rooms = await prisma.meetingRoom.findMany({
      where,
      include: {
        branch: { select: { name: true } },
        bookings: date
          ? {
              where: {
                date: new Date(date),
                isActive: true,
              },
              select: { id: true, title: true, startTime: true, endTime: true, bookedBy: true },
            }
          : { where: { isActive: true, date: { gte: new Date() } }, take: 5 },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(rooms);
  } catch (error) {
    console.error("Failed to fetch rooms:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allowedRoles = ["ADMIN", "SUPER_ADMIN"];
  if (!allowedRoles.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, branchId, floor, capacity, amenities } = body;

    if (!name) {
      return NextResponse.json({ error: "Room name is required" }, { status: 400 });
    }

    const room = await prisma.meetingRoom.create({
      data: {
        name,
        branchId: branchId || null,
        floor: floor || null,
        capacity: capacity || 4,
        amenities: amenities ? JSON.stringify(amenities) : null,
      },
    });

    return NextResponse.json(room, { status: 201 });
  } catch (error) {
    console.error("Failed to create room:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
