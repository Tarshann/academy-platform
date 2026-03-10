import { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { trpc } from '../../lib/trpc';
import { ConversationListSkeleton } from '../../components/Skeleton';
import { trackEvent } from '../../lib/analytics';

const ACADEMY_GOLD = '#CFB87C';
const NAVY = '#1a1a2e';

export default function MessagesScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const blockUser = trpc.dm.blockUser.useMutation({
    onSuccess: () => {
      conversations.refetch();
    },
    onError: (error) => {
      Alert.alert('Error', error.message || 'Could not block user.');
    },
  });

  const archiveConversation = trpc.dm.archiveConversation.useMutation({
    onSuccess: () => {
      conversations.refetch();
    },
    onError: (error) => {
      Alert.alert('Error', error.message || 'Could not archive conversation.');
    },
  });

  const onLongPressConversation = (item: any) => {
    const displayName = item.otherUser?.name || 'Unknown';
    const otherUserId = item.otherUser?.id;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const buttons: any[] = [
      {
        text: 'Archive',
        onPress: () => {
          trackEvent('dm_conversation_archived', { conversation_id: item.id });
          archiveConversation.mutate({ conversationId: item.id });
        },
      },
    ];

    if (otherUserId) {
      buttons.push({
        text: 'Block User',
        style: 'destructive',
        onPress: () => {
          Alert.alert(
            'Block User',
            `Are you sure you want to block ${displayName}? You will no longer receive messages from them.`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Block',
                style: 'destructive',
                onPress: () => {
                  trackEvent('dm_user_blocked', { blocked_user_id: otherUserId });
                  blockUser.mutate({ userId: otherUserId });
                },
              },
            ]
          );
        },
      });
    }

    buttons.push({ text: 'Cancel', style: 'cancel' });

    Alert.alert(displayName, 'Choose an action', buttons);
  };

  // Search query — only fires when searchQuery is non-empty
  const searchResults = trpc.dm.searchMessages.useQuery(
    { query: searchQuery, limit: 20 },
    { enabled: searchQuery.length > 0 }
  );

  const onSearchChange = useCallback((text: string) => {
    setSearchText(text);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      const trimmed = text.trim();
      setSearchQuery(trimmed);
      if (trimmed.length > 0) {
        trackEvent('dm_search_performed', { query_length: trimmed.length });
      }
    }, 300);
  }, []);

  const onClearSearch = () => {
    setSearchText('');
    setSearchQuery('');
  };

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

  // Build a map of conversationId → otherUser name for search results
  const convoNameMap = new Map<number, string>();
  (conversations.data ?? []).forEach((c: any) => {
    convoNameMap.set(c.id, c.otherUser?.name || 'Unknown');
  });

  if (conversations.isLoading) {
    return (
      <View style={styles.container}>
        <ConversationListSkeleton />
      </View>
    );
  }

  if (conversations.isError) {
    const err = conversations.error;
    const errMsg = err?.message || 'Unknown error';
    const errCode = (err as any)?.data?.code || (err as any)?.shape?.data?.code || '';
    const errDetail = errCode ? `${errCode}: ${errMsg}` : errMsg;
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#999" />
          <Text style={styles.errorText}>Failed to load conversations</Text>
          <Text style={styles.errorDetail}>{errDetail}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => conversations.refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const convos = conversations.data ?? [];
  const isSearching = searchQuery.length > 0;

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search messages..."
            placeholderTextColor="#999"
            value={searchText}
            onChangeText={onSearchChange}
            returnKeyType="search"
            autoCorrect={false}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={onClearSearch} style={styles.clearBtn}>
              <Ionicons name="close-circle" size={18} color="#ccc" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isSearching ? (
        /* Search Results */
        <FlatList
          data={searchResults.data ?? []}
          keyExtractor={(item: any) => String(item.id)}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            searchResults.isLoading ? (
              <View style={styles.searchLoadingRow}>
                <ActivityIndicator size="small" color={ACADEMY_GOLD} />
                <Text style={styles.searchLoadingText}>Searching...</Text>
              </View>
            ) : (
              <Text style={styles.searchResultCount}>
                {(searchResults.data ?? []).length} result{(searchResults.data ?? []).length !== 1 ? 's' : ''}
              </Text>
            )
          }
          ListEmptyComponent={
            !searchResults.isLoading ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={36} color="#ccc" />
                <Text style={styles.emptyTitle}>No results</Text>
                <Text style={styles.emptySubtitle}>Try a different search term</Text>
              </View>
            ) : null
          }
          renderItem={({ item }: { item: any }) => {
            const senderName = item.senderName || 'Unknown';
            const convoName = convoNameMap.get(item.conversationId) || 'Conversation';
            const snippet = item.content?.length > 80
              ? item.content.substring(0, 80) + '...'
              : item.content;

            return (
              <TouchableOpacity
                style={styles.searchResultCard}
                onPress={() => {
                  trackEvent('dm_search_result_tapped', { conversation_id: item.conversationId });
                  router.push(`/dm/${item.conversationId}`);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.searchResultIcon}>
                  <Ionicons name="chatbubble-outline" size={16} color={ACADEMY_GOLD} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.searchResultName} numberOfLines={1}>
                    {convoName}
                  </Text>
                  <Text style={styles.searchResultSnippet} numberOfLines={2}>
                    <Text style={styles.searchResultSender}>{senderName}: </Text>
                    {snippet}
                  </Text>
                  <Text style={styles.searchResultDate}>
                    {new Date(item.createdAt).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      ) : (
        /* Conversation List */
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
            const displayName = item.otherUser?.name || 'Unknown';
            const lastMsg = item.lastMessage;
            const hasUnread = item.unreadCount > 0;

            return (
              <TouchableOpacity
                style={[styles.conversationCard, hasUnread && styles.unreadCard]}
                onPress={() => router.push(`/dm/${item.id}`)}
                onLongPress={() => onLongPressConversation(item)}
                delayLongPress={500}
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  // Search bar
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: '#f5f5f5',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: NAVY,
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 4,
    minWidth: 28,
    minHeight: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Search results
  searchLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    gap: 8,
  },
  searchLoadingText: {
    fontSize: 13,
    color: '#888',
  },
  searchResultCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    marginBottom: 8,
    marginLeft: 4,
  },
  searchResultCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  searchResultIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0e8d5',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  searchResultName: {
    fontSize: 14,
    fontWeight: '600',
    color: NAVY,
    marginBottom: 2,
  },
  searchResultSnippet: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  searchResultSender: {
    fontWeight: '600',
    color: NAVY,
  },
  searchResultDate: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  // Conversation list
  list: {
    padding: 16,
  },
  newMessageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: NAVY,
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
    color: NAVY,
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
    backgroundColor: NAVY,
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
    color: NAVY,
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
    color: NAVY,
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
    color: NAVY,
    fontSize: 11,
    fontWeight: '700',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    marginBottom: 4,
  },
  errorDetail: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  retryButton: {
    backgroundColor: NAVY,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
