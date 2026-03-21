import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { trpc } from '../lib/trpc';
import { colors, shadows, typography, spacing, radii } from '../lib/theme';

// ── Risk level colors ──────────────────────────────────────────────────
const riskColors: Record<string, string> = {
  critical: colors.error,
  high: colors.warning,
  medium: colors.gold,
  low: colors.success,
};

const actionColors: Record<string, string> = {
  allow: colors.success,
  deny: colors.error,
  escalate: colors.warning,
  error: colors.textMuted,
};

const actionIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  allow: 'checkmark-circle',
  deny: 'close-circle',
  escalate: 'arrow-up-circle',
  error: 'warning',
};

// Detect if an evidence entry is from the AI agent
function isAIAction(entry: any): boolean {
  return entry?.actor?.role === 'ai_agent'
    || entry?.source === 'ai'
    || entry?.capabilityId?.startsWith('ai.');
}

// ── Helpers ────────────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function capabilityLabel(id: string): string {
  return id
    .replace(/^(trpc|cron)[._]/, '')
    .replace(/[._]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Main Screen ────────────────────────────────────────────────────────
export default function AdminGovernanceScreen() {
  const [refreshing, setRefreshing] = useState(false);

  const stats = trpc.governance.stats.useQuery();
  const evidence = trpc.governance.evidenceTrail.useQuery({ limit: 30 });
  const capabilities = trpc.governance.listCapabilities.useQuery();

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([stats.refetch(), evidence.refetch(), capabilities.refetch()]);
    setRefreshing(false);
  };

  const isLoading = stats.isLoading && evidence.isLoading;
  const hasError = stats.isError && evidence.isError;

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.gold} />
        <Text style={styles.loadingText}>Loading governance data...</Text>
      </View>
    );
  }

  if (hasError) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
        <Text style={styles.errorText}>Failed to load governance data</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={onRefresh}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const s = stats.data;
  const trail = evidence.data ?? [];
  const caps = capabilities.data ?? [];

  // Count capabilities by risk level
  const riskCounts = { critical: 0, high: 0, medium: 0, low: 0 };
  caps.forEach((c: any) => {
    if (c.risk in riskCounts) riskCounts[c.risk as keyof typeof riskCounts]++;
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Status Banner */}
      <View style={[styles.statusBanner, s?.enabled ? styles.statusEnabled : styles.statusDisabled]}>
        <Ionicons
          name={s?.enabled ? 'shield-checkmark' : 'shield-outline'}
          size={18}
          color={s?.enabled ? colors.success : colors.textMuted}
        />
        <Text style={[styles.statusText, s?.enabled && { color: colors.success }]}>
          {s?.enabled ? 'Governance Active' : 'Governance Monitoring Only'}
        </Text>
      </View>

      {/* Decision Stats */}
      <Text style={styles.sectionTitle}>DECISIONS</Text>
      <View style={styles.statsGrid}>
        <StatCard label="Total" value={s?.totalDecisions ?? 0} color={colors.textPrimary} />
        <StatCard label="Allowed" value={s?.totalAllowed ?? 0} color={colors.success} />
        <StatCard label="Denied" value={s?.totalDenied ?? 0} color={colors.error} />
        <StatCard label="Escalated" value={s?.totalEscalated ?? 0} color={colors.warning} />
      </View>

      {/* AI Actions Count */}
      {(() => {
        const aiCount = trail.filter((e: any) => isAIAction(e)).length;
        const aiCaps = caps.filter((c: any) => c.domain === 'ai').length;
        return aiCount > 0 || aiCaps > 0 ? (
          <View style={styles.aiBanner}>
            <Ionicons name="sparkles" size={16} color={colors.gold} />
            <Text style={styles.aiBannerText}>
              {aiCaps} AI capabilities governed{aiCount > 0 ? ` · ${aiCount} AI actions recorded` : ''}
            </Text>
          </View>
        ) : null;
      })()}

      {/* Capability Risk Breakdown */}
      <Text style={styles.sectionTitle}>CAPABILITIES BY RISK</Text>
      <View style={styles.riskRow}>
        {(['critical', 'high', 'medium', 'low'] as const).map((level) => (
          <View key={level} style={styles.riskChip}>
            <View style={[styles.riskDot, { backgroundColor: riskColors[level] }]} />
            <Text style={styles.riskLabel}>{level}</Text>
            <Text style={[styles.riskCount, { color: riskColors[level] }]}>{riskCounts[level]}</Text>
          </View>
        ))}
      </View>

      {/* Evidence Trail */}
      <View style={styles.trailHeader}>
        <Text style={styles.sectionTitle}>RECENT EVIDENCE TRAIL</Text>
        <Text style={styles.trailCount}>{trail.length} entries</Text>
      </View>

      {trail.length === 0 ? (
        <View style={styles.emptyTrail}>
          <Ionicons name="document-text-outline" size={36} color={colors.textMuted} />
          <Text style={styles.emptyTrailText}>No governance decisions recorded yet</Text>
          <Text style={styles.emptyTrailSub}>
            Actions will appear here as admin operations are performed
          </Text>
        </View>
      ) : (
        trail.map((entry: any) => (
          <View key={entry.id} style={styles.trailCard}>
            <View style={styles.trailIconWrap}>
              <Ionicons
                name={actionIcons[entry.action] ?? 'ellipse'}
                size={20}
                color={actionColors[entry.action] ?? colors.textMuted}
              />
            </View>
            <View style={styles.trailContent}>
              <View style={styles.trailTopRow}>
                <Text style={styles.trailCapability} numberOfLines={1}>
                  {capabilityLabel(entry.capabilityId)}
                </Text>
                <Text style={styles.trailTime}>{timeAgo(entry.timestamp)}</Text>
              </View>
              <View style={styles.trailMeta}>
                <Text style={[styles.trailAction, { color: actionColors[entry.action] ?? colors.textMuted }]}>
                  {entry.action?.toUpperCase()}
                </Text>
                {isAIAction(entry) && (
                  <View style={styles.aiBadge}>
                    <Ionicons name="sparkles" size={9} color={colors.gold} />
                    <Text style={styles.aiBadgeText}>AI</Text>
                  </View>
                )}
                <Text style={styles.trailSource}>{entry.source}</Text>
                {entry.actor?.email && (
                  <Text style={styles.trailActor} numberOfLines={1}>
                    {entry.actor.email}
                  </Text>
                )}
              </View>
              {entry.reason && entry.capabilityId !== 'DEBUG_ERROR' && (
                <Text style={styles.trailReason} numberOfLines={2}>
                  {entry.reason}
                </Text>
              )}
            </View>
          </View>
        ))
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Ionicons name="desktop-outline" size={16} color={colors.textMuted} />
        <Text style={styles.footerText}>
          Full governance dashboard with filtering and capability registry available at app.academytn.com
        </Text>
      </View>
    </ScrollView>
  );
}

// ── Stat Card ──────────────────────────────────────────────────────────
function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.base,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    padding: spacing.xl,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 8,
  },
  errorText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.card,
    borderRadius: radii.sm,
    marginTop: 8,
  },
  retryBtnText: {
    color: colors.gold,
    fontWeight: '600',
    fontSize: 14,
  },

  // Status Banner
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    borderRadius: radii.md,
    marginBottom: spacing.lg,
  },
  statusEnabled: {
    backgroundColor: 'rgba(46, 204, 113, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(46, 204, 113, 0.2)',
  },
  statusDisabled: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },

  // Section Titles
  sectionTitle: {
    ...typography.overline,
    marginBottom: 10,
    paddingLeft: 2,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: 14,
    alignItems: 'center',
    gap: 4,
    ...shadows.subtle,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Risk Row
  riskRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.xl,
    flexWrap: 'wrap',
  },
  riskChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.card,
    borderRadius: radii.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    ...shadows.subtle,
  },
  riskDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  riskLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  riskCount: {
    fontSize: 14,
    fontWeight: '700',
  },

  // Trail Header
  trailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  trailCount: {
    fontSize: 12,
    color: colors.textMuted,
  },

  // Empty Trail
  emptyTrail: {
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: 32,
    alignItems: 'center',
    gap: 10,
    marginBottom: spacing.xl,
  },
  emptyTrailText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  emptyTrailSub: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },

  // Trail Card
  trailCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: 14,
    marginBottom: 8,
    gap: 12,
    ...shadows.subtle,
  },
  trailIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trailContent: {
    flex: 1,
  },
  trailTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  trailCapability: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  trailTime: {
    fontSize: 11,
    color: colors.textMuted,
  },
  trailMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  trailAction: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  trailSource: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.textMuted,
    backgroundColor: colors.surface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  trailActor: {
    fontSize: 10,
    color: colors.textMuted,
    flex: 1,
  },
  trailReason: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },

  // AI Banner
  aiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.goldMuted,
    borderRadius: radii.sm,
    padding: 12,
    marginBottom: spacing.lg,
  },
  aiBannerText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gold,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.goldMuted,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  aiBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.gold,
    letterSpacing: 0.5,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.cardElevated,
    borderRadius: radii.md,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.lg,
  },
  footerText: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },
});
