import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// POST: Grant or revoke access for a visitor/user at a device
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allowedRoles = ["ADMIN", "SUPER_ADMIN", "SECURITY"];
  if (!allowedRoles.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { deviceId, visitorId, userId, action, reason } = body;

    if (!deviceId || !action) {
      return NextResponse.json({ error: "deviceId and action required" }, { status: 400 });
    }

    if (!["GRANT", "REVOKE", "ENTRY", "EXIT"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Verify device exists
    const device = await prisma.accessControlDevice.findUnique({
      where: { id: deviceId },
    });

    if (!device || !device.isActive) {
      return NextResponse.json({ error: "Device not found or inactive" }, { status: 404 });
    }

    // Log the access control event
    const log = await prisma.accessControlLog.create({
      data: {
        deviceId,
        visitorId: visitorId || null,
        userId: userId || null,
        action,
        granted: action !== "REVOKE",
        reason: reason || null,
        metadata: JSON.stringify({
          performedBy: session.user.id,
          timestamp: new Date().toISOString(),
        }),
      },
    });

    // If device has an API endpoint, trigger it (integration-ready)
    if (device.apiEndpoint) {
      try {
        await fetch(device.apiEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(device.apiKey ? { Authorization: `Bearer ${device.apiKey}` } : {}),
          },
          body: JSON.stringify({
            action,
            visitorId,
            userId,
            granted: action !== "REVOKE",
            timestamp: new Date().toISOString(),
          }),
          signal: AbortSignal.timeout(5000),
        });
      } catch {
        // Device communication failure - log but don't fail
        console.warn(`Device ${device.name} communication failed`);
      }
    }

    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    console.error("Access control action failed:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
