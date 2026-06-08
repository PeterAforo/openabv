import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET: Generate badge data for a visitor log entry
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allowedRoles = ["ADMIN", "SUPER_ADMIN", "SECURITY", "RECEPTIONIST"];
  if (!allowedRoles.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const visitorLogId = searchParams.get("visitorLogId");

    if (!visitorLogId) {
      return NextResponse.json({ error: "visitorLogId required" }, { status: 400 });
    }

    const log = await prisma.visitorLog.findUnique({
      where: { id: visitorLogId },
      include: {
        visitor: {
          select: {
            firstName: true,
            lastName: true,
            company: true,
            photo: true,
            visitorType: true,
          },
        },
        branch: { select: { name: true } },
        appointment: {
          select: {
            qrCodeToken: true,
            recipient: { select: { firstName: true, lastName: true, department: { select: { name: true } } } },
          },
        },
      },
    });

    if (!log) {
      return NextResponse.json({ error: "Visitor log not found" }, { status: 404 });
    }

    // Compute badge expiry (end of business day or appointment end)
    const now = new Date();
    const badgeExpiry = new Date(now);
    badgeExpiry.setHours(17, 0, 0, 0); // Default: 5 PM

    const badge = {
      id: log.id,
      badgeNumber: log.badgeNumber || `V-${log.id.slice(0, 6).toUpperCase()}`,
      visitor: {
        name: `${log.visitor.firstName} ${log.visitor.lastName}`,
        company: log.visitor.company,
        photo: log.visitor.photo || log.photoUrl,
        type: log.visitor.visitorType,
      },
      host: log.appointment?.recipient
        ? `${log.appointment.recipient.firstName} ${log.appointment.recipient.lastName}`
        : log.recipientName || "N/A",
      department: log.appointment?.recipient?.department?.name || "General",
      branch: log.branch?.name || "Main",
      checkInTime: log.checkInTime,
      expiresAt: badgeExpiry,
      qrToken: log.appointment?.qrCodeToken || log.id,
      purpose: log.purpose,
    };

    return NextResponse.json(badge);
  } catch (error) {
    console.error("Badge generation failed:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
