import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import QRCode from "qrcode";

// Generate QR code for a staff member
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "card"; // card | book | preregister

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId, isActive: true, deletedAt: null },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        image: true,
        department: { select: { name: true } },
        branch: { select: { name: true } },
        staffProfile: { select: { title: true, office: true, extension: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const baseUrl = request.headers.get("x-forwarded-host")
      ? `https://${request.headers.get("x-forwarded-host")}`
      : new URL(request.url).origin;

    let targetUrl: string;
    switch (type) {
      case "book":
        targetUrl = `${baseUrl}/book-appointment?staffId=${userId}`;
        break;
      case "preregister":
        targetUrl = `${baseUrl}/pre-register?staffId=${userId}`;
        break;
      case "card":
      default:
        targetUrl = `${baseUrl}/staff/${userId}/card`;
        break;
    }

    const qrDataUrl = await QRCode.toDataURL(targetUrl, {
      width: 300,
      margin: 2,
      color: { dark: "#0A2540", light: "#FFFFFF" },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        image: user.image,
        department: user.department?.name || null,
        branch: user.branch?.name || null,
        title: user.staffProfile?.title || null,
        office: user.staffProfile?.office || null,
        extension: user.staffProfile?.extension || null,
      },
      qrCode: qrDataUrl,
      url: targetUrl,
      type,
    });
  } catch (error) {
    console.error("QR generation failed:", error);
    return NextResponse.json({ error: "Failed to generate QR code" }, { status: 500 });
  }
}
