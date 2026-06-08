import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { roomId, appointmentId, title, date, startTime, endTime } = body;

    if (!roomId || !date || !startTime || !endTime) {
      return NextResponse.json({ error: "roomId, date, startTime, endTime are required" }, { status: 400 });
    }

    const bookingDate = new Date(date);
    const start = new Date(startTime);
    const end = new Date(endTime);

    // Check for conflicts (double booking prevention)
    const conflict = await prisma.roomBooking.findFirst({
      where: {
        roomId,
        date: bookingDate,
        isActive: true,
        OR: [
          { AND: [{ startTime: { lte: start } }, { endTime: { gt: start } }] },
          { AND: [{ startTime: { lt: end } }, { endTime: { gte: end } }] },
          { AND: [{ startTime: { gte: start } }, { endTime: { lte: end } }] },
        ],
      },
    });

    if (conflict) {
      return NextResponse.json(
        { error: "Room is already booked for this time slot", conflictId: conflict.id },
        { status: 409 }
      );
    }

    const booking = await prisma.roomBooking.create({
      data: {
        roomId,
        appointmentId: appointmentId || null,
        bookedBy: session.user.id,
        title: title || "Meeting",
        date: bookingDate,
        startTime: start,
        endTime: end,
      },
      include: {
        room: { select: { name: true, floor: true } },
      },
    });

    // If linked to appointment, update appointment roomId
    if (appointmentId) {
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: { roomId },
      });
    }

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error("Room booking failed:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
