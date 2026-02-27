import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Text,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { trpc } from '../../lib/trpc';
import { getAblyClient, subscribeToDm } from '../../lib/realtime';
import { MessageBubble } from '../../components/MessageBubble';
import { ChatInput } from '../../components/ChatInput';
import { trackEvent } from '../../lib/analytics';
import {
  uploadChatImage,
  isDmImageMessage,
  extractDmImageUrl,
  type UploadProgress,
  type ImageSource,
} from '../../lib/chat-images';

const ACADEMY_GOLD = '#CFB87C';

interface DmMessage {
  id: number;
  conversationId: number;
  senderId: number;
  senderName: string;
  content: string;
  imageUrl?: string | null;
  createdAt: string;
}

export default function DmConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const conversationId = Number(id);

  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
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

  // Chat token for image upload endpoint
  const chatTokenQuery = trpc.auth.chatToken.useQuery();

  // Send DM mutation
  const sendMessage = trpc.dm.sendMessage.useMutation({
    onSuccess: () => {
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
      markAsRead.mutate({ conversationId });
    });

    return () => {
      unsubscribe();
    };
  }, [ablyTokenQuery.data, conversationId]);

  // Combine fetched messages with real-time messages
  const allMessages = useCallback(() => {
    const fetched = ([...(messagesQuery.data ?? [])] as DmMessage[]).reverse();
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
      trackEvent('coach_message_sent', {
        conversation_id: conversationId,
        channel: 'dm',
      });
    } catch (error) {
      console.error('[DM] Send failed:', error);
    } finally {
      setIsSending(false);
    }
  };

  // Send image in DM: upload then send URL in content with prefix
  const handleImageSend = async (uri: string, source: ImageSource) => {
    if (!chatTokenQuery.data?.token || !conversationId) return;

    setIsUploading(true);
    setUploadProgress(null);

    try {
      // Upload image using the chat upload endpoint
      const result = await uploadChatImage(
        uri,
        chatTokenQuery.data.token,
        (progress) => setUploadProgress(progress)
      );

      // Send as DM with native imageUrl field
      await sendMessage.mutateAsync({
        conversationId,
        content: ' ',
        imageUrl: result.url,
      });

      trackEvent('chat_image_upload_success', { room: 'dm', source });
    } catch (error) {
      const reason =
        error instanceof Error && error.message.includes('too large')
          ? 'size_limit'
          : error instanceof Error && error.message.includes('Network')
          ? 'network'
          : 'server_error';

      trackEvent('chat_image_upload_failed', { room: 'dm', reason });

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

  /**
   * Extract image URL from message — native field first, then legacy [image] prefix fallback.
   */
  const getMessageProps = (item: DmMessage) => {
    // Native imageUrl field (new format)
    if (item.imageUrl) {
      return {
        message: item.content === ' ' ? ' ' : item.content,
        imageUrl: item.imageUrl,
      };
    }
    // Legacy: [image]<url> prefix in content (backward compat for pre-update messages)
    if (isDmImageMessage(item.content)) {
      return {
        message: ' ',
        imageUrl: extractDmImageUrl(item.content),
      };
    }
    return {
      message: item.content,
      imageUrl: undefined,
    };
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
            const { message, imageUrl } = getMessageProps(item);
            return (
              <MessageBubble
                message={message}
                senderName={item.senderName}
                timestamp={item.createdAt}
                isOwn={isOwn}
                showSender={showSender}
                imageUrl={imageUrl}
              />
            );
          }}
        />
        <ChatInput
          onSend={handleSend}
          onImageSend={handleImageSend}
          disabled={isSending}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
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
