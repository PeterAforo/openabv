import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST: Start a kiosk self-check-in session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, appointmentCode, qrToken, branchId } = body;

    if (!phone && !appointmentCode && !qrToken) {
      return NextResponse.json(
        { error: "Phone, appointment code, or QR token required" },
        { status: 400 }
      );
    }

    // Find matching appointment
    let appointment = null;

    if (qrToken) {
      appointment = await prisma.appointment.findUnique({
        where: { qrCodeToken: qrToken },
        include: {
          visitor: true,
          recipient: { select: { firstName: true, lastName: true, department: { select: { name: true } } } },
        },
      });
    } else if (appointmentCode) {
      appointment = await prisma.appointment.findUnique({
        where: { appointmentCode },
        include: {
          visitor: true,
          recipient: { select: { firstName: true, lastName: true, department: { select: { name: true } } } },
        },
      });
    } else if (phone) {
      // Find by visitor phone - get today's approved appointment
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      appointment = await prisma.appointment.findFirst({
        where: {
          visitor: { phone },
          date: { gte: today, lt: tomorrow },
          status: { in: ["APPROVED", "PENDING"] },
        },
        include: {
          visitor: true,
          recipient: { select: { firstName: true, lastName: true, department: { select: { name: true } } } },
        },
        orderBy: { startTime: "asc" },
      });
    }

    if (!appointment) {
      // No appointment found - allow walk-in registration
      return NextResponse.json({
        found: false,
        message: "No appointment found. You can register as a walk-in visitor.",
        canWalkIn: true,
      });
    }

    // Check QR expiry
    if (appointment.qrExpiresAt && new Date() > appointment.qrExpiresAt) {
      return NextResponse.json(
        { found: false, error: "QR code has expired", expired: true },
        { status: 410 }
      );
    }

    // Check if already checked in
    if (appointment.status === "CHECKED_IN") {
      return NextResponse.json(
        { found: true, error: "Already checked in", alreadyCheckedIn: true },
        { status: 409 }
      );
    }

    // Create kiosk session
    const session = await prisma.kioskSession.create({
      data: {
        branchId: branchId || appointment.branchId,
        visitorPhone: appointment.visitor.phone,
        visitorName: `${appointment.visitor.firstName} ${appointment.visitor.lastName}`,
        appointmentCode: appointment.appointmentCode,
        qrToken: appointment.qrCodeToken,
        status: "ACTIVE",
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min expiry
      },
    });

    return NextResponse.json({
      found: true,
      sessionId: session.id,
      appointment: {
        id: appointment.id,
        code: appointment.appointmentCode,
        status: appointment.status,
        date: appointment.date,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        purpose: appointment.purpose,
      },
      visitor: {
        firstName: appointment.visitor.firstName,
        lastName: appointment.visitor.lastName,
        phone: appointment.visitor.phone,
        company: appointment.visitor.company,
      },
      host: appointment.recipient,
    });
  } catch (error) {
    console.error("Kiosk session failed:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
