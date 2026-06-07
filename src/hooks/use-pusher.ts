"use client";

import { useEffect, useRef } from "react";
import { getPusherClient } from "@/lib/pusher";
import type { Channel } from "pusher-js";

export function usePusherChannel(channelName: string) {
  const channelRef = useRef<Channel | null>(null);

  useEffect(() => {
    if (!channelName || channelName === "disabled-channel") return;
    const client = getPusherClient();
    const channel = client.subscribe(channelName);
    channelRef.current = channel;

    return () => {
      client.unsubscribe(channelName);
      channelRef.current = null;
    };
  }, [channelName]);

  return channelRef.current;
}

export function usePusherEvent(
  channelName: string,
  eventName: string,
  callback: (data: unknown) => void
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!channelName || channelName === "disabled-channel") return;
    const client = getPusherClient();
    const channel = client.subscribe(channelName);

    const handler = (data: unknown) => {
      callbackRef.current(data);
    };

    channel.bind(eventName, handler);

    return () => {
      channel.unbind(eventName, handler);
      client.unsubscribe(channelName);
    };
  }, [channelName, eventName]);
}
