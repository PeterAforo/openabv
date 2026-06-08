import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createGoogleCalendarEvent, updateGoogleCalendarEvent, deleteGoogleCalendarEvent } from "@/lib/calendar";
import prisma from "@/lib/prisma";

// POST: Create a Google Calendar event for an appointment
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { appointmentId } = body;

    if (!appointmentId) {
      return NextResponse.json({ error: "appointmentId required" }, { status: 400 });
    }

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

    const eventId = await createGoogleCalendarEvent(appointment.recipientId, {
      summary: `Appointment: ${appointment.visitor.firstName} ${appointment.visitor.lastName}`,
      description: `Purpose: ${appointment.purpose}\nVisitor: ${appointment.visitor.firstName} ${appointment.visitor.lastName}\nPhone: ${appointment.visitor.phone}`,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      attendees: appointment.visitor.email ? [appointment.visitor.email] : undefined,
    });

    if (eventId) {
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: { googleEventId: eventId },
      });
      return NextResponse.json({ success: true, eventId });
    }

    return NextResponse.json({ error: "Google Calendar integration not configured or failed" }, { status: 400 });
  } catch (error) {
    console.error("Google Calendar create failed:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// PATCH: Update a Google Calendar event
export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { appointmentId, summary, description, startTime, endTime } = body;

    if (!appointmentId) {
      return NextResponse.json({ error: "appointmentId required" }, { status: 400 });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment?.googleEventId) {
      return NextResponse.json({ error: "No Google Calendar event linked" }, { status: 404 });
    }

    const success = await updateGoogleCalendarEvent(appointment.recipientId, appointment.googleEventId, {
      summary,
      description,
      startTime: startTime ? new Date(startTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined,
    });

    return NextResponse.json({ success });
  } catch (error) {
    console.error("Google Calendar update failed:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// DELETE: Cancel a Google Calendar event
export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const appointmentId = searchParams.get("appointmentId");

    if (!appointmentId) {
      return NextResponse.json({ error: "appointmentId required" }, { status: 400 });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment?.googleEventId) {
      return NextResponse.json({ error: "No Google Calendar event linked" }, { status: 404 });
    }

    const success = await deleteGoogleCalendarEvent(appointment.recipientId, appointment.googleEventId);

    if (success) {
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: { googleEventId: null },
      });
    }

    return NextResponse.json({ success });
  } catch (error) {
    console.error("Google Calendar delete failed:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
