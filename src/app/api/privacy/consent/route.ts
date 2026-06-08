import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST: Record visitor consent
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { visitorId, consentType, ipAddress } = body;

    if (!visitorId || !consentType) {
      return NextResponse.json({ error: "visitorId and consentType required" }, { status: 400 });
    }

    const validTypes = ["data_processing", "photo_capture", "id_storage", "marketing"];
    if (!validTypes.includes(consentType)) {
      return NextResponse.json({ error: "Invalid consent type" }, { status: 400 });
    }

    // Upsert consent - revoke old, create new
    await prisma.consentRecord.updateMany({
      where: { visitorId, consentType, status: "GRANTED" },
      data: { status: "REVOKED", revokedAt: new Date() },
    });

    const consent = await prisma.consentRecord.create({
      data: {
        visitorId,
        consentType,
        status: "GRANTED",
        ipAddress: ipAddress || null,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      },
    });

    return NextResponse.json(consent, { status: 201 });
  } catch (error) {
    console.error("Consent recording failed:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// DELETE: Revoke consent
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const visitorId = searchParams.get("visitorId");
    const consentType = searchParams.get("consentType");

    if (!visitorId) {
      return NextResponse.json({ error: "visitorId required" }, { status: 400 });
    }

    const where: Record<string, unknown> = { visitorId, status: "GRANTED" };
    if (consentType) where.consentType = consentType;

    await prisma.consentRecord.updateMany({
      where,
      data: { status: "REVOKED", revokedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Consent revocation failed:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
