import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Alert } from 'react-native';
import { trpc } from '../lib/trpc';
import { colors, shadows, typography } from '../lib/theme';

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  new: { color: colors.gold, label: 'New' },
  read: { color: colors.info, label: 'Read' },
  responded: { color: colors.success, label: 'Responded' },
};

export default function AdminContactsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const contacts = trpc.contact.list.useQuery();
  const markRead = trpc.admin.contacts.markRead.useMutation({
    onSuccess: () => contacts.refetch(),
    onError: (err) => Alert.alert('Error', err.message),
  });
  const markResponded = trpc.admin.contacts.markResponded.useMutation({
    onSuccess: () => contacts.refetch(),
    onError: (err) => Alert.alert('Error', err.message),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await contacts.refetch();
    setRefreshing(false);
  };

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      data={contacts.data ?? []}
      keyExtractor={(item) => String(item.id)}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListEmptyComponent={
        contacts.isLoading ? (
          <View style={styles.center}>
            <Text style={styles.emptyText}>Loading contacts...</Text>
          </View>
        ) : contacts.isError ? (
          <View style={styles.center}>
            <Ionicons name="alert-circle-outline" size={40} color={colors.error} />
            <Text style={styles.emptyText}>Failed to load contacts</Text>
            <TouchableOpacity onPress={() => contacts.refetch()} style={styles.retryBtn}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.center}>
            <Ionicons name="mail-outline" size={40} color={colors.textMuted} />
            <Text style={styles.emptyText}>No contact submissions</Text>
          </View>
        )
      }
      renderItem={({ item }) => {
        const status = STATUS_CONFIG[item.status ?? 'new'] ?? STATUS_CONFIG.new;
        return (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.name}>{item.name}</Text>
              <View style={[styles.badge, { backgroundColor: status.color + '22' }]}>
                <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
              </View>
            </View>
            <Text style={styles.email}>{item.email}</Text>
            {item.message && <Text style={styles.message} numberOfLines={3}>{item.message}</Text>}
            {item.createdAt && (
              <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
            )}
            {/* Quick actions */}
            <View style={styles.actions}>
              {(item.status === 'new' || !item.status) && (
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => markRead.mutate({ id: item.id })}
                  activeOpacity={0.7}
                >
                  <Ionicons name="eye-outline" size={14} color={colors.info} />
                  <Text style={[styles.actionText, { color: colors.info }]}>Mark Read</Text>
                </TouchableOpacity>
              )}
              {item.status !== 'responded' && (
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => markResponded.mutate({ id: item.id })}
                  activeOpacity={0.7}
                >
                  <Ionicons name="checkmark-circle-outline" size={14} color={colors.success} />
                  <Text style={[styles.actionText, { color: colors.success }]}>Responded</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 32 },
  center: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyText: { fontSize: 14, color: colors.textMuted },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    ...shadows.subtle,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  email: { fontSize: 12, color: colors.textMuted, marginBottom: 6 },
  message: { fontSize: 13, color: colors.textSecondary, lineHeight: 18, marginBottom: 6 },
  date: { fontSize: 11, color: colors.textMuted },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: colors.surface,
    minHeight: 44,
  },
  actionText: { fontSize: 12, fontWeight: '600' },
  retryBtn: {
    backgroundColor: colors.gold,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center' as const,
  },
  retryText: {
    color: colors.card,
    fontSize: 14,
    fontWeight: '600' as const,
  },
});
