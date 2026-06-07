import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { walkInVisitorSchema } from "@/lib/validations";
import { createAuditLog } from "@/lib/audit";
import { createInAppNotification } from "@/lib/notifications";
import { pusherServer, CHANNELS, EVENTS } from "@/lib/pusher";
import { sendSMS, walkInAlertSMS } from "@/lib/sms";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!["SECURITY", "RECEPTIONIST", "ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const validation = walkInVisitorSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Find or create visitor
    let visitor = await prisma.visitor.findFirst({
      where: { phone: data.phone },
    });

    if (!visitor) {
      visitor = await prisma.visitor.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email || null,
          phone: data.phone,
          company: data.company || null,
          idType: data.idType || null,
          idNumber: data.idNumber || null,
          vehicleNumber: data.vehicleNumber || null,
          photo: data.photo || null,
        },
      });
    }

    // Create walk-in request
    const walkInRequest = await prisma.walkInRequest.create({
      data: {
        visitorId: visitor.id,
        recipientId: data.recipientId,
        purpose: data.purpose,
        decision: "PENDING",
      },
      include: {
        visitor: true,
        recipient: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    // Notify recipient via Pusher (real-time)
    try {
      await pusherServer.trigger(
        CHANNELS.walkInRequest(data.recipientId),
        EVENTS.WALKIN_REQUEST,
        {
          id: walkInRequest.id,
          visitorName: `${data.firstName} ${data.lastName}`,
          purpose: data.purpose,
          company: data.company,
          createdAt: walkInRequest.createdAt,
        }
      );
    } catch (pusherError) {
      console.warn("Pusher notification failed:", pusherError);
    }

    // In-app notification
    await createInAppNotification(
      data.recipientId,
      "Walk-In Visitor Request",
      `${data.firstName} ${data.lastName} is here to see you. Purpose: ${data.purpose}`,
      `/dashboard/staff/walkins`
    );

    // SMS to recipient
    const recipientUser = await prisma.user.findUnique({
      where: { id: data.recipientId },
      select: { phone: true, firstName: true, lastName: true },
    });
    if (recipientUser?.phone) {
      const smsMsg = walkInAlertSMS({
        recipientName: `${recipientUser.firstName}`,
        visitorName: `${data.firstName} ${data.lastName}`,
        purpose: data.purpose,
      });
      sendSMS({ to: recipientUser.phone, message: smsMsg }).catch(() => {});
    }

    // Audit log
    await createAuditLog({
      userId: session.user.id,
      action: "WALKIN_REGISTERED",
      entity: "WalkInRequest",
      entityId: walkInRequest.id,
      newValues: { visitorName: `${data.firstName} ${data.lastName}`, recipientId: data.recipientId },
    });

    return NextResponse.json(walkInRequest, { status: 201 });
  } catch (error) {
    console.error("Walk-in registration failed:", error);
    return NextResponse.json({ error: "Failed to register walk-in" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  try {
    const where: Record<string, unknown> = {};

    if (["STAFF", "DEPARTMENT_HEAD"].includes(session.user.role)) {
      where.recipientId = session.user.id;
    }

    if (status) {
      where.decision = status;
    }

    const walkIns = await prisma.walkInRequest.findMany({
      where,
      include: {
        visitor: true,
        recipient: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(walkIns);
  } catch (error) {
    console.error("Failed to fetch walk-ins:", error);
    return NextResponse.json({ error: "Failed to fetch walk-ins" }, { status: 500 });
  }
}
