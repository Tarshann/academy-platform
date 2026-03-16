import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useState, useEffect, useRef, useMemo } from 'react';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  addMonths,
  subMonths,
  isSameDay,
  isSameMonth,
} from 'date-fns';
import { trpc } from '../lib/trpc';
import { trackEvent } from '../lib/analytics';
import { colors, shadows } from '../lib/theme';

const STATUS_COLORS: Record<string, string> = {
  present: '#27ae60',
  absent: '#e74c3c',
  excused: '#f39c12',
  late: '#e67e22',
};

const STATUS_LABELS: Record<string, string> = {
  present: 'Present',
  absent: 'Absent',
  excused: 'Excused',
  late: 'Late',
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function AttendanceSkeleton() {
  return (
    <View style={styles.skeletonContainer}>
      {/* Stats skeleton */}
      <View style={styles.statsCard}>
        <View style={styles.statsGrid}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.statItem}>
              <View style={[styles.skeletonBlock, { width: 32, height: 24, marginBottom: 4 }]} />
              <View style={[styles.skeletonBlock, { width: 48, height: 10 }]} />
            </View>
          ))}
        </View>
      </View>
      {/* Calendar skeleton */}
      <View style={styles.calendarCard}>
        <View style={[styles.skeletonBlock, { width: 160, height: 18, marginBottom: 16, alignSelf: 'center' }]} />
        <View style={styles.calendarGrid}>
          {Array.from({ length: 35 }).map((_, i) => (
            <View key={i} style={[styles.skeletonBlock, { width: 32, height: 32, borderRadius: 16, margin: 2 }]} />
          ))}
        </View>
      </View>
      {/* Records skeleton */}
      {[1, 2, 3].map((i) => (
        <View key={i} style={styles.recordCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={[styles.skeletonBlock, { width: '50%', height: 14 }]} />
            <View style={[styles.skeletonBlock, { width: 60, height: 20, borderRadius: 10 }]} />
          </View>
          <View style={[styles.skeletonBlock, { width: '30%', height: 12, marginTop: 8 }]} />
        </View>
      ))}
    </View>
  );
}

export default function AttendanceScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const tracked = useRef(false);

  const stats = trpc.attendance.getMyStats.useQuery({});
  const records = trpc.attendance.getMyAttendance.useQuery();

  const isLoading = stats.isLoading || records.isLoading;
  const isError = stats.isError || records.isError;

  useEffect(() => {
    if (!tracked.current) {
      trackEvent('attendance_viewed');
      tracked.current = true;
    }
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([stats.refetch(), records.refetch()]);
    setRefreshing(false);
  };

  const onPrevMonth = () => {
    const prev = subMonths(currentMonth, 1);
    setCurrentMonth(prev);
    trackEvent('attendance_date_filtered', { month: format(prev, 'yyyy-MM') });
  };

  const onNextMonth = () => {
    const next = addMonths(currentMonth, 1);
    setCurrentMonth(next);
    trackEvent('attendance_date_filtered', { month: format(next, 'yyyy-MM') });
  };

  // Build map of attended dates for calendar highlighting
  const attendedDatesMap = useMemo(() => {
    const map = new Map<string, string>();
    (records.data ?? []).forEach((r) => {
      if (r.markedAt) {
        const dateKey = format(new Date(r.markedAt), 'yyyy-MM-dd');
        map.set(dateKey, r.status);
      }
    });
    return map;
  }, [records.data]);

  // Calendar days for current month
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startPadding = getDay(monthStart); // 0 = Sunday
    return { days, startPadding };
  }, [currentMonth]);

  // Records filtered to current month
  const monthRecords = useMemo(() => {
    return (records.data ?? []).filter((r) => {
      if (!r.markedAt) return false;
      return isSameMonth(new Date(r.markedAt), currentMonth);
    }).sort((a, b) => {
      const dateA = a.markedAt ? new Date(a.markedAt).getTime() : 0;
      const dateB = b.markedAt ? new Date(b.markedAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [records.data, currentMonth]);

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Attendance',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.textPrimary,
          headerBackTitle: 'Back',
        }}
      />

      {isLoading ? (
        <ScrollView style={styles.scroll}>
          <AttendanceSkeleton />
        </ScrollView>
      ) : isError ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={styles.errorTitle}>Could not load attendance</Text>
          <Text style={styles.errorSubtitle}>Check your connection and try again</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={onRefresh}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Stats Summary */}
          {stats.data && (
            <View style={styles.statsCard}>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stats.data.total}</Text>
                  <Text style={styles.statLabel}>Total</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: '#27ae60' }]}>
                    {stats.data.present}
                  </Text>
                  <Text style={styles.statLabel}>Present</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: '#27ae60' }]}>
                    {stats.data.total > 0
                      ? `${Math.round((stats.data.present / stats.data.total) * 100)}%`
                      : '—'}
                  </Text>
                  <Text style={styles.statLabel}>Rate</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: '#e74c3c' }]}>
                    {stats.data.absent}
                  </Text>
                  <Text style={styles.statLabel}>Absent</Text>
                </View>
              </View>
            </View>
          )}

          {/* Calendar */}
          <View style={styles.calendarCard}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={onPrevMonth} style={styles.calendarNav}>
                <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.calendarMonth}>
                {format(currentMonth, 'MMMM yyyy')}
              </Text>
              <TouchableOpacity onPress={onNextMonth} style={styles.calendarNav}>
                <Ionicons name="chevron-forward" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Weekday labels */}
            <View style={styles.weekdayRow}>
              {WEEKDAYS.map((day) => (
                <Text key={day} style={styles.weekdayLabel}>
                  {day}
                </Text>
              ))}
            </View>

            {/* Calendar grid */}
            <View style={styles.calendarGrid}>
              {/* Padding for start of month */}
              {Array.from({ length: calendarDays.startPadding }).map((_, i) => (
                <View key={`pad-${i}`} style={styles.calendarCell} />
              ))}
              {calendarDays.days.map((day) => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const status = attendedDatesMap.get(dateKey);
                const isToday = isSameDay(day, new Date());

                return (
                  <View key={dateKey} style={styles.calendarCell}>
                    <View
                      style={[
                        styles.calendarDay,
                        status && {
                          backgroundColor: STATUS_COLORS[status] || colors.textSecondary,
                        },
                        isToday && !status && styles.calendarDayToday,
                      ]}
                    >
                      <Text
                        style={[
                          styles.calendarDayText,
                          status && { color: colors.textPrimary },
                          isToday && !status && { color: colors.gold },
                        ]}
                      >
                        {format(day, 'd')}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Legend */}
            <View style={styles.legendRow}>
              {Object.entries(STATUS_COLORS).map(([key, color]) => (
                <View key={key} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: color }]} />
                  <Text style={styles.legendText}>{STATUS_LABELS[key]}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Records List */}
          <Text style={styles.sectionLabel}>
            {format(currentMonth, 'MMMM').toUpperCase()} RECORDS
          </Text>
          {monthRecords.length === 0 ? (
            <View style={styles.emptyWrapper}>
              <Ionicons name="calendar-outline" size={36} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No records this month</Text>
              <Text style={styles.emptySubtitle}>
                Attendance records will appear here as you attend sessions
              </Text>
            </View>
          ) : (
            monthRecords.map((record) => (
              <View key={record.id} style={styles.recordCard}>
                <View style={styles.recordRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.recordDate}>
                      {record.markedAt
                        ? format(new Date(record.markedAt), 'EEEE, MMM d')
                        : 'Unknown date'}
                    </Text>
                    {record.notes && (
                      <Text style={styles.recordNotes} numberOfLines={1}>
                        {record.notes}
                      </Text>
                    )}
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: `${STATUS_COLORS[record.status] || colors.textSecondary}20` },
                    ]}
                  >
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: STATUS_COLORS[record.status] || colors.textSecondary },
                      ]}
                    />
                    <Text
                      style={[
                        styles.statusBadgeText,
                        { color: STATUS_COLORS[record.status] || colors.textSecondary },
                      ]}
                    >
                      {STATUS_LABELS[record.status] || record.status}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  // Skeleton
  skeletonContainer: {
    padding: 16,
  },
  skeletonBlock: {
    backgroundColor: colors.skeletonBase,
    borderRadius: 6,
  },
  // Stats
  statsCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...shadows.subtle,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  // Calendar
  calendarCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    ...shadows.subtle,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  calendarNav: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarMonth: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  weekdayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  calendarDay: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDayToday: {
    borderWidth: 2,
    borderColor: colors.gold,
  },
  calendarDayText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  // Legend
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  // Records
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  recordCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    ...shadows.subtle,
  },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordDate: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  recordNotes: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  // Error
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 32,
    gap: 8,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.gold,
    minHeight: 44,
    justifyContent: 'center',
  },
  retryText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.card,
  },
  // Empty
  emptyWrapper: {
    padding: 40,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
