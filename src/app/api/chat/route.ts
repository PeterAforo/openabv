import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { chatMessageSchema } from "@/lib/validations";
import { pusherServer, CHANNELS, EVENTS } from "@/lib/pusher";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validation = chatMessageSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { walkInRequestId, message } = validation.data;

    // Verify walk-in request exists and user is involved
    const walkIn = await prisma.walkInRequest.findUnique({
      where: { id: walkInRequestId },
    });

    if (!walkIn) {
      return NextResponse.json({ error: "Walk-in request not found" }, { status: 404 });
    }

    const chatMessage = await prisma.chatMessage.create({
      data: {
        walkInRequestId,
        senderId: session.user.id,
        message,
      },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, role: true } },
      },
    });

    // Send via Pusher to the thread channel
    try {
      await pusherServer.trigger(
        CHANNELS.chat(walkInRequestId),
        EVENTS.CHAT_MESSAGE,
        {
          id: chatMessage.id,
          message: chatMessage.message,
          sender: chatMessage.sender,
          createdAt: chatMessage.createdAt,
          walkInRequestId,
        }
      );

      // Also notify other involved users via their personal chat channel
      // Find all unique senders in this thread + the recipient
      const otherSenders = await prisma.chatMessage.findMany({
        where: { walkInRequestId },
        select: { senderId: true },
        distinct: ["senderId"],
      });
      const involvedUserIds = new Set<string>();
      involvedUserIds.add(walkIn.recipientId);
      for (const s of otherSenders) involvedUserIds.add(s.senderId);
      involvedUserIds.delete(session.user.id);

      for (const userId of involvedUserIds) {
        await pusherServer.trigger(
          CHANNELS.userChat(userId),
          EVENTS.CHAT_INCOMING,
          {
            id: chatMessage.id,
            message: chatMessage.message,
            sender: chatMessage.sender,
            createdAt: chatMessage.createdAt,
            walkInRequestId,
          }
        );
      }
    } catch (pusherError) {
      console.warn("Pusher chat notification failed:", pusherError);
    }

    return NextResponse.json(chatMessage, { status: 201 });
  } catch (error) {
    console.error("Chat message failed:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const walkInRequestId = searchParams.get("walkInRequestId");
  const recent = searchParams.get("recent");

  try {
    if (recent === "true") {
      // Fetch recent messages for current user's walk-in conversations
      const messages = await prisma.chatMessage.findMany({
        where: {
          OR: [
            { senderId: session.user.id },
            { walkInRequest: { recipientId: session.user.id } },
          ],
        },
        include: {
          sender: { select: { id: true, firstName: true, lastName: true, role: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      return NextResponse.json({
        messages: messages.map((m) => ({
          id: m.id,
          message: m.message,
          senderName: `${m.sender.firstName} ${m.sender.lastName}`,
          senderRole: m.sender.role,
          createdAt: m.createdAt,
          walkInRequestId: m.walkInRequestId,
        })),
      });
    }

    if (!walkInRequestId) {
      return NextResponse.json({ error: "Walk-in request ID is required" }, { status: 400 });
    }

    const messages = await prisma.chatMessage.findMany({
      where: { walkInRequestId },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, role: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Failed to fetch messages:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}
