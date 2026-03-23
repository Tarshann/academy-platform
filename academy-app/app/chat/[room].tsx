import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
import { Ionicons } from '@expo/vector-icons';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const ROOM_TITLES: Record<string, string> = {
  general: '#General',
  coaches: '#Coaches',
  parents: '#Parents',
  announcements: '#Announcements',
};

const NOTIF_OPTIONS = [
  { mode: 'all' as const, label: 'All messages' },
  { mode: 'mentions' as const, label: 'Mentions only' },
  { mode: 'none' as const, label: 'Muted' },
];

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

interface RawReaction {
  userId: number;
  emoji: string;
  createdAt: Date;
}

interface ReactionGroup {
  emoji: string;
  count: number;
  userReacted: boolean;
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
  const [rawReactions, setRawReactions] = useState<Record<number, RawReaction[]>>({});
  const flatListRef = useRef<FlatList>(null);
  const typingRef = useRef<{ enter: (data: any) => void; leave: () => void; unsubscribe: () => void } | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Get chat token for sending messages via REST
  const chatTokenQuery = trpc.auth.chatToken.useQuery();
  // Get Ably token for real-time subscription
  const ablyTokenQuery = trpc.auth.ablyToken.useQuery();
  // Get user info for identifying own messages
  const meQuery = trpc.auth.me.useQuery();

  const myUserId = meQuery.data?.id;

  // ─── Chat Enhancement Queries ───
  const utils = trpc.useUtils();
  const markRoomReadMut = trpc.chatEnhanced.markRoomRead.useMutation();
  const addReactionMut = trpc.chatEnhanced.addReaction.useMutation();
  const removeReactionMut = trpc.chatEnhanced.removeReaction.useMutation();
  const setNotifPrefMut = trpc.chatEnhanced.setRoomNotifPref.useMutation();

  // Notification preferences
  const notifPrefsQuery = trpc.chatEnhanced.getRoomNotifPrefs.useQuery();
  const currentNotifMode = notifPrefsQuery.data?.[room!] ?? 'all';

  // Mark room as read when messages load or new ones arrive
  const markRead = useCallback(() => {
    if (!messages.length || !room) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.id) {
      markRoomReadMut.mutate(
        { room, lastMessageId: lastMsg.id },
        {
          onSuccess: () => {
            utils.chatEnhanced.getUnreadCounts.invalidate();
          },
        }
      );
    }
  }, [messages, room]);

  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      markRead();
    }
  }, [messages.length, isLoading]);

  // Fetch reactions for visible messages
  const messageIds = useMemo(
    () => messages.filter((m) => m.id).map((m) => m.id!),
    [messages]
  );

  const reactionsQuery = trpc.chatEnhanced.getReactions.useQuery(
    { messageIds },
    { enabled: messageIds.length > 0, staleTime: 15000 }
  );

  useEffect(() => {
    if (reactionsQuery.data) {
      setRawReactions((prev) => ({ ...prev, ...reactionsQuery.data }));
    }
  }, [reactionsQuery.data]);

  const groupReactions = useCallback(
    (messageId: number): ReactionGroup[] => {
      const raw = rawReactions[messageId];
      if (!raw || raw.length === 0) return [];
      const grouped: Record<string, { count: number; userReacted: boolean }> = {};
      for (const r of raw) {
        if (!grouped[r.emoji]) grouped[r.emoji] = { count: 0, userReacted: false };
        grouped[r.emoji].count++;
        if (r.userId === myUserId) grouped[r.emoji].userReacted = true;
      }
      return Object.entries(grouped).map(([emoji, data]) => ({
        emoji,
        count: data.count,
        userReacted: data.userReacted,
      }));
    },
    [rawReactions, myUserId]
  );

  const handleAddReaction = useCallback(
    (messageId: number, emoji: string) => {
      if (!myUserId || !messageId) return;
      setRawReactions((prev) => {
        const existing = prev[messageId] ?? [];
        if (existing.some((r) => r.userId === myUserId && r.emoji === emoji)) return prev;
        return { ...prev, [messageId]: [...existing, { userId: myUserId, emoji, createdAt: new Date() }] };
      });
      addReactionMut.mutate(
        { messageId, emoji },
        {
          onError: () => {
            setRawReactions((prev) => ({
              ...prev,
              [messageId]: (prev[messageId] ?? []).filter((r) => !(r.userId === myUserId && r.emoji === emoji)),
            }));
          },
        }
      );
    },
    [myUserId]
  );

  const handleRemoveReaction = useCallback(
    (messageId: number, emoji: string) => {
      if (!myUserId || !messageId) return;
      const removed = rawReactions[messageId]?.find((r) => r.userId === myUserId && r.emoji === emoji);
      setRawReactions((prev) => ({
        ...prev,
        [messageId]: (prev[messageId] ?? []).filter((r) => !(r.userId === myUserId && r.emoji === emoji)),
      }));
      removeReactionMut.mutate(
        { messageId, emoji },
        {
          onError: () => {
            if (removed) {
              setRawReactions((prev) => ({ ...prev, [messageId]: [...(prev[messageId] ?? []), removed] }));
            }
          },
        }
      );
    },
    [myUserId, rawReactions]
  );

  const handleNotifPref = useCallback(() => {
    Alert.alert(
      'Notification Preferences',
      `Currently: ${currentNotifMode === 'all' ? 'All messages' : currentNotifMode === 'mentions' ? 'Mentions only' : 'Muted'}`,
      NOTIF_OPTIONS.map((opt) => ({
        text: opt.label,
        onPress: () => {
          setNotifPrefMut.mutate(
            { room: room!, mode: opt.mode },
            {
              onSuccess: () => { notifPrefsQuery.refetch(); },
              onError: () => { Alert.alert('Error', 'Failed to update preference'); },
            }
          );
        },
      }))
    );
  }, [room, currentNotifMode]);

  // Load message history using the chat token
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
      }
    } catch (error) {
      console.error('[Chat] Failed to load history:', error);
    } finally {
      setIsLoading(false);
    }
  }, [room, chatTokenQuery.data?.token]);

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
          if (msg.id && prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      });

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
      };
    }
  }, [room, ablyTokenQuery.data, chatTokenQuery.data?.token, loadHistory]);

  // Listen for reaction_update events from Ably
  useEffect(() => {
    if (!ablyTokenQuery.data) return;
    const client = getAblyClient(async () => ablyTokenQuery.data as any);
    const channel = client.channels.get(`chat:${room}`);

    const handleReactionUpdate = (msg: any) => {
      const data = msg.data;
      if (!data?.messageId || !data?.emoji || !data?.userId) return;
      setRawReactions((prev) => {
        const existing = prev[data.messageId] ?? [];
        if (data.action === 'add') {
          if (existing.some((r: RawReaction) => r.userId === data.userId && r.emoji === data.emoji)) return prev;
          return { ...prev, [data.messageId]: [...existing, { userId: data.userId, emoji: data.emoji, createdAt: new Date() }] };
        } else if (data.action === 'remove') {
          return { ...prev, [data.messageId]: existing.filter((r: RawReaction) => !(r.userId === data.userId && r.emoji === data.emoji)) };
        }
        return prev;
      });
    };

    channel.subscribe('reaction_update', handleReactionUpdate);
    return () => { channel.unsubscribe('reaction_update', handleReactionUpdate); };
  }, [room, ablyTokenQuery.data]);

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
      const result = await uploadChatImage(
        uri,
        chatTokenQuery.data.token,
        (progress) => setUploadProgress(progress)
      );

      const response = await fetch(`${API_URL}/api/chat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: chatTokenQuery.data.token,
          room,
          message: ' ',
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

  const bellIconName = currentNotifMode === 'none'
    ? 'notifications-off-outline'
    : currentNotifMode === 'mentions'
    ? 'notifications-outline'
    : 'notifications';

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
                onPress={handleNotifPref}
                style={styles.headerButton}
                accessibilityLabel="Notification preferences"
                accessibilityRole="button"
              >
                <Ionicons name={bellIconName as any} size={22} color={currentNotifMode === 'none' ? colors.textMuted : colors.gold} />
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
            const reactions = item.id ? groupReactions(item.id) : [];
            return (
              <MessageBubble
                message={item.message}
                senderName={item.userName}
                timestamp={item.createdAt}
                isOwn={isOwn}
                showSender={showSender}
                imageUrl={item.imageUrl}
                reactions={reactions}
                onReact={item.id ? (emoji) => handleAddReaction(item.id!, emoji) : undefined}
                onRemoveReact={item.id ? (emoji) => handleRemoveReaction(item.id!, emoji) : undefined}
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
    gap: 10,
  },
  headerButton: {
    padding: 4,
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
    marginRight: 12,
  },
  statusDotConnected: {
    backgroundColor: '#51cf66',
  },
});
