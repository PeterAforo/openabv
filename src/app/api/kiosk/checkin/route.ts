import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { pusherServer, CHANNELS, EVENTS } from "@/lib/pusher";

// POST: Complete kiosk self-check-in (requires security approval)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, appointmentId } = body;

    if (!sessionId || !appointmentId) {
      return NextResponse.json({ error: "sessionId and appointmentId required" }, { status: 400 });
    }

    // Verify kiosk session
    const kioskSession = await prisma.kioskSession.findUnique({
      where: { id: sessionId },
    });

    if (!kioskSession || kioskSession.status !== "ACTIVE") {
      return NextResponse.json({ error: "Invalid or expired session" }, { status: 400 });
    }

    if (new Date() > kioskSession.expiresAt) {
      await prisma.kioskSession.update({
        where: { id: sessionId },
        data: { status: "EXPIRED" },
      });
      return NextResponse.json({ error: "Session expired" }, { status: 410 });
    }

    // Get appointment
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { visitor: true },
    });

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    // Update appointment status to ARRIVED (security still needs to physically verify)
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: "ARRIVED", arrivedAt: new Date() },
    });

    // Mark kiosk session as completed
    await prisma.kioskSession.update({
      where: { id: sessionId },
      data: { status: "COMPLETED", completedAt: new Date() },
    });

    // Notify security via Pusher
    try {
      await pusherServer.trigger(CHANNELS.security, "kiosk:arrival", {
        appointmentId: appointment.id,
        visitorName: `${appointment.visitor.firstName} ${appointment.visitor.lastName}`,
        appointmentCode: appointment.appointmentCode,
        timestamp: new Date().toISOString(),
      });
    } catch { /* Pusher notify failure non-critical */ }

    return NextResponse.json({
      success: true,
      message: "Check-in request submitted. Please wait for security to verify your identity.",
      appointmentCode: appointment.appointmentCode,
    });
  } catch (error) {
    console.error("Kiosk check-in failed:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
