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

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function AdminSchedulesScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const schedules = trpc.admin.schedules.list.useQuery();

  const onRefresh = async () => {
    setRefreshing(true);
    await schedules.refetch();
    setRefreshing(false);
  };

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      data={schedules.data ?? []}
      keyExtractor={(item) => String(item.id)}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListHeaderComponent={
        <View style={styles.statsBar}>
          <Text style={styles.statsText}>{schedules.data?.length ?? 0} sessions</Text>
        </View>
      }
      ListEmptyComponent={
        schedules.isLoading ? (
          <View style={styles.center}>
            <Text style={styles.emptyText}>Loading schedules...</Text>
          </View>
        ) : (
          <View style={styles.center}>
            <Ionicons name="calendar-outline" size={40} color={colors.textMuted} />
            <Text style={styles.emptyText}>No schedules yet</Text>
          </View>
        )
      }
      renderItem={({ item }) => {
        const startTime = item.startTime ? new Date(item.startTime) : null;
        const endTime = item.endTime ? new Date(item.endTime) : null;
        const dayLabel = item.dayOfWeek != null ? DAY_LABELS[item.dayOfWeek] : null;
        const timeStr = startTime
          ? startTime.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
          : '';
        const endStr = endTime
          ? endTime.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
          : '';

        return (
          <View style={styles.card}>
            <View style={styles.timeColumn}>
              {dayLabel && <Text style={styles.dayLabel}>{dayLabel}</Text>}
              <Text style={styles.timeText}>{timeStr}</Text>
              {endStr ? <Text style={styles.endTime}>to {endStr}</Text> : null}
            </View>
            <View style={styles.divider} />
            <View style={styles.details}>
              <Text style={styles.title}>{item.title}</Text>
              {item.location && (
                <View style={styles.metaRow}>
                  <Ionicons name="location-outline" size={12} color={colors.textMuted} />
                  <Text style={styles.metaText}>{item.location}</Text>
                </View>
              )}
              <View style={styles.tagsRow}>
                {item.sessionType && item.sessionType !== 'regular' && (
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>{item.sessionType}</Text>
                  </View>
                )}
                {item.recurring && (
                  <View style={[styles.tag, { backgroundColor: colors.goldMuted }]}>
                    <Text style={[styles.tagText, { color: colors.gold }]}>Recurring</Text>
                  </View>
                )}
              </View>
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
  statsBar: {
    paddingBottom: 12,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statsText: { ...typography.overline },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    gap: 12,
    ...shadows.subtle,
    minHeight: 64,
  },
  timeColumn: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.gold,
    marginBottom: 2,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  endTime: {
    fontSize: 11,
    color: colors.textMuted,
  },
  divider: {
    width: 1,
    backgroundColor: colors.border,
  },
  details: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  metaText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  tag: {
    backgroundColor: colors.surface,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
});
