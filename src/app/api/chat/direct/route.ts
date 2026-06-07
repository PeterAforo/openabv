import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { pusherServer, CHANNELS, EVENTS } from "@/lib/pusher";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { recipientId, message, conversationId } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    if (!recipientId && !conversationId) {
      return NextResponse.json({ error: "recipientId or conversationId required" }, { status: 400 });
    }

    const senderId = session.user.id;
    let convo;

    if (conversationId) {
      // Use existing conversation
      convo = await prisma.conversation.findUnique({ where: { id: conversationId } });
      if (!convo) {
        return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
      }
    } else {
      // Find or create conversation (always store user1 < user2 for uniqueness)
      const [u1, u2] = [senderId, recipientId].sort();
      convo = await prisma.conversation.upsert({
        where: { user1Id_user2Id: { user1Id: u1, user2Id: u2 } },
        update: {},
        create: { user1Id: u1, user2Id: u2 },
      });
    }

    // Determine recipient
    const actualRecipientId = convo.user1Id === senderId ? convo.user2Id : convo.user1Id;

    // Create the message
    const dm = await prisma.directMessage.create({
      data: {
        conversationId: convo.id,
        senderId,
        recipientId: actualRecipientId,
        message: message.trim(),
      },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, role: true } },
      },
    });

    // Update conversation lastMessage
    await prisma.conversation.update({
      where: { id: convo.id },
      data: { lastMessage: message.trim(), lastAt: new Date() },
    });

    // Notify recipient via Pusher
    try {
      await pusherServer.trigger(
        CHANNELS.userChat(actualRecipientId),
        EVENTS.CHAT_INCOMING,
        {
          id: dm.id,
          message: dm.message,
          sender: dm.sender,
          createdAt: dm.createdAt,
          conversationId: convo.id,
          type: "direct",
        }
      );
    } catch (e) {
      console.warn("Pusher DM notification failed:", e);
    }

    return NextResponse.json(dm, { status: 201 });
  } catch (error) {
    console.error("Direct message failed:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");

    if (!conversationId) {
      return NextResponse.json({ error: "conversationId required" }, { status: 400 });
    }

    // Verify user is participant
    const convo = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!convo || (convo.user1Id !== session.user.id && convo.user2Id !== session.user.id)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const messages = await prisma.directMessage.findMany({
      where: { conversationId },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, role: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    // Mark unread messages as read
    await prisma.directMessage.updateMany({
      where: {
        conversationId,
        recipientId: session.user.id,
        isRead: false,
      },
      data: { isRead: true },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Failed to fetch direct messages:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
