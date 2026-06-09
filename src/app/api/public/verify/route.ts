import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST: Send verification code (or verify it)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, code, action } = body;

    if (!phone || typeof phone !== "string" || phone.length < 10) {
      return NextResponse.json({ error: "Valid phone number is required" }, { status: 400 });
    }

    // Step 1: Request a code
    if (action === "request") {
      // Generate 6-digit code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Invalidate old codes for this phone
      await prisma.visitorVerification.updateMany({
        where: { phone, verified: false },
        data: { verified: true },
      });

      await prisma.visitorVerification.create({
        data: { phone, code: verificationCode, expiresAt },
      });

      // In production, send SMS here. For dev, log it.
      console.log(`[VISITOR VERIFY] Phone: ${phone}, Code: ${verificationCode}`);

      return NextResponse.json({
        message: "Verification code sent",
        // Remove this in production — only for development
        _devCode: process.env.NODE_ENV === "development" ? verificationCode : undefined,
      });
    }

    // Step 2: Verify the code
    if (action === "verify") {
      if (!code || typeof code !== "string") {
        return NextResponse.json({ error: "Verification code is required" }, { status: 400 });
      }

      const record = await prisma.visitorVerification.findFirst({
        where: {
          phone,
          code,
          verified: false,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: "desc" },
      });

      if (!record) {
        return NextResponse.json({ error: "Invalid or expired verification code" }, { status: 400 });
      }

      // Mark as verified
      await prisma.visitorVerification.update({
        where: { id: record.id },
        data: { verified: true },
      });

      // Generate a session token for the booking flow
      const token = crypto.randomUUID();
      const tokenExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

      // Store token in a new verification record
      await prisma.visitorVerification.create({
        data: {
          phone,
          code: `token:${token}`,
          verified: true,
          expiresAt: tokenExpiry,
        },
      });

      return NextResponse.json({ verified: true, token, phone });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Verification failed:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
