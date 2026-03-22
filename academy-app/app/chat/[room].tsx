import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { trpc } from '../../lib/trpc';
import { getAblyClient, subscribeToChatRoom, subscribeToTyping } from '../../lib/realtime';
import { MessageBubble } from '../../components/MessageBubble';
import { ChatInput } from '../../components/ChatInput';
import { TypingIndicator } from '../../components/TypingIndicator';
import { trackEvent } from '../../lib/analytics';
import {
  uploadChatImage,
  type UploadProgress,
  type ImageSource,
} from '../../lib/chat-images';
import { trackMessageSent } from '../../lib/rating-prompt';
import { colors } from '../../lib/theme';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const ROOM_TITLES: Record<string, string> = {
  general: '#General',
  coaches: '#Coaches',
  parents: '#Parents',
  announcements: '#Announcements',
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

interface Reaction {
  userId: number;
  emoji: string;
}

export default function ChatRoomScreen() {
  const { room } = useLocalSearchParams<{ room: string }>();
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [connected, setConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<{ userId: number; name: string }[]>([]);
  const [messageReactions, setMessageReactions] = useState<Record<number, Reaction[]>>({});
  const flatListRef = useRef<FlatList>(null);
  const typingRef = useRef<{ enter: (data: any) => void; leave: () => void; unsubscribe: () => void } | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Get chat token for sending messages via REST
  const chatTokenQuery = trpc.auth.chatToken.useQuery();
  // Get Ably token for real-time subscription
  const ablyTokenQuery = trpc.auth.ablyToken.useQuery();
  // Get user info for identifying own messages
  const meQuery = trpc.auth.me.useQuery();

  // Reactions mutations
  const addReactionMutation = trpc.chatEnhanced.addReaction.useMutation();
  const removeReactionMutation = trpc.chatEnhanced.removeReaction.useMutation();
  const getReactionsMutation = trpc.chatEnhanced.getReactions.useQuery(
    { messageIds: messages.filter((m) => m.id).map((m) => m.id!) },
    { enabled: messages.length > 0 }
  );

  // Mark room as read mutation
  const markRoomReadMutation = trpc.chatEnhanced.markRoomRead.useMutation();

  // Room notification preferences
  const getRoomNotifPrefQuery = trpc.chatEnhanced.getRoomNotifPrefs.useQuery({ room: room! }, { enabled: !!room });
  const setRoomNotifPrefMutation = trpc.chatEnhanced.setRoomNotifPref.useMutation();

  const myUserId = meQuery.data?.id;
  const currentNotifPref = getRoomNotifPrefQuery.data?.[room!] || 'all';

  // Load message history using the chat token (same token type the server expects)
  const loadHistory = useCallback(async (token?: string) => {
    const chatToken = token || chatTokenQuery.data?.token;
    if (!chatToken) return;
    try {
      const response = await fetch(`${API_URL}/api/chat/history/${room}?limit=50`, {
        headers: { Authorization: `Bearer ${chatToken}` },
      });
      if (response.ok) {
        const history = await response.json();
        setMessages(history);

        // Mark room as read with the last message ID
        if (history.length > 0) {
          const lastMessage = history[history.length - 1];
          if (lastMessage.id) {
            markRoomReadMutation.mutate(
              { room: room!, lastMessageId: lastMessage.id },
              { onError: (err) => console.error('[Chat] Failed to mark read:', err) }
            );
          }
        }
      }
    } catch (error) {
      console.error('[Chat] Failed to load history:', error);
    } finally {
      setIsLoading(false);
    }
  }, [room, chatTokenQuery.data?.token, markRoomReadMutation]);

  // Update reactions when getReactionsMutation data changes
  useEffect(() => {
    if (getReactionsMutation.data) {
      setMessageReactions(getReactionsMutation.data);
    }
  }, [getReactionsMutation.data]);

  // Initialize: load history + connect Ably
  useEffect(() => {
    if (chatTokenQuery.data?.token) {
      loadHistory(chatTokenQuery.data.token);
    }

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
          const updated = [...prev, msg];
          // Mark room as read with the new message ID
          if (msg.id) {
            markRoomReadMutation.mutate(
              { room: room!, lastMessageId: msg.id },
              { onError: (err) => console.error('[Chat] Failed to mark read:', err) }
            );
          }
          return updated;
        });
      });

      // Subscribe to typing presence
      const typing = subscribeToTyping(
        client,
        `chat:${room}`,
        (members) => setTypingUsers(members)
      );
      typingRef.current = typing;

      return () => {
        unsubscribe();
        typing.unsubscribe();
        // Don't call closeAbly() — it destroys the global singleton which
        // breaks Ably for other screens (chat tab, DM conversations).
        // Just unsubscribe from this room's channel.
      };
    }
  }, [room, ablyTokenQuery.data, chatTokenQuery.data?.token, loadHistory, markRoomReadMutation]);

  // Send text message via REST (server will publish to Ably)
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

      if (room === 'coaches') {
        trackEvent('coach_message_sent', { room });
      }
      trackMessageSent();

      const result = await response.json();
      if (result.message) {
        setMessages((prev) => {
          if (result.message.id && prev.some((m: ChatMessage) => m.id === result.message.id)) return prev;
          return [...prev, result.message];
        });
      }
    } catch (error) {
      console.error('[Chat] Send failed:', error);
    } finally {
      setIsSending(false);
    }
  };

  // Send image message: upload then send with imageUrl
  const handleImageSend = async (uri: string, source: ImageSource) => {
    if (!chatTokenQuery.data?.token) return;

    setIsUploading(true);
    setUploadProgress(null);

    try {
      // Upload image
      const result = await uploadChatImage(
        uri,
        chatTokenQuery.data.token,
        (progress) => setUploadProgress(progress)
      );

      // Send message with image URL
      const response = await fetch(`${API_URL}/api/chat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: chatTokenQuery.data.token,
          room,
          message: ' ', // Minimal message (required by server)
          imageUrl: result.url,
          imageKey: result.key,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send image message');
      }

      trackEvent('chat_image_upload_success', { room: room!, source });

      const sendResult = await response.json();
      if (sendResult.message) {
        setMessages((prev) => {
          if (sendResult.message.id && prev.some((m: ChatMessage) => m.id === sendResult.message.id)) return prev;
          return [...prev, sendResult.message];
        });
      }
    } catch (error) {
      const reason =
        error instanceof Error && error.message.includes('too large')
          ? 'size_limit'
          : error instanceof Error && error.message.includes('Network')
          ? 'network'
          : 'server_error';

      trackEvent('chat_image_upload_failed', { room: room!, reason });

      Alert.alert(
        'Upload Failed',
        error instanceof Error ? error.message : 'Failed to send image. Please try again.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Retry', onPress: () => handleImageSend(uri, source) },
        ]
      );
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const handleNotificationPrefPress = () => {
    Alert.alert(
      'Notifications',
      'Choose notification preference for this channel',
      [
        {
          text: 'All messages',
          onPress: () => {
            setRoomNotifPrefMutation.mutate({ room: room!, mode: 'all' });
          },
        },
        {
          text: 'Mentions only',
          onPress: () => {
            setRoomNotifPrefMutation.mutate({ room: room!, mode: 'mentions' });
          },
        },
        {
          text: 'None',
          onPress: () => {
            setRoomNotifPrefMutation.mutate({ room: room!, mode: 'none' });
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const getBellIcon = (): keyof typeof Ionicons.glyphMap => {
    switch (currentNotifPref) {
      case 'none':
        return 'bell-off-outline';
      case 'mentions':
        return 'notifications-outline';
      default:
        return 'bell-outline';
    }
  };

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{
          title: ROOM_TITLES[room!] || `#${room}`,
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.textPrimary,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 8, padding: 4 }} accessibilityLabel="Go back" accessibilityRole="button">
              <Text style={{ color: colors.textPrimary, fontSize: 16 }}>← Back</Text>
            </TouchableOpacity>
          ),
        }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.gold} />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: ROOM_TITLES[room!] || `#${room}`,
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.textPrimary,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 8, padding: 4 }} accessibilityLabel="Go back" accessibilityRole="button">
              <Text style={{ color: colors.textPrimary, fontSize: 16 }}>← Back</Text>
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={styles.headerRight}>
              <TouchableOpacity
                onPress={handleNotificationPrefPress}
                style={styles.bellButton}
                accessibilityLabel="Notification preferences"
                accessibilityRole="button"
              >
                <Ionicons
                  name={getBellIcon()}
                  size={20}
                  color={colors.gold}
                />
              </TouchableOpacity>
              <View style={[styles.statusDot, connected && styles.statusDotConnected]} />
            </View>
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
            const reactions = item.id ? messageReactions[item.id] || [] : [];
            return (
              <MessageBubble
                message={item.message}
                senderName={item.userName}
                timestamp={item.createdAt}
                isOwn={isOwn}
                showSender={showSender}
                imageUrl={item.imageUrl}
                reactions={reactions}
                currentUserId={myUserId}
                onReact={(emoji) => {
                  if (!item.id || !myUserId) return;
                  addReactionMutation.mutate(
                    { messageId: item.id, emoji },
                    {
                      onSuccess: () => {
                        // Optimistic update
                        setMessageReactions((prev) => ({
                          ...prev,
                          [item.id!]: [
                            ...(prev[item.id!] || []),
                            { userId: myUserId, emoji },
                          ],
                        }));
                      },
                    }
                  );
                }}
                onRemoveReact={(emoji) => {
                  if (!item.id || !myUserId) return;
                  removeReactionMutation.mutate(
                    { messageId: item.id, emoji },
                    {
                      onSuccess: () => {
                        // Optimistic update
                        setMessageReactions((prev) => ({
                          ...prev,
                          [item.id!]: (prev[item.id!] || []).filter(
                            (r) => !(r.userId === myUserId && r.emoji === emoji)
                          ),
                        }));
                      },
                    }
                  );
                }}
              />
            );
          }}
        />
        <TypingIndicator typingUsers={typingUsers} myUserId={myUserId} />
        <ChatInput
          onSend={handleSend}
          onImageSend={handleImageSend}
          onTyping={() => {
            if (!typingRef.current || !myUserId || !meQuery.data?.name) return;
            typingRef.current.enter({ userId: myUserId, name: meQuery.data.name });
            if (typingTimer.current) clearTimeout(typingTimer.current);
            typingTimer.current = setTimeout(() => {
              typingRef.current?.leave();
            }, 3000);
          }}
          disabled={isSending || !chatTokenQuery.data?.token}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
          placeholder={`Message ${ROOM_TITLES[room!] || `#${room}`}...`}
        />
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
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
    color: colors.textPrimary,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginRight: 8,
  },
  bellButton: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff6b6b',
  },
  statusDotConnected: {
    backgroundColor: '#51cf66',
  },
});
