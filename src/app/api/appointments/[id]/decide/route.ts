import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { appointmentDecisionSchema } from "@/lib/validations";
import { createAuditLog } from "@/lib/audit";
import { createInAppNotification } from "@/lib/notifications";
import { createGoogleCalendarEvent } from "@/lib/calendar";
import { sendSMS, appointmentApprovedSMS, appointmentDeclinedSMS, appointmentRescheduledSMS } from "@/lib/sms";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const validation = appointmentDecisionSchema.safeParse({ ...body, appointmentId: id });

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { decision, reason, rescheduledDate, rescheduledTime } = validation.data;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { visitor: true, recipient: true },
    });

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    // Verify user is the recipient or admin
    if (
      appointment.recipientId !== session.user.id &&
      !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updateData: Record<string, unknown> = { status: decision };

    if (decision === "DECLINED") {
      updateData.declineReason = reason || null;
    }

    if (decision === "RESCHEDULED" && rescheduledDate) {
      updateData.rescheduledDate = new Date(rescheduledDate);
      if (rescheduledTime) {
        const rd = new Date(rescheduledDate);
        const [h, m] = rescheduledTime.split(":").map(Number);
        rd.setHours(h, m);
        updateData.rescheduledTime = rd;
      }
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: updateData,
    });

    // Create Google Calendar event on approval
    if (decision === "APPROVED") {
      const eventId = await createGoogleCalendarEvent(session.user.id, {
        summary: `Meeting with ${appointment.visitor.firstName} ${appointment.visitor.lastName}`,
        description: appointment.purpose,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        attendees: appointment.visitor.email ? [appointment.visitor.email] : [],
      });

      if (eventId) {
        await prisma.appointment.update({
          where: { id },
          data: { googleEventId: eventId },
        });
      }
    }

    // SMS to visitor based on decision
    if (appointment.visitor.phone) {
      const visitorName = `${appointment.visitor.firstName} ${appointment.visitor.lastName}`;
      let smsMsg = "";
      if (decision === "APPROVED") {
        smsMsg = appointmentApprovedSMS({
          visitorName,
          appointmentCode: appointment.appointmentCode,
          date: new Date(appointment.date).toLocaleDateString(),
          time: new Date(appointment.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        });
      } else if (decision === "DECLINED") {
        smsMsg = appointmentDeclinedSMS({
          visitorName,
          appointmentCode: appointment.appointmentCode,
          reason,
        });
      } else if (decision === "RESCHEDULED" && rescheduledDate) {
        smsMsg = appointmentRescheduledSMS({
          visitorName,
          appointmentCode: appointment.appointmentCode,
          newDate: rescheduledDate,
          newTime: rescheduledTime || "TBD",
        });
      }
      if (smsMsg) {
        sendSMS({ to: appointment.visitor.phone, message: smsMsg }).catch(() => {});
      }
    }

    // In-app notification to visitor (if they have a linked user — not always)
    // Notify recipient in-app about their own decision confirmation is implicit

    // Audit log
    await createAuditLog({
      userId: session.user.id,
      action: `APPOINTMENT_${decision}`,
      entity: "Appointment",
      entityId: id,
      newValues: { decision, reason },
    });

    return NextResponse.json({ success: true, appointment: updated });
  } catch (error) {
    console.error("Appointment decision failed:", error);
    return NextResponse.json({ error: "Failed to process decision" }, { status: 500 });
  }
}
