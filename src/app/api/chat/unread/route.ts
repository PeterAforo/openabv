import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Count unread walk-in chat messages
    const walkinUnread = await prisma.chatMessage.count({
      where: {
        isRead: false,
        senderId: { not: session.user.id },
        OR: [
          { walkInRequest: { recipientId: session.user.id } },
          {
            walkInRequest: {
              chatMessages: {
                some: { senderId: session.user.id },
              },
            },
          },
        ],
      },
    });

    // Count unread direct messages
    const directUnread = await prisma.directMessage.count({
      where: {
        recipientId: session.user.id,
        isRead: false,
      },
    });

    return NextResponse.json({ unreadCount: walkinUnread + directUnread });
  } catch (error) {
    console.error("Failed to fetch unread count:", error);
    return NextResponse.json({ unreadCount: 0 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { walkInRequestId } = body;

    if (!walkInRequestId) {
      return NextResponse.json({ error: "walkInRequestId required" }, { status: 400 });
    }

    // Mark all messages in this thread as read (except own messages)
    await prisma.chatMessage.updateMany({
      where: {
        walkInRequestId,
        senderId: { not: session.user.id },
        isRead: false,
      },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to mark messages read:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
