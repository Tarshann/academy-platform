import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { trpc } from '../lib/trpc';
import { colors, shadows, typography } from '../lib/theme';

export default function AdminMembersScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const members = trpc.admin.members.list.useQuery();

  const onRefresh = async () => {
    setRefreshing(true);
    await members.refetch();
    setRefreshing(false);
  };

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      data={members.data ?? []}
      keyExtractor={(item) => String(item.id)}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListEmptyComponent={
        members.isLoading ? (
          <View style={styles.center}>
            <Text style={styles.emptyText}>Loading members...</Text>
          </View>
        ) : (
          <View style={styles.center}>
            <Ionicons name="people-outline" size={40} color={colors.textMuted} />
            <Text style={styles.emptyText}>No members yet</Text>
          </View>
        )
      }
      ListHeaderComponent={
        <View style={styles.statsBar}>
          <Text style={styles.statsText}>{members.data?.length ?? 0} total members</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(item.name || item.email || '?').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.name}>{item.name || 'Unnamed'}</Text>
            <Text style={styles.email}>{item.email}</Text>
          </View>
          <View style={[styles.roleBadge, item.role === 'admin' && styles.adminRole]}>
            <Text style={[styles.roleText, item.role === 'admin' && styles.adminRoleText]}>
              {item.role === 'admin' ? 'Admin' : 'Member'}
            </Text>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  center: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  statsBar: {
    paddingBottom: 12,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statsText: {
    ...typography.overline,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    gap: 12,
    ...shadows.subtle,
    minHeight: 64,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.goldMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.gold,
    fontSize: 16,
    fontWeight: '700',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  email: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  roleBadge: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  adminRole: {
    backgroundColor: colors.goldMuted,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  adminRoleText: {
    color: colors.gold,
  },
});
