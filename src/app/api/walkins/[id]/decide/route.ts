import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { walkInDecisionSchema } from "@/lib/validations";
import { createAuditLog } from "@/lib/audit";
import { pusherServer, CHANNELS, EVENTS } from "@/lib/pusher";
import { sendSMS, walkInDecisionSMS } from "@/lib/sms";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const validation = walkInDecisionSchema.safeParse({ ...body, walkInRequestId: id });

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { decision, note } = validation.data;

    const walkInRequest = await prisma.walkInRequest.findUnique({
      where: { id },
      include: { visitor: true, recipient: true },
    });

    if (!walkInRequest) {
      return NextResponse.json({ error: "Walk-in request not found" }, { status: 404 });
    }

    // Verify user is the recipient or admin
    if (
      walkInRequest.recipientId !== session.user.id &&
      !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.walkInRequest.update({
      where: { id },
      data: {
        decision,
        decisionNote: note || null,
        respondedAt: new Date(),
      },
      include: { visitor: true },
    });

    // Notify security via Pusher
    try {
      await pusherServer.trigger(CHANNELS.security, EVENTS.WALKIN_DECISION, {
        id: updated.id,
        visitorName: `${updated.visitor.firstName} ${updated.visitor.lastName}`,
        decision,
        note,
        respondedAt: updated.respondedAt,
      });
    } catch (pusherError) {
      console.warn("Pusher notification failed:", pusherError);
    }

    // SMS to visitor about decision
    if (walkInRequest.visitor.phone) {
      const smsMsg = walkInDecisionSMS({
        visitorName: `${walkInRequest.visitor.firstName} ${walkInRequest.visitor.lastName}`,
        decision,
        recipientName: `${walkInRequest.recipient.firstName} ${walkInRequest.recipient.lastName}`,
        note,
      });
      sendSMS({ to: walkInRequest.visitor.phone, message: smsMsg }).catch(() => {});
    }

    // Audit log
    await createAuditLog({
      userId: session.user.id,
      action: `WALKIN_${decision}`,
      entity: "WalkInRequest",
      entityId: id,
      newValues: { decision, note },
    });

    return NextResponse.json({ success: true, walkInRequest: updated });
  } catch (error) {
    console.error("Walk-in decision failed:", error);
    return NextResponse.json({ error: "Failed to process decision" }, { status: 500 });
  }
}
