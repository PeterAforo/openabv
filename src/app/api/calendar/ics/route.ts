import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateICSFile } from "@/lib/ics";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const appointmentId = searchParams.get("appointmentId");

  if (!appointmentId) {
    return NextResponse.json({ error: "Appointment ID required" }, { status: 400 });
  }

  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        visitor: true,
        recipient: true,
      },
    });

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    const icsContent = await generateICSFile({
      title: `Appointment: ${appointment.visitor.firstName} ${appointment.visitor.lastName}`,
      description: `Purpose: ${appointment.purpose}\nVisitor: ${appointment.visitor.firstName} ${appointment.visitor.lastName}\nPhone: ${appointment.visitor.phone}`,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      organizer: {
        name: `${appointment.recipient.firstName} ${appointment.recipient.lastName}`,
        email: appointment.recipient.email,
      },
      attendees: appointment.visitor.email
        ? [{ name: `${appointment.visitor.firstName} ${appointment.visitor.lastName}`, email: appointment.visitor.email }]
        : [],
    });

    return new NextResponse(icsContent, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="appointment-${appointment.appointmentCode}.ics"`,
      },
    });
  } catch (error) {
    console.error("ICS generation failed:", error);
    return NextResponse.json({ error: "Failed to generate calendar file" }, { status: 500 });
  }
}
