import Pusher from "pusher";
import PusherJS from "pusher-js";

// Handle CJS/ESM interop for Turbopack
const PusherClient = (PusherJS as unknown as { default?: typeof PusherJS }).default || PusherJS;

// Server-side Pusher instance (lazy singleton)
let _pusherServer: Pusher | null = null;
export function getPusherServer(): Pusher {
  if (!_pusherServer) {
    _pusherServer = new Pusher({
      appId: process.env.PUSHER_APP_ID!,
      key: process.env.PUSHER_KEY!,
      secret: process.env.PUSHER_SECRET!,
      cluster: process.env.PUSHER_CLUSTER!,
      useTLS: true,
    });
  }
  return _pusherServer;
}
// Keep backward compat (getter triggers lazy init on server only)
export const pusherServer = typeof window === "undefined"
  ? (new Proxy({} as Pusher, {
      get: (_t, prop) => {
        const instance = getPusherServer();
        const val = (instance as unknown as Record<string, unknown>)[prop as string];
        return typeof val === "function" ? val.bind(instance) : val;
      },
    }))
  : ({} as Pusher);

// Client-side Pusher instance (lazy — only connects when first accessed)
type PusherClientInstance = InstanceType<typeof PusherClient>;
let _pusherClient: PusherClientInstance | null = null;
export function getPusherClient(): PusherClientInstance {
  if (!_pusherClient && typeof window !== "undefined") {
    _pusherClient = new PusherClient(
      process.env.NEXT_PUBLIC_PUSHER_KEY!,
      {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
        channelAuthorization: {
          endpoint: "/api/pusher/auth",
          transport: "ajax",
        },
        enabledTransports: ["ws", "wss"],
      }
    );
  }
  return _pusherClient!;
}
export const pusherClient = typeof window !== "undefined"
  ? new Proxy({} as PusherClientInstance, {
      get: (_t, prop) => {
        const client = getPusherClient();
        const val = (client as unknown as Record<string, unknown>)[prop as string];
        return typeof val === "function" ? val.bind(client) : val;
      },
    })
  : ({} as PusherClientInstance);

// Channel names
export const CHANNELS = {
  walkInRequest: (userId: string) => `private-walkin-${userId}`,
  chat: (requestId: string) => `private-chat-${requestId}`,
  userChat: (userId: string) => `private-user-chat-${userId}`,
  notifications: (userId: string) => `private-notifications-${userId}`,
  security: "private-security-dashboard",
} as const;

// Event names
export const EVENTS = {
  WALKIN_REQUEST: "walkin:new-request",
  WALKIN_DECISION: "walkin:decision",
  CHAT_MESSAGE: "chat:new-message",
  CHAT_INCOMING: "chat:incoming",
  NOTIFICATION: "notification:new",
  VISITOR_CHECKIN: "visitor:checkin",
  VISITOR_CHECKOUT: "visitor:checkout",
} as const;
