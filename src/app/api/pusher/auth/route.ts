import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPusherServer } from "@/lib/pusher";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.text();
    const params = new URLSearchParams(body);
    const socketId = params.get("socket_id");
    const channelName = params.get("channel_name");

    if (!socketId || !channelName) {
      return NextResponse.json(
        { error: "Missing socket_id or channel_name" },
        { status: 400 }
      );
    }

    const pusher = getPusherServer();
    const authResponse = pusher.authorizeChannel(socketId, channelName);

    return NextResponse.json(authResponse);
  } catch (error) {
    console.error("Pusher auth failed:", error);
    return NextResponse.json({ error: "Auth failed" }, { status: 500 });
  }
}
