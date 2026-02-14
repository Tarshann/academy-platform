import { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { trpc } from '../../lib/trpc';
import { Loading } from '../../components/Loading';

const ACADEMY_GOLD = '#CFB87C';

export default function MessagesScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const conversations = trpc.dm.getConversations.useQuery();
  const availableUsers = trpc.dm.getAvailableUsers.useQuery();
  const startConversation = trpc.dm.startConversation.useMutation({
    onSuccess: (data: any) => {
      router.push(`/dm/${data.id}`);
    },
    onError: (error) => {
      Alert.alert('Error', error.message);
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await conversations.refetch();
    setRefreshing(false);
  };

  const onNewMessage = () => {
    if (!availableUsers.data || availableUsers.data.length === 0) {
      Alert.alert('No Users', 'No users are available to message.');
      return;
    }

    const buttons = availableUsers.data.slice(0, 5).map((user: any) => ({
      text: user.name || `User ${user.id}`,
      onPress: () => startConversation.mutate({ recipientId: user.id }),
    }));
    buttons.push({ text: 'Cancel', onPress: () => {} });

    Alert.alert('New Conversation', 'Select a user to message:', buttons);
  };

  if (conversations.isLoading) return <Loading />;

  const convos = conversations.data ?? [];

  return (
    <View style={styles.container}>
      <FlatList
        data={convos}
        keyExtractor={(item: any) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <TouchableOpacity style={styles.newMessageButton} onPress={onNewMessage}>
            <Ionicons name="create-outline" size={20} color="#fff" />
            <Text style={styles.newMessageText}>New Conversation</Text>
          </TouchableOpacity>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubble-ellipses-outline" size={48} color="#ccc" />
            <Text style={styles.emptyTitle}>No Conversations</Text>
            <Text style={styles.emptySubtitle}>
              Start a conversation with a coach or parent
            </Text>
          </View>
        }
        renderItem={({ item }: { item: any }) => {
          const otherParticipant = item.participants?.find(
            (p: any) => p.userId !== item.currentUserId
          );
          const displayName = otherParticipant?.userName || 'Unknown';
          const lastMsg = item.lastMessage;
          const hasUnread = item.unreadCount > 0;

          return (
            <TouchableOpacity
              style={[styles.conversationCard, hasUnread && styles.unreadCard]}
              onPress={() => router.push(`/dm/${item.id}`)}
              activeOpacity={0.7}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {displayName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.conversationInfo}>
                <View style={styles.conversationHeader}>
                  <Text
                    style={[styles.participantName, hasUnread && styles.unreadName]}
                    numberOfLines={1}
                  >
                    {displayName}
                  </Text>
                  {lastMsg && (
                    <Text style={styles.timestamp}>
                      {new Date(lastMsg.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                  )}
                </View>
                {lastMsg && (
                  <Text
                    style={[styles.lastMessage, hasUnread && styles.unreadMessage]}
                    numberOfLines={1}
                  >
                    {lastMsg.content}
                  </Text>
                )}
              </View>
              {hasUnread && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadCount}>{item.unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  list: {
    padding: 16,
  },
  newMessageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    gap: 8,
  },
  newMessageText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a2e',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
    textAlign: 'center',
  },
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  unreadCard: {
    borderLeftWidth: 3,
    borderLeftColor: ACADEMY_GOLD,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: ACADEMY_GOLD,
    fontSize: 18,
    fontWeight: '700',
  },
  conversationInfo: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  participantName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1a1a2e',
    flex: 1,
  },
  unreadName: {
    fontWeight: '700',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginLeft: 8,
  },
  lastMessage: {
    fontSize: 13,
    color: '#888',
  },
  unreadMessage: {
    color: '#1a1a2e',
    fontWeight: '500',
  },
  unreadBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: ACADEMY_GOLD,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  unreadCount: {
    color: '#1a1a2e',
    fontSize: 11,
    fontWeight: '700',
  },
});
