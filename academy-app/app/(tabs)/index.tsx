import { useUser } from '@clerk/clerk-expo';
import {
  View,
  Text,
  Image,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { trpc } from '../../lib/trpc';
import { trackEvent } from '../../lib/analytics';

const ACADEMY_GOLD = '#CFB87C';
const NAVY = '#1a1a2e';

function StatsSkeleton() {
  return (
    <View style={styles.statsCard}>
      <View style={[styles.skeletonBlock, { width: 120, height: 14, marginBottom: 12 }]} />
      <View style={styles.statsGrid}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={styles.statItem}>
            <View style={[styles.skeletonBlock, { width: 32, height: 24, marginBottom: 4 }]} />
            <View style={[styles.skeletonBlock, { width: 48, height: 10 }]} />
          </View>
        ))}
      </View>
    </View>
  );
}

function QuickActionsSkeleton() {
  return (
    <View style={styles.quickActionsGrid}>
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={styles.quickActionBtn}>
          <View style={[styles.skeletonBlock, { width: 36, height: 36, borderRadius: 18, marginBottom: 6 }]} />
          <View style={[styles.skeletonBlock, { width: 50, height: 10 }]} />
        </View>
      ))}
    </View>
  );
}

export default function DashboardScreen() {
  const { user } = useUser();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const me = trpc.auth.me.useQuery();
  const announcements = trpc.announcements.list.useQuery();
  const schedules = trpc.schedules.upcoming.useQuery();
  const stats = trpc.attendance.getMyStats.useQuery({});
  const subscriptions = trpc.payment.mySubscriptions.useQuery();

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      me.refetch(),
      announcements.refetch(),
      schedules.refetch(),
      stats.refetch(),
      subscriptions.refetch(),
    ]);
    setRefreshing(false);
  };

  const isAdmin = me.data?.role === 'admin';
  const nextSession = schedules.data?.[0];

  // Find active subscription with nearest renewal
  const activeSub = (subscriptions.data ?? []).find((s) => s.status === 'active');

  const quickActions = [
    {
      key: 'schedule',
      icon: 'calendar-outline' as const,
      label: 'Schedule',
      onPress: () => {
        trackEvent('dashboard_quick_action_tapped', { action: 'schedule' });
        router.push('/(tabs)/schedule');
      },
    },
    {
      key: 'chat',
      icon: 'chatbubbles-outline' as const,
      label: 'Chat',
      onPress: () => {
        trackEvent('dashboard_quick_action_tapped', { action: 'chat' });
        router.push('/(tabs)/chat');
      },
    },
    {
      key: 'programs',
      icon: 'grid-outline' as const,
      label: 'Programs',
      onPress: () => {
        trackEvent('dashboard_quick_action_tapped', { action: 'programs' });
        router.push('/(tabs)/programs');
      },
    },
    {
      key: 'shop',
      icon: 'bag-outline' as const,
      label: 'Shop',
      onPress: () => {
        trackEvent('dashboard_quick_action_tapped', { action: 'shop' });
        router.push('/shop');
      },
    },
  ];

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      data={announcements.data ?? []}
      keyExtractor={(item) => String(item.id)}
      ListHeaderComponent={
        <View>
          {/* Header */}
          <View style={styles.headerRow}>
            <Image
              source={require('../../assets/academy-logo.jpeg')}
              style={styles.headerLogo}
              resizeMode="contain"
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.welcome}>
                Welcome, {user?.firstName || 'Member'}
              </Text>
            </View>
            {isAdmin && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Admin</Text>
              </View>
            )}
          </View>

          {/* Next Session Card */}
          {nextSession && (
            <View style={styles.sessionCard}>
              <Text style={styles.cardLabel}>Next Session</Text>
              <Text style={styles.cardTitle}>{nextSession.title}</Text>
              <Text style={styles.cardMeta}>
                {new Date(nextSession.startTime).toLocaleDateString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}{' '}
                at{' '}
                {new Date(nextSession.startTime).toLocaleTimeString(undefined, {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </Text>
              {nextSession.location && (
                <Text style={styles.cardMeta}>{nextSession.location}</Text>
              )}
            </View>
          )}

          {/* Attendance Stats */}
          {stats.isLoading ? (
            <StatsSkeleton />
          ) : stats.data && stats.data.total > 0 ? (
            <View style={styles.statsCard}>
              <Text style={styles.statsTitle}>YOUR ATTENDANCE</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stats.data.total}</Text>
                  <Text style={styles.statLabel}>Sessions</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stats.data.present}</Text>
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
                  <Text style={styles.statValue}>{stats.data.late}</Text>
                  <Text style={styles.statLabel}>Late</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.statsLink}
                onPress={() => {
                  trackEvent('dashboard_quick_action_tapped', { action: 'attendance' });
                  router.push('/attendance');
                }}
              >
                <Text style={styles.statsLinkText}>View Details</Text>
                <Ionicons name="chevron-forward" size={14} color={ACADEMY_GOLD} />
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Quick Actions */}
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.key}
                style={styles.quickActionBtn}
                onPress={action.onPress}
                activeOpacity={0.7}
              >
                <View style={styles.quickActionIcon}>
                  <Ionicons name={action.icon} size={22} color={ACADEMY_GOLD} />
                </View>
                <Text style={styles.quickActionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Upcoming Payment */}
          {activeSub && activeSub.currentPeriodEnd && (
            <TouchableOpacity
              style={styles.paymentCard}
              onPress={() => {
                trackEvent('dashboard_quick_action_tapped', { action: 'payments' });
                router.push('/payments');
              }}
              activeOpacity={0.7}
            >
              <View style={styles.paymentIcon}>
                <Ionicons name="card-outline" size={18} color={ACADEMY_GOLD} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.paymentLabel}>Next Payment</Text>
                <Text style={styles.paymentDate}>
                  {new Date(activeSub.currentPeriodEnd).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#ccc" />
            </TouchableOpacity>
          )}

          {/* Announcements Header */}
          <Text style={styles.sectionTitle}>Announcements</Text>

          {announcements.isLoading && (
            <View style={{ gap: 10 }}>
              {[1, 2].map((i) => (
                <View key={i} style={styles.announcementCard}>
                  <View style={[styles.skeletonBlock, { width: '60%', height: 16, marginBottom: 8 }]} />
                  <View style={[styles.skeletonBlock, { width: '100%', height: 12, marginBottom: 4 }]} />
                  <View style={[styles.skeletonBlock, { width: '80%', height: 12 }]} />
                </View>
              ))}
            </View>
          )}
          {!announcements.isLoading && announcements.data?.length === 0 && (
            <Text style={styles.empty}>No announcements right now.</Text>
          )}
        </View>
      }
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.announcementCard}
          activeOpacity={0.8}
          onPress={() => trackEvent('dashboard_content_tapped', { content_type: 'announcement', content_id: item.id })}
        >
          <Text style={styles.announcementTitle}>{item.title}</Text>
          <Text style={styles.announcementContent}>{item.content}</Text>
          {item.publishedAt && (
            <Text style={styles.announcementDate}>
              {new Date(item.publishedAt).toLocaleDateString()}
            </Text>
          )}
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  // Skeleton
  skeletonBlock: {
    backgroundColor: '#e8e8e8',
    borderRadius: 6,
  },
  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLogo: {
    width: 44,
    height: 44,
    borderRadius: 8,
    marginRight: 12,
  },
  welcome: {
    fontSize: 24,
    fontWeight: '700',
    color: NAVY,
  },
  badge: {
    backgroundColor: ACADEMY_GOLD,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 12,
  },
  badgeText: {
    color: NAVY,
    fontSize: 12,
    fontWeight: '600',
  },
  // Next Session
  sessionCard: {
    backgroundColor: NAVY,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  cardLabel: {
    color: ACADEMY_GOLD,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardMeta: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 2,
  },
  // Attendance Stats
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  statsTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#999',
    letterSpacing: 1,
    marginBottom: 12,
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
    color: NAVY,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#888',
    fontWeight: '500',
  },
  statsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 4,
    minHeight: 44,
  },
  statsLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: ACADEMY_GOLD,
  },
  // Quick Actions
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  quickActionBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    minHeight: 44,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: NAVY,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  quickActionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: NAVY,
  },
  // Upcoming Payment
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    gap: 12,
    minHeight: 56,
  },
  paymentIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0e8d5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  paymentDate: {
    fontSize: 14,
    fontWeight: '500',
    color: NAVY,
  },
  // Announcements
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: NAVY,
    marginBottom: 12,
  },
  empty: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
  },
  announcementCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  announcementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: NAVY,
    marginBottom: 6,
  },
  announcementContent: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
  },
  announcementDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
});
