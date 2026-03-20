import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { trpc } from '../lib/trpc';
import { trackEvent } from '../lib/analytics';
import { colors, shadows, typography } from '../lib/theme';
import { AnimatedCard } from '../components/AnimatedCard';
import { EmptyState } from '../components/EmptyState';
import { Loading } from '../components/Loading';

function ReportSkeleton() {
  return (
    <View style={styles.skeletonWrap}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={styles.reportCard}>
          <View style={[styles.skeletonBlock, { width: 100, height: 12, marginBottom: 8 }]} />
          <View style={[styles.skeletonBlock, { width: '80%', height: 16, marginBottom: 6 }]} />
          <View style={[styles.skeletonBlock, { width: '60%', height: 12 }]} />
        </View>
      ))}
    </View>
  );
}

export default function ProgressReportsScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [generating, setGenerating] = useState(false);

  const me = trpc.auth.me.useQuery();
  const generateReport = trpc.progressReports.generate.useMutation({
    onSuccess: (data) => {
      setSelectedReport({
        report: data.report,
        athleteName: data.athleteName,
        generatedAt: new Date().toISOString(),
      });
      trackEvent('progress_report_generated');
      setGenerating(false);
    },
    onError: () => {
      setGenerating(false);
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await me.refetch();
    setRefreshing(false);
  };

  const onGenerate = () => {
    if (!me.data?.id || generating) return;
    setGenerating(true);
    generateReport.mutate({ athleteId: me.data.id });
  };

  if (me.isLoading) {
    return <Loading />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Progress Reports</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Generate Report Card */}
        <AnimatedCard index={0}>
          <View style={styles.generateCard}>
            <View style={styles.generateIconWrap}>
              <Ionicons name="sparkles" size={24} color={colors.gold} />
            </View>
            <Text style={styles.generateTitle}>AI Progress Report</Text>
            <Text style={styles.generateDesc}>
              Generate a personalized progress report based on your metrics, attendance, and achievements.
            </Text>
            <TouchableOpacity
              style={[styles.generateBtn, generating && { opacity: 0.5 }]}
              onPress={onGenerate}
              disabled={generating}
              activeOpacity={0.7}
            >
              {generating ? (
                <ActivityIndicator size="small" color={colors.card} />
              ) : (
                <>
                  <Ionicons name="document-text-outline" size={18} color={colors.card} />
                  <Text style={styles.generateBtnText}>Generate Report</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </AnimatedCard>

        {/* Info Card */}
        <AnimatedCard index={1}>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.infoText}>
              Reports are also generated automatically bi-weekly and sent to parents via email.
              Use the button above to generate one on demand.
            </Text>
          </View>
        </AnimatedCard>

        {/* Show generated report */}
        {selectedReport && (
          <AnimatedCard index={2}>
            <View style={styles.reportCard}>
              <View style={styles.reportHeader}>
                <View>
                  <Text style={styles.reportDate}>
                    {new Date(selectedReport.generatedAt).toLocaleDateString(undefined, {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Text>
                  <Text style={styles.reportName}>
                    {selectedReport.athleteName ?? 'Athlete'}'s Report
                  </Text>
                </View>
                <Ionicons name="document-text" size={20} color={colors.gold} />
              </View>
              <View style={styles.reportDivider} />
              <Text style={styles.reportContent}>
                {stripHtml(selectedReport.report)}
              </Text>
            </View>
          </AnimatedCard>
        )}

        {/* Empty state when no report generated yet */}
        {!selectedReport && !generating && (
          <View style={styles.emptyWrapper}>
            <Ionicons name="document-text-outline" size={56} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No progress reports yet</Text>
            <Text style={styles.emptySubtitle}>
              Reports are generated bi-weekly. You can also generate one on demand above.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// Simple HTML strip for display (server returns HTML)
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n\s*\n/g, '\n\n')
    .trim();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    ...typography.heading,
    fontSize: 18,
  },
  headerRight: {
    width: 44,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  skeletonWrap: {
    padding: 16,
    gap: 12,
  },
  skeletonBlock: {
    backgroundColor: colors.skeletonBase,
    borderRadius: 6,
  },
  // Generate
  generateCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    ...shadows.card,
  },
  generateIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.goldMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  generateTitle: {
    fontFamily: 'BebasNeue',
    fontSize: 24,
    color: colors.textPrimary,
    marginBottom: 6,
  },
  generateDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.gold,
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 14,
    minHeight: 48,
    ...shadows.glow,
  },
  generateBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.card,
  },
  // Info
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    ...shadows.subtle,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  // Report Card
  reportCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 18,
    marginBottom: 12,
    ...shadows.card,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  reportDate: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
  },
  reportName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  reportDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  reportContent: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  // Empty
  emptyWrapper: {
    padding: 48,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
