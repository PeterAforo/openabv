import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "Reference code is required" }, { status: 400 });
  }

  try {
    const appointment = await prisma.appointment.findUnique({
      where: { appointmentCode: code },
      include: {
        visitor: { select: { firstName: true, lastName: true } },
        recipient: { select: { firstName: true, lastName: true } },
      },
    });

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: appointment.id,
      appointmentCode: appointment.appointmentCode,
      status: appointment.status,
      date: appointment.date,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      purpose: appointment.purpose,
      visitor: appointment.visitor,
      recipient: appointment.recipient,
    });
  } catch (error) {
    console.error("Appointment lookup failed:", error);
    return NextResponse.json({ error: "Failed to look up appointment" }, { status: 500 });
  }
}
