import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

// POST: Send verification code (or verify it)
// Accepts either phone or email (or both) for identification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, email, code, action } = body;

    // Accept phone or email as identifier
    const identifier = phone || email;
    if (!identifier || typeof identifier !== "string" || identifier.length < 5) {
      return NextResponse.json({ error: "Valid phone number or email is required" }, { status: 400 });
    }

    // Step 1: Request a code
    if (action === "request") {
      // Generate 6-digit code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Invalidate old codes for this identifier
      await prisma.visitorVerification.updateMany({
        where: { phone: identifier, verified: false },
        data: { verified: true },
      });

      await prisma.visitorVerification.create({
        data: { phone: identifier, code: verificationCode, expiresAt },
      });

      // Send OTP via email if email is provided
      const emailTarget = email || (phone && phone.includes("@") ? phone : null);
      if (emailTarget && emailTarget.includes("@")) {
        await sendEmail({
          to: emailTarget,
          subject: "VisitFlow - Your Verification Code",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #0A2540; color: white; padding: 20px; text-align: center;">
                <h1 style="margin: 0; color: #00C48C;">VisitFlow</h1>
                <p style="margin: 5px 0 0; color: #ccc;">Visitor Verification</p>
              </div>
              <div style="padding: 30px; background: #f9fafb;">
                <h2 style="color: #0A2540;">Your Verification Code</h2>
                <p>Use the code below to verify your identity and book an appointment:</p>
                <div style="background: white; padding: 24px; border-radius: 8px; text-align: center; margin: 20px 0;">
                  <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #0A2540; font-family: monospace;">${verificationCode}</span>
                </div>
                <p style="color: #6b7280; font-size: 13px;">This code expires in 10 minutes. If you did not request this code, please ignore this email.</p>
              </div>
            </div>
          `,
        });
      }

      // Also attempt SMS via mNotify if configured (phone provided)
      if (phone && !phone.includes("@")) {
        try {
          const smsSettings = await prisma.systemSetting.findMany({ where: { group: "sms" } });
          const smsConfig: Record<string, string> = {};
          for (const s of smsSettings) smsConfig[s.key] = s.value;

          if (smsConfig.sms_enabled === "true" && smsConfig.sms_api_key) {
            const smsRes = await fetch("https://apps.mnotify.net/smsapi", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                key: smsConfig.sms_api_key,
                to: phone,
                msg: `Your VisitFlow verification code is: ${verificationCode}. Valid for 10 minutes.`,
                sender_id: smsConfig.sms_sender_id || "VisitFlow",
              }),
            });
            console.log(`[SMS] Sent to ${phone}, status: ${smsRes.status}`);
          }
        } catch (smsError) {
          console.warn("[SMS] Failed to send:", smsError);
        }
      }

      console.log(`[VISITOR VERIFY] Identifier: ${identifier}, Code: ${verificationCode}`);

      return NextResponse.json({
        message: emailTarget
          ? "Verification code sent to your email"
          : "Verification code sent to your phone",
        // In dev, show code for testing
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
          phone: identifier,
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
          phone: identifier,
          code: `token:${token}`,
          verified: true,
          expiresAt: tokenExpiry,
        },
      });

      return NextResponse.json({ verified: true, token, phone: identifier });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Verification failed:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
