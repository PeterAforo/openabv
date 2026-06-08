import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

// POST: Scan a QR code at security desk and check-in visitor
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allowedRoles = ["SECURITY", "RECEPTIONIST", "ADMIN", "SUPER_ADMIN"];
  if (!allowedRoles.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { qrToken } = body;

    if (!qrToken) {
      return NextResponse.json({ error: "qrToken required" }, { status: 400 });
    }

    // Find appointment by QR token
    const appointment = await prisma.appointment.findUnique({
      where: { qrCodeToken: qrToken },
      include: {
        visitor: true,
        recipient: { select: { id: true, firstName: true, lastName: true, department: { select: { name: true } } } },
        branch: { select: { id: true, name: true } },
      },
    });

    if (!appointment) {
      return NextResponse.json({ error: "Invalid QR code", valid: false }, { status: 404 });
    }

    // Check QR expiry
    if (appointment.qrExpiresAt && new Date() > appointment.qrExpiresAt) {
      return NextResponse.json(
        { error: "QR code has expired", valid: false, expired: true, appointment: { id: appointment.id, code: appointment.appointmentCode } },
        { status: 410 }
      );
    }

    // Check if already checked in
    if (appointment.status === "CHECKED_IN") {
      return NextResponse.json(
        { error: "Visitor already checked in", valid: true, alreadyCheckedIn: true, appointment: { id: appointment.id } },
        { status: 409 }
      );
    }

    // Check appointment status
    if (!["APPROVED", "ARRIVED"].includes(appointment.status)) {
      return NextResponse.json({
        error: `Appointment status is ${appointment.status}`,
        valid: true,
        status: appointment.status,
        appointment: {
          id: appointment.id,
          code: appointment.appointmentCode,
          status: appointment.status,
        },
      }, { status: 400 });
    }

    // Check watchlist
    const watchlistMatch = await prisma.watchlistEntry.findFirst({
      where: {
        isActive: true,
        OR: [
          { visitorId: appointment.visitorId },
          { phone: appointment.visitor.phone },
          ...(appointment.visitor.email ? [{ email: appointment.visitor.email }] : []),
        ],
      },
    });

    if (watchlistMatch && watchlistMatch.riskLevel === "CRITICAL") {
      return NextResponse.json({
        error: "SECURITY ALERT: Visitor is on critical watchlist",
        valid: true,
        watchlistAlert: true,
        riskLevel: watchlistMatch.riskLevel,
        reason: watchlistMatch.reason,
      }, { status: 403 });
    }

    // Check in the visitor
    await prisma.appointment.update({
      where: { id: appointment.id },
      data: { status: "CHECKED_IN" },
    });

    // Create visitor log
    const visitorLog = await prisma.visitorLog.create({
      data: {
        visitorId: appointment.visitorId,
        appointmentId: appointment.id,
        branchId: appointment.branchId,
        purpose: appointment.purpose,
        recipientName: `${appointment.recipient.firstName} ${appointment.recipient.lastName}`,
        hostId: appointment.recipient.id,
        status: "CHECKED_IN",
        checkedInBy: session.user.id,
        badgeNumber: `V-${appointment.appointmentCode}`,
      },
    });

    await createAuditLog({
      userId: session.user.id,
      action: "QR_CHECKIN",
      entity: "Appointment",
      entityId: appointment.id,
      newValues: { visitorLogId: visitorLog.id },
    });

    return NextResponse.json({
      valid: true,
      checkedIn: true,
      visitorLogId: visitorLog.id,
      appointment: {
        id: appointment.id,
        code: appointment.appointmentCode,
        purpose: appointment.purpose,
      },
      visitor: {
        name: `${appointment.visitor.firstName} ${appointment.visitor.lastName}`,
        phone: appointment.visitor.phone,
        company: appointment.visitor.company,
        photo: appointment.visitor.photo,
      },
      host: appointment.recipient,
      branch: appointment.branch,
      watchlistWarning: watchlistMatch ? { riskLevel: watchlistMatch.riskLevel, reason: watchlistMatch.reason } : null,
    });
  } catch (error) {
    console.error("QR scan failed:", error);
    return NextResponse.json({ error: "Scan failed" }, { status: 500 });
  }
}
