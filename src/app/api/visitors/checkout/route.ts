import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { sendSMS, visitorCheckedOutSMS } from "@/lib/sms";

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
    const { visitorLogId } = body;

    if (!visitorLogId) {
      return NextResponse.json({ error: "Visitor log ID is required" }, { status: 400 });
    }

    const visitorLog = await prisma.visitorLog.update({
      where: { id: visitorLogId },
      data: {
        status: "CHECKED_OUT",
        checkOutTime: new Date(),
        checkedOutBy: session.user.id,
      },
    });

    // If linked to appointment, update status
    if (visitorLog.appointmentId) {
      await prisma.appointment.update({
        where: { id: visitorLog.appointmentId },
        data: { status: "COMPLETED" },
      });
    }

    // SMS to visitor on checkout
    const visitor = await prisma.visitor.findUnique({ where: { id: visitorLog.visitorId } });
    if (visitor?.phone) {
      const smsMsg = visitorCheckedOutSMS({
        visitorName: `${visitor.firstName}`,
      });
      sendSMS({ to: visitor.phone, message: smsMsg }).catch(() => {});
    }

    await createAuditLog({
      userId: session.user.id,
      action: "VISITOR_CHECKOUT",
      entity: "VisitorLog",
      entityId: visitorLog.id,
    });

    return NextResponse.json(visitorLog);
  } catch (error) {
    console.error("Check-out failed:", error);
    return NextResponse.json({ error: "Check-out failed" }, { status: 500 });
  }
}
