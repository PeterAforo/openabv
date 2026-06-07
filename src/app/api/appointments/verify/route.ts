import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Token is required" }, { status: 400 });
  }

  try {
    const appointment = await prisma.appointment.findUnique({
      where: { qrCodeToken: token },
      include: {
        visitor: { select: { firstName: true, lastName: true, phone: true } },
        recipient: { select: { firstName: true, lastName: true } },
      },
    });

    if (!appointment) {
      return NextResponse.json({ error: "Invalid QR code" }, { status: 404 });
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
    console.error("QR verification failed:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
