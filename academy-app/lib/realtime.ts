import * as Ably from 'ably';

let ablyClient: Ably.Realtime | null = null;

/**
 * Initialize Ably Realtime client with token auth from the server.
 * Call this after the user is authenticated.
 */
export function getAblyClient(fetchToken: () => Promise<Ably.TokenRequest>): Ably.Realtime {
  if (ablyClient && ablyClient.connection.state !== 'closed' && ablyClient.connection.state !== 'failed') {
    return ablyClient;
  }

  ablyClient = new Ably.Realtime({
    authCallback: async (_params, callback) => {
      try {
        const tokenRequest = await fetchToken();
        callback(null, tokenRequest);
      } catch (error) {
        callback(error as Error, null);
      }
    },
  });

  return ablyClient;
}

/**
 * Close the Ably connection and clean up.
 */
export function closeAbly() {
  if (ablyClient) {
    ablyClient.close();
    ablyClient = null;
  }
}

/**
 * Subscribe to a chat channel for real-time messages.
 * Returns an unsubscribe function.
 */
export function subscribeToChatRoom(
  client: Ably.Realtime,
  room: string,
  onMessage: (message: any) => void
): () => void {
  const channel = client.channels.get(`chat:${room}`);
  channel.subscribe('message', (msg) => {
    onMessage(msg.data);
  });
  return () => {
    channel.unsubscribe();
  };
}

/**
 * Subscribe to a DM conversation for real-time messages and read receipts.
 * Returns an unsubscribe function.
 */
export function subscribeToDm(
  client: Ably.Realtime,
  conversationId: number,
  onMessage: (message: any) => void,
  onRead?: (data: { readBy: number; timestamp: number }) => void
): () => void {
  const channel = client.channels.get(`dm:${conversationId}`);
  channel.subscribe('message', (msg) => {
    onMessage(msg.data);
  });
  if (onRead) {
    channel.subscribe('read', (msg) => {
      onRead(msg.data);
    });
  }
  return () => {
    channel.unsubscribe();
  };
}

/**
 * Publish a read receipt on a DM channel.
 * Called when a user opens/views a conversation.
 */
export function publishDmReadReceipt(
  client: Ably.Realtime,
  conversationId: number,
  userId: number
) {
  const channel = client.channels.get(`dm:${conversationId}`);
  channel.publish('read', { readBy: userId, timestamp: Date.now() });
}

/**
 * Subscribe to typing events on a channel.
 * Uses Ably presence for enter/leave (typing start/stop).
 * Returns { enter, leave, unsubscribe }.
 */
export function subscribeToTyping(
  client: Ably.Realtime,
  channelName: string,
  onTypingChange: (members: { userId: number; name: string }[]) => void
): { enter: (data: { userId: number; name: string }) => void; leave: () => void; unsubscribe: () => void } {
  const channel = client.channels.get(channelName);

  const updateMembers = () => {
    channel.presence.get((err, members) => {
      if (err || !members) {
        onTypingChange([]);
        return;
      }
      const typingMembers = members.map((m) => m.data as { userId: number; name: string });
      onTypingChange(typingMembers);
    });
  };

  channel.presence.subscribe('enter', updateMembers);
  channel.presence.subscribe('leave', updateMembers);

  return {
    enter: (data) => channel.presence.enter(data),
    leave: () => channel.presence.leave(),
    unsubscribe: () => {
      channel.presence.unsubscribe();
      channel.presence.leave();
    },
  };
}
