import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = session.user.id;

    // Fetch all conversations where user is a participant
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
      include: {
        user1: { select: { id: true, firstName: true, lastName: true, role: true, image: true } },
        user2: { select: { id: true, firstName: true, lastName: true, role: true, image: true } },
        messages: {
          where: { isRead: false, recipientId: userId },
          select: { id: true },
        },
      },
      orderBy: { lastAt: "desc" },
    });

    // Format for frontend
    const formatted = conversations.map((c) => {
      const otherUser = c.user1Id === userId ? c.user2 : c.user1;
      return {
        id: c.id,
        type: "direct" as const,
        otherUser,
        lastMessage: c.lastMessage,
        lastAt: c.lastAt,
        unreadCount: c.messages.length,
      };
    });

    // Also fetch walk-in threads where user is recipient or sender
    const walkInThreads = await prisma.walkInRequest.findMany({
      where: {
        OR: [
          { recipientId: userId },
          { chatMessages: { some: { senderId: userId } } },
        ],
        chatMessages: { some: {} },
      },
      include: {
        visitor: { select: { firstName: true, lastName: true } },
        recipient: { select: { id: true, firstName: true, lastName: true, role: true } },
        chatMessages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { message: true, createdAt: true, isRead: true, senderId: true },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
    });

    const walkInFormatted = walkInThreads.map((w) => {
      const lastMsg = w.chatMessages[0];
      const unread = lastMsg && !lastMsg.isRead && lastMsg.senderId !== userId ? 1 : 0;
      return {
        id: w.id,
        type: "walkin" as const,
        visitorName: `${w.visitor.firstName} ${w.visitor.lastName}`,
        recipient: w.recipient,
        purpose: w.purpose,
        decision: w.decision,
        lastMessage: lastMsg?.message || null,
        lastAt: lastMsg?.createdAt || w.createdAt,
        unreadCount: unread,
      };
    });

    return NextResponse.json({
      direct: formatted,
      walkin: walkInFormatted,
    });
  } catch (error) {
    console.error("Failed to fetch conversations:", error);
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
  }
}
