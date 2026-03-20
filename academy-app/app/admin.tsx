import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { trpc } from '../lib/trpc';
import { trackEvent } from '../lib/analytics';
import { colors, shadows, typography } from '../lib/theme';

interface AdminAction {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description: string;
  onPress: () => void;
  badge?: string | number;
}

interface AdminSection {
  title: string;
  actions: AdminAction[];
}

export default function AdminScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const me = trpc.auth.me.useQuery();
  const members = trpc.admin.members.list.useQuery(undefined, { enabled: me.data?.role === 'admin' });
  const contacts = trpc.contact.list.useQuery(undefined, { enabled: me.data?.role === 'admin' });
  const schedules = trpc.admin.schedules.list.useQuery(undefined, { enabled: me.data?.role === 'admin' });
  const announcements = trpc.admin.announcements.list.useQuery(undefined, { enabled: me.data?.role === 'admin' });

  const isAdmin = me.data?.role === 'admin';

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      me.refetch(),
      members.refetch(),
      contacts.refetch(),
      schedules.refetch(),
      announcements.refetch(),
    ]);
    setRefreshing(false);
  };

  // Stats
  const totalMembers = members.data?.length ?? 0;
  const newContacts = contacts.data?.filter((c: any) => c.status === 'new')?.length ?? 0;
  const totalSchedules = schedules.data?.length ?? 0;
  const draftAnnouncements = announcements.data?.filter((a: any) => !a.publishedAt)?.length ?? 0;

  const sections: AdminSection[] = [
    {
      title: 'Operations',
      actions: [
        {
          key: 'schedules',
          icon: 'calendar-outline',
          label: 'Schedules',
          description: 'Manage training sessions',
          badge: totalSchedules || undefined,
          onPress: () => {
            trackEvent('admin_action_tapped', { action: 'schedules' });
            router.push('/admin-schedules');
          },
        },
        {
          key: 'attendance',
          icon: 'checkmark-circle-outline',
          label: 'Attendance',
          description: 'Record & track attendance',
          onPress: () => {
            trackEvent('admin_action_tapped', { action: 'attendance' });
            router.push('/attendance');
          },
        },
        {
          key: 'metrics',
          icon: 'analytics-outline',
          label: 'Athlete Metrics',
          description: 'Record performance data',
          onPress: () => {
            trackEvent('admin_action_tapped', { action: 'metrics' });
            router.push('/metrics');
          },
        },
      ],
    },
    {
      title: 'People',
      actions: [
        {
          key: 'members',
          icon: 'people-outline',
          label: 'Members',
          description: 'View roster & roles',
          badge: totalMembers || undefined,
          onPress: () => {
            trackEvent('admin_action_tapped', { action: 'members' });
            router.push('/admin-members');
          },
        },
        {
          key: 'contacts',
          icon: 'mail-outline',
          label: 'Contacts',
          description: 'Lead submissions',
          badge: newContacts || undefined,
          onPress: () => {
            trackEvent('admin_action_tapped', { action: 'contacts' });
            router.push('/admin-contacts');
          },
        },
      ],
    },
    {
      title: 'Platform',
      actions: [
        {
          key: 'governance',
          icon: 'shield-checkmark-outline',
          label: 'Governance',
          description: 'Evidence trail & decision stats',
          onPress: () => {
            trackEvent('admin_action_tapped', { action: 'governance' });
            router.push('/admin-governance');
          },
        },
      ],
    },
    {
      title: 'Content',
      actions: [
        {
          key: 'announcements',
          icon: 'megaphone-outline',
          label: 'Announcements',
          description: 'Create & publish updates',
          badge: draftAnnouncements ? `${draftAnnouncements} drafts` : undefined,
          onPress: () => {
            trackEvent('admin_action_tapped', { action: 'announcements' });
            router.push('/admin-announcements');
          },
        },
        {
          key: 'drops',
          icon: 'notifications-outline',
          label: 'Merch Drops',
          description: 'Schedule drop alerts',
          onPress: () => {
            trackEvent('admin_action_tapped', { action: 'drops' });
            router.push('/drops');
          },
        },
      ],
    },
  ];

  if (!isAdmin && !me.isLoading) {
    return (
      <View style={styles.center}>
        <Ionicons name="lock-closed-outline" size={48} color={colors.textMuted} />
        <Text style={styles.lockedText}>Admin access required</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backArrow}
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Admin Panel</Text>
          <Text style={styles.headerSubtitle}>Manage your academy</Text>
        </View>
        <View style={styles.adminBadge}>
          <Ionicons name="shield-checkmark" size={14} color={colors.card} />
          <Text style={styles.adminBadgeText}>Admin</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <StatCard label="Members" value={totalMembers} icon="people" />
          <StatCard label="Sessions" value={totalSchedules} icon="calendar" />
          <StatCard label="New Leads" value={newContacts} icon="mail" highlight={newContacts > 0} />
        </View>

        {/* Sections */}
        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title.toUpperCase()}</Text>
            <View style={styles.sectionCards}>
              {section.actions.map((action) => (
                <TouchableOpacity
                  key={action.key}
                  style={styles.actionCard}
                  onPress={action.onPress}
                  activeOpacity={0.7}
                >
                  <View style={styles.actionIconWrap}>
                    <Ionicons name={action.icon} size={22} color={colors.gold} />
                  </View>
                  <View style={styles.actionContent}>
                    <Text style={styles.actionLabel}>{action.label}</Text>
                    <Text style={styles.actionDesc}>{action.description}</Text>
                  </View>
                  {action.badge != null && (
                    <View style={styles.actionBadge}>
                      <Text style={styles.actionBadgeText}>{action.badge}</Text>
                    </View>
                  )}
                  <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Portal Link */}
        <TouchableOpacity style={styles.portalLink} activeOpacity={0.7}>
          <Ionicons name="desktop-outline" size={18} color={colors.gold} />
          <Text style={styles.portalLinkText}>
            Full admin dashboard available at app.academytn.com
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function StatCard({
  label,
  value,
  icon,
  highlight,
}: {
  label: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
  highlight?: boolean;
}) {
  return (
    <View style={[styles.statCard, highlight && styles.statCardHighlight]}>
      <Ionicons
        name={icon}
        size={18}
        color={highlight ? colors.gold : colors.textMuted}
      />
      <Text style={[styles.statValue, highlight && { color: colors.gold }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  lockedText: {
    fontSize: 16,
    color: colors.textMuted,
    fontWeight: '500',
  },
  backBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.card,
    borderRadius: 8,
  },
  backBtnText: {
    color: colors.gold,
    fontWeight: '600',
    fontSize: 14,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 56,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  backArrow: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.gold,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  adminBadgeText: {
    color: colors.card,
    fontSize: 12,
    fontWeight: '700',
  },

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    ...shadows.card,
  },
  statCardHighlight: {
    borderWidth: 1,
    borderColor: colors.goldMuted,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Sections
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    ...typography.overline,
    marginBottom: 10,
    paddingLeft: 4,
  },
  sectionCards: {
    gap: 8,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    gap: 12,
    ...shadows.subtle,
    minHeight: 64,
  },
  actionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.goldMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionContent: {
    flex: 1,
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  actionDesc: {
    fontSize: 12,
    color: colors.textMuted,
  },
  actionBadge: {
    backgroundColor: colors.goldMuted,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  actionBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.gold,
  },

  // Portal Link
  portalLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.cardElevated,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  portalLinkText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
