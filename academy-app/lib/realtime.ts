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
 * Subscribe to a DM conversation for real-time messages.
 * Returns an unsubscribe function.
 */
export function subscribeToDm(
  client: Ably.Realtime,
  conversationId: number,
  onMessage: (message: any) => void
): () => void {
  const channel = client.channels.get(`dm:${conversationId}`);
  channel.subscribe('message', (msg) => {
    onMessage(msg.data);
  });
  return () => {
    channel.unsubscribe();
  };
}
