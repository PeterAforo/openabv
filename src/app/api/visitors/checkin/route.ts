import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { sendSMS, visitorCheckedInSMS } from "@/lib/sms";
import { createInAppNotification } from "@/lib/notifications";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!["SECURITY", "RECEPTIONIST", "ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { appointmentId, visitorId, purpose, recipientName, branchId, badgeNumber, notes } = body;

    if (!visitorId || !purpose) {
      return NextResponse.json({ error: "Visitor ID and purpose are required" }, { status: 400 });
    }

    // Create visitor log
    const visitorLog = await prisma.visitorLog.create({
      data: {
        visitorId,
        appointmentId: appointmentId || null,
        branchId: branchId || session.user.branchId || null,
        purpose,
        recipientName: recipientName || null,
        status: "CHECKED_IN",
        checkInTime: new Date(),
        badgeNumber: badgeNumber || null,
        isWalkIn: !appointmentId,
        notes: notes || null,
        checkedInBy: session.user.id,
      },
      include: { visitor: true },
    });

    // Update appointment status if linked
    if (appointmentId) {
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: "CHECKED_IN" },
      });
    }

    // SMS & notification to staff recipient
    if (appointmentId) {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: { recipient: { select: { id: true, firstName: true, lastName: true, phone: true } } },
      });
      if (appointment?.recipient) {
        const vName = `${visitorLog.visitor.firstName} ${visitorLog.visitor.lastName}`;
        await createInAppNotification(
          appointment.recipient.id,
          "Visitor Checked In",
          `${vName} has checked in for your appointment.`,
          `/dashboard/staff/appointments`
        );
        if (appointment.recipient.phone) {
          const smsMsg = visitorCheckedInSMS({
            recipientName: appointment.recipient.firstName,
            visitorName: vName,
            purpose,
          });
          sendSMS({ to: appointment.recipient.phone, message: smsMsg }).catch(() => {});
        }
      }
    }

    await createAuditLog({
      userId: session.user.id,
      action: "VISITOR_CHECKIN",
      entity: "VisitorLog",
      entityId: visitorLog.id,
      newValues: { visitorId, purpose, isWalkIn: !appointmentId },
    });

    return NextResponse.json(visitorLog, { status: 201 });
  } catch (error) {
    console.error("Check-in failed:", error);
    return NextResponse.json({ error: "Check-in failed" }, { status: 500 });
  }
}
