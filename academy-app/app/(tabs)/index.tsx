import { useUser } from '@clerk/clerk-expo';
import {
  View,
  Text,
  Image,
  FlatList,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GradientCard, GlassCard } from '../../components/GradientCard';
import { AnimatedCard } from '../../components/AnimatedCard';
import { AnimatedCounter } from '../../components/AnimatedCounter';
import { trpc } from '../../lib/trpc';
import { trackEvent } from '../../lib/analytics';
import { colors, shadows, typography } from '../../lib/theme';

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

  const showcases = trpc.showcases.active.useQuery();
  const currentShowcase = showcases.data?.[0];

  // Get athlete metrics for progress card (uses own user ID)
  const metricsQuery = trpc.metrics.getByAthlete.useQuery(
    { athleteId: me.data?.id ?? 0 },
    { enabled: !!me.data?.id }
  );
  const recentMetrics = (metricsQuery.data ?? []).slice(0, 3);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      me.refetch(),
      announcements.refetch(),
      schedules.refetch(),
      stats.refetch(),
      subscriptions.refetch(),
      showcases.refetch(),
    ]);
    setRefreshing(false);
  };

  const isAdmin = me.data?.role === 'admin';
  const nextSession = schedules.data?.[0];

  // Find active subscription with nearest renewal
  const activeSub = (subscriptions.data ?? []).find((s: any) => s.status === 'active');

  const quickActions = [
    ...(isAdmin ? [{
      key: 'quick-capture',
      icon: 'camera-outline' as const,
      label: 'Quick Capture',
      onPress: () => {
        trackEvent('dashboard_quick_action_tapped', { action: 'quick-capture' });
        router.push('/vision-capture');
      },
    }] : []),
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
      key: 'games',
      icon: 'game-controller-outline' as const,
      label: 'Games',
      onPress: () => {
        trackEvent('dashboard_quick_action_tapped', { action: 'games' });
        router.push('/(tabs)/games');
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

  const featureLinks = [
    { key: 'family', icon: 'people-outline' as const, label: 'Family', route: '/family' },
    { key: 'referrals', icon: 'gift-outline' as const, label: 'Referrals', route: '/referrals' },
    { key: 'gallery', icon: 'images-outline' as const, label: 'Social Gallery', route: '/gallery' },
    { key: 'drops', icon: 'megaphone-outline' as const, label: 'Drops', route: '/drops' },
    { key: 'metrics', icon: 'analytics-outline' as const, label: 'Metrics', route: '/metrics' },
    { key: 'media', icon: 'play-circle-outline' as const, label: 'Media', route: '/(tabs)/media' },
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
          {/* Hero Header */}
          <LinearGradient
            colors={[colors.cardElevated, colors.background]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.heroGradient}
          >
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
                <TouchableOpacity
                  style={styles.adminButton}
                  onPress={() => {
                    trackEvent('dashboard_admin_panel_tapped');
                    router.push('/admin');
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="shield-checkmark" size={14} color={colors.card} />
                  <Text style={styles.adminButtonText}>Admin</Text>
                </TouchableOpacity>
              )}
            </View>
          </LinearGradient>

          {/* Next Session Card */}
          {nextSession && (
            <AnimatedCard index={0}>
              <GradientCard borderOnly borderWidth={1.5} style={styles.sessionCardOuter}>
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
              </GradientCard>
            </AnimatedCard>
          )}

          {/* Attendance Stats */}
          {stats.isLoading ? (
            <StatsSkeleton />
          ) : stats.data && stats.data.total > 0 ? (
            <AnimatedCard index={1}>
              <GlassCard style={styles.statsCard}>
                <Text style={styles.statsTitle}>YOUR ATTENDANCE</Text>
                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <AnimatedCounter value={stats.data.total} style={styles.statValue} />
                    <Text style={styles.statLabel}>Sessions</Text>
                  </View>
                  <View style={styles.statItem}>
                    <AnimatedCounter value={stats.data.present} style={styles.statValue} />
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
                    <AnimatedCounter value={stats.data.late} style={styles.statValue} />
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
                  <Ionicons name="chevron-forward" size={14} color={colors.gold} />
                </TouchableOpacity>
              </GlassCard>
            </AnimatedCard>
          ) : null}

          {/* Athlete Progress Card */}
          {recentMetrics.length > 0 && (
            <AnimatedCard index={2}>
              <TouchableOpacity
                style={styles.progressCard}
                onPress={() => {
                  trackEvent('dashboard_progress_tapped');
                  router.push('/metrics');
                }}
                activeOpacity={0.7}
              >
                <View style={styles.progressHeader}>
                  <View style={styles.progressIconWrap}>
                    <Ionicons name="trending-up" size={16} color={colors.gold} />
                  </View>
                  <Text style={styles.progressTitle}>ATHLETE PROGRESS</Text>
                  <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
                </View>
                <View style={styles.progressMetrics}>
                  {recentMetrics.map((m: any) => (
                    <View key={m.id} style={styles.progressItem}>
                      <Text style={styles.progressMetricName} numberOfLines={1}>
                        {m.metricName}
                      </Text>
                      <Text style={styles.progressMetricValue}>
                        {m.value}{m.unit ? ` ${m.unit}` : ''}
                      </Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.progressCta}>View all metrics</Text>
              </TouchableOpacity>
            </AnimatedCard>
          )}

          {/* Quick Actions */}
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, i) => (
              <AnimatedCard key={action.key} index={i + 2} animation="zoom">
                <TouchableOpacity
                  style={styles.quickActionBtn}
                  onPress={action.onPress}
                  activeOpacity={0.7}
                >
                  <View style={styles.quickActionIcon}>
                    <Ionicons name={action.icon} size={22} color={colors.gold} />
                  </View>
                  <Text style={styles.quickActionLabel}>{action.label}</Text>
                </TouchableOpacity>
              </AnimatedCard>
            ))}
          </View>

          {/* Feature Links Row */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featureLinksRow}
          >
            {featureLinks.map((link) => (
              <TouchableOpacity
                key={link.key}
                style={styles.featureLinkBtn}
                onPress={() => {
                  trackEvent('dashboard_feature_tapped', { feature: link.key });
                  router.push(link.route as any);
                }}
                activeOpacity={0.7}
              >
                <Ionicons name={link.icon} size={18} color={colors.gold} />
                <Text style={styles.featureLinkLabel}>{link.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Athlete Showcase */}
          {currentShowcase && (
            <AnimatedCard index={7}>
              <GradientCard
                gradientColors={[colors.cardElevated, colors.card]}
                style={styles.showcaseCardOuter}
              >
                <TouchableOpacity
                  style={styles.showcaseCard}
                  activeOpacity={0.8}
                  onPress={() => {
                    trackEvent('dashboard_showcase_tapped');
                    router.push('/showcase');
                  }}
                >
                  <View style={styles.showcaseHeader}>
                    <Ionicons name="star" size={16} color={colors.gold} />
                    <Text style={styles.showcaseLabel}>ATHLETE SPOTLIGHT</Text>
                    <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
                  </View>
                  <Text style={styles.showcaseName}>{currentShowcase.title}</Text>
                  <Text style={styles.showcaseDesc} numberOfLines={2}>
                    {currentShowcase.description}
                  </Text>
                </TouchableOpacity>
              </GradientCard>
            </AnimatedCard>
          )}

          {/* Upcoming Payment */}
          {activeSub && activeSub.currentPeriodEnd && (
            <AnimatedCard index={6}>
              <TouchableOpacity
                style={styles.paymentCard}
                onPress={() => {
                  trackEvent('dashboard_quick_action_tapped', { action: 'payments' });
                  router.push('/payments');
                }}
                activeOpacity={0.7}
              >
                <View style={styles.paymentIcon}>
                  <Ionicons name="card-outline" size={18} color={colors.gold} />
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
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            </AnimatedCard>
          )}

          {/* Announcements Header */}
          <Text style={styles.sectionTitle}>ANNOUNCEMENTS</Text>

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
      renderItem={({ item, index: i }) => (
        <AnimatedCard index={i + 8}>
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
        </AnimatedCard>
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
  // Skeleton
  skeletonBlock: {
    backgroundColor: colors.skeletonBase,
    borderRadius: 6,
  },
  // Hero gradient
  heroGradient: {
    paddingTop: 24,
    paddingHorizontal: 16,
    marginHorizontal: -16,
    marginTop: -16,
    marginBottom: 20,
  },
  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLogo: {
    width: 44,
    height: 44,
    borderRadius: 8,
    marginRight: 12,
    borderWidth: 2,
    borderColor: colors.gold,
  },
  welcome: {
    ...typography.heading,
  },
  adminButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.gold,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 12,
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
  },
  adminButtonText: {
    color: colors.card,
    fontSize: 12,
    fontWeight: '700',
  },
  // Next Session
  sessionCardOuter: {
    marginBottom: 16,
  },
  sessionCard: {
    padding: 20,
  },
  cardLabel: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardMeta: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 2,
  },
  // Attendance Stats
  statsCard: {
    padding: 16,
    marginBottom: 16,
  },
  statsTitle: {
    ...typography.overline,
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
    ...typography.displaySmall,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
  statsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 4,
    minHeight: 44,
  },
  statsLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gold,
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
    backgroundColor: colors.cardElevated,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    ...shadows.glow,
  },
  quickActionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  // Upcoming Payment
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    ...shadows.card,
    gap: 12,
    minHeight: 56,
  },
  paymentIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.goldMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  paymentDate: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  // Athlete Progress Card
  progressCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    ...shadows.card,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  progressIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.goldMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTitle: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1,
  },
  progressMetrics: {
    gap: 8,
  },
  progressItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  progressMetricName: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
  },
  progressMetricValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: typography.display.fontFamily,
  },
  progressCta: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gold,
    textAlign: 'center',
    marginTop: 10,
  },
  // Feature Links
  featureLinksRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    paddingVertical: 2,
  },
  featureLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.cardElevated,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    ...shadows.subtle,
  },
  featureLinkLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  // Showcase
  showcaseCardOuter: {
    marginBottom: 16,
  },
  showcaseCard: {
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: colors.gold,
  },
  showcaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  showcaseLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.gold,
    letterSpacing: 1.5,
    flex: 1,
  },
  showcaseName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  showcaseDesc: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
  // Announcements
  sectionTitle: {
    ...typography.overline,
    marginBottom: 12,
  },
  empty: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
  },
  announcementCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.gold,
    ...shadows.card,
  },
  announcementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  announcementContent: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  announcementDate: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 8,
  },
});
