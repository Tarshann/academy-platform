import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Text,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { trpc } from '../../lib/trpc';
import { getAblyClient, subscribeToChatRoom, closeAbly } from '../../lib/realtime';
import { MessageBubble } from '../../components/MessageBubble';
import { ChatInput } from '../../components/ChatInput';

const ACADEMY_GOLD = '#CFB87C';
const API_URL = process.env.EXPO_PUBLIC_API_URL || '';

const ROOM_TITLES: Record<string, string> = {
  general: '#General',
  announcements: '#Announcements',
  parents: '#Parents',
  coaches: '#Coaches',
};

interface ChatMessage {
  id?: number;
  userId: number;
  userName: string;
  message: string;
  room?: string;
  imageUrl?: string | null;
  mentions?: number[] | null;
  createdAt: string;
}

export default function ChatRoomScreen() {
  const { room } = useLocalSearchParams<{ room: string }>();
  const { getToken, userId: clerkUserId } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [connected, setConnected] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Get chat token for sending messages via REST
  const chatTokenQuery = trpc.auth.chatToken.useQuery();
  // Get Ably token for real-time subscription
  const ablyTokenQuery = trpc.auth.ablyToken.useQuery();
  // Get user info for identifying own messages
  const meQuery = trpc.auth.me.useQuery();

  const myUserId = meQuery.data?.id;

  // Load message history
  const loadHistory = useCallback(async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/api/chat/history/${room}?limit=50`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (response.ok) {
        const history = await response.json();
        setMessages(history);
      }
    } catch (error) {
      console.error('[Chat] Failed to load history:', error);
    } finally {
      setIsLoading(false);
    }
  }, [room, getToken]);

  // Initialize: load history + connect Ably
  useEffect(() => {
    loadHistory();

    if (ablyTokenQuery.data) {
      const client = getAblyClient(async () => ablyTokenQuery.data as any);

      client.connection.on('connected', () => setConnected(true));
      client.connection.on('disconnected', () => setConnected(false));
      client.connection.on('failed', () => setConnected(false));

      if (client.connection.state === 'connected') {
        setConnected(true);
      }

      const unsubscribe = subscribeToChatRoom(client, room!, (msg: ChatMessage) => {
        setMessages((prev) => {
          // Deduplicate
          if (msg.id && prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      });

      return () => {
        unsubscribe();
      };
    }
  }, [room, ablyTokenQuery.data, loadHistory]);

  // Send message via REST (server will publish to Ably)
  const handleSend = async (text: string) => {
    if (!chatTokenQuery.data?.token || isSending) return;

    setIsSending(true);
    try {
      const response = await fetch(`${API_URL}/api/chat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: chatTokenQuery.data.token,
          room,
          message: text,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      // If not connected to Ably, manually add the message
      if (!connected) {
        const result = await response.json();
        if (result.message) {
          setMessages((prev) => {
            if (result.message.id && prev.some((m: ChatMessage) => m.id === result.message.id)) return prev;
            return [...prev, result.message];
          });
        }
      }
    } catch (error) {
      console.error('[Chat] Send failed:', error);
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: ROOM_TITLES[room!] || `#${room}` }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={ACADEMY_GOLD} />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: ROOM_TITLES[room!] || `#${room}`,
          headerStyle: { backgroundColor: '#1a1a2e' },
          headerTintColor: '#fff',
          headerRight: () => (
            <View style={[styles.statusDot, connected && styles.statusDotConnected]} />
          ),
        }}
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item, index) => item.id ? String(item.id) : `msg-${index}`}
          style={styles.messageList}
          contentContainerStyle={styles.messageContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>Welcome to {ROOM_TITLES[room!] || `#${room}`}</Text>
              <Text style={styles.emptySubtitle}>Be the first to send a message!</Text>
            </View>
          }
          renderItem={({ item, index }) => {
            const isOwn = item.userId === myUserId;
            const showSender = index === 0 || messages[index - 1]?.userId !== item.userId;
            return (
              <MessageBubble
                message={item.message}
                senderName={item.userName}
                timestamp={item.createdAt}
                isOwn={isOwn}
                showSender={showSender}
                imageUrl={item.imageUrl}
              />
            );
          }}
        />
        <ChatInput
          onSend={handleSend}
          disabled={isSending || !chatTokenQuery.data?.token}
          placeholder={`Message ${ROOM_TITLES[room!] || `#${room}`}...`}
        />
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  messageList: {
    flex: 1,
  },
  messageContent: {
    paddingVertical: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#888',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff6b6b',
    marginRight: 12,
  },
  statusDotConnected: {
    backgroundColor: '#51cf66',
  },
});
