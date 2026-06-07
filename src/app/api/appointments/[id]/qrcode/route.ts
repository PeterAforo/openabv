import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import QRCode from "qrcode";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      select: { qrCodeToken: true, appointmentCode: true },
    });

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const qrData = `${appUrl}/api/appointments/verify?token=${appointment.qrCodeToken}`;

    const qrImage = await QRCode.toDataURL(qrData, {
      width: 300,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
    });

    return NextResponse.json({
      qrCode: qrImage,
      appointmentCode: appointment.appointmentCode,
    });
  } catch (error) {
    console.error("QR code generation failed:", error);
    return NextResponse.json({ error: "Failed to generate QR code" }, { status: 500 });
  }
}
