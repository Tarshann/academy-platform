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
import { trpc } from '../../lib/trpc';
import { getAblyClient, subscribeToDm } from '../../lib/realtime';
import { MessageBubble } from '../../components/MessageBubble';
import { ChatInput } from '../../components/ChatInput';

const ACADEMY_GOLD = '#CFB87C';

interface DmMessage {
  id: number;
  conversationId: number;
  senderId: number;
  senderName: string;
  content: string;
  createdAt: string;
}

export default function DmConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const conversationId = Number(id);

  const [isSending, setIsSending] = useState(false);
  const [connected, setConnected] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const meQuery = trpc.auth.me.useQuery();
  const myUserId = meQuery.data?.id;

  // Fetch DM messages
  const messagesQuery = trpc.dm.getMessages.useQuery(
    { conversationId, limit: 50 },
    { enabled: !!conversationId }
  );

  // Ably token for real-time
  const ablyTokenQuery = trpc.auth.ablyToken.useQuery();

  // Send DM mutation
  const sendMessage = trpc.dm.sendMessage.useMutation({
    onSuccess: () => {
      // If no Ably, refetch messages manually
      if (!connected) {
        messagesQuery.refetch();
      }
    },
  });

  // Mark as read mutation
  const markAsRead = trpc.dm.markAsRead.useMutation();

  // Real-time messages from Ably
  const [realtimeMessages, setRealtimeMessages] = useState<DmMessage[]>([]);

  // Mark conversation as read when opened
  useEffect(() => {
    if (conversationId) {
      markAsRead.mutate({ conversationId });
    }
  }, [conversationId]);

  // Set up Ably subscription
  useEffect(() => {
    if (!ablyTokenQuery.data || !conversationId) return;

    const client = getAblyClient(async () => ablyTokenQuery.data as any);

    client.connection.on('connected', () => setConnected(true));
    client.connection.on('disconnected', () => setConnected(false));

    if (client.connection.state === 'connected') {
      setConnected(true);
    }

    const unsubscribe = subscribeToDm(client, conversationId, (msg: DmMessage) => {
      setRealtimeMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      // Mark as read when receiving new messages
      markAsRead.mutate({ conversationId });
    });

    return () => {
      unsubscribe();
    };
  }, [ablyTokenQuery.data, conversationId]);

  // Combine fetched messages with real-time messages
  const allMessages = useCallback(() => {
    const fetched = (messagesQuery.data ?? []) as DmMessage[];
    const fetchedIds = new Set(fetched.map((m) => m.id));
    const newRealtime = realtimeMessages.filter((m) => !fetchedIds.has(m.id));
    return [...fetched, ...newRealtime];
  }, [messagesQuery.data, realtimeMessages]);

  const messages = allMessages();

  const handleSend = async (text: string) => {
    if (isSending || !conversationId) return;
    setIsSending(true);
    try {
      await sendMessage.mutateAsync({
        conversationId,
        content: text,
      });
    } catch (error) {
      console.error('[DM] Send failed:', error);
    } finally {
      setIsSending(false);
    }
  };

  if (messagesQuery.isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Conversation' }} />
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
          title: 'Conversation',
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
          keyExtractor={(item) => String(item.id)}
          style={styles.messageList}
          contentContainerStyle={styles.messageContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Send a message to start the conversation</Text>
            </View>
          }
          renderItem={({ item, index }) => {
            const isOwn = item.senderId === myUserId;
            const showSender = index === 0 || messages[index - 1]?.senderId !== item.senderId;
            return (
              <MessageBubble
                message={item.content}
                senderName={item.senderName}
                timestamp={item.createdAt}
                isOwn={isOwn}
                showSender={showSender}
              />
            );
          }}
        />
        <ChatInput
          onSend={handleSend}
          disabled={isSending}
          placeholder="Type a message..."
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
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyText: {
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
