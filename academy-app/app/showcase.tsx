import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { useState } from 'react';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { trpc } from '../lib/trpc';
import { ScreenHeader } from '../components/ScreenHeader';
import { trackEvent } from '../lib/analytics';
import { colors, shadows } from '../lib/theme';

function ShowcaseSkeleton() {
  return (
    <View style={styles.card}>
      <View style={[styles.skeletonBlock, { width: '100%', height: 200 }]} />
      <View style={{ padding: 16, gap: 10 }}>
        <View style={[styles.skeletonBlock, { width: '60%', height: 20 }]} />
        <View style={[styles.skeletonBlock, { width: '100%', height: 14 }]} />
        <View style={[styles.skeletonBlock, { width: '80%', height: 14 }]} />
      </View>
    </View>
  );
}

function SportBadge({ sport }: { sport: string | null }) {
  if (!sport) return null;
  const label = sport.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <View style={styles.sportBadge}>
      <Ionicons name="trophy-outline" size={12} color={colors.gold} />
      <Text style={styles.sportBadgeText}>{label}</Text>
    </View>
  );
}

export default function ShowcaseScreen() {
  const [refreshing, setRefreshing] = useState(false);

  const showcases = trpc.showcases.active.useQuery();

  const onRefresh = async () => {
    setRefreshing(true);
    await showcases.refetch();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Athlete Showcase" />

      <FlatList
        data={showcases.data ?? []}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <View>
            {/* Hero Section */}
            <View style={styles.heroSection}>
              <Ionicons name="star" size={28} color={colors.gold} />
              <Text style={styles.heroTitle}>ATHLETE OF THE WEEK</Text>
              <Text style={styles.heroSubtitle}>
                Celebrating outstanding Academy athletes
              </Text>
            </View>

            {showcases.isLoading && (
              <View style={{ gap: 16 }}>
                <ShowcaseSkeleton />
                <ShowcaseSkeleton />
              </View>
            )}

            {showcases.isError && (
              <View style={styles.emptyState}>
                <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
                <Text style={styles.emptyTitle}>Failed to load showcases</Text>
                <Text style={styles.emptySubtitle}>
                  Something went wrong. Please try again.
                </Text>
                <Pressable
                  onPress={() => showcases.refetch()}
                  style={styles.retryButton}
                  accessibilityLabel="Try again"
                  accessibilityRole="button"
                >
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </Pressable>
              </View>
            )}

            {!showcases.isLoading && !showcases.isError && (showcases.data?.length ?? 0) === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={48} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>No showcases yet</Text>
                <Text style={styles.emptySubtitle}>
                  Check back to see featured Academy athletes!
                </Text>
              </View>
            )}
          </View>
        }
        renderItem={({ item, index }) => {
          let achievements: string[] = [];
          try {
            achievements = item.achievements ? JSON.parse(item.achievements) : [];
          } catch {}

          let stats: Record<string, string> = {};
          try {
            stats = item.stats ? JSON.parse(item.stats) : {};
          } catch {}

          return (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.9}
              onPress={() => trackEvent('showcase_tapped', { id: item.id })}
              accessibilityLabel={`View showcase: ${item.title}`}
              accessibilityRole="button"
            >
              {/* Spotlight Number */}
              {index === 0 && (
                <View style={styles.spotlightBanner}>
                  <Ionicons name="star" size={14} color="#fff" />
                  <Text style={styles.spotlightText}>CURRENT SPOTLIGHT</Text>
                </View>
              )}

              {/* Image */}
              {item.imageUrl ? (
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.cardImage}
                  contentFit="cover"
                  transition={200}
                  accessibilityLabel={`Photo of ${item.title}`}
                />
              ) : (
                <View style={[styles.cardImage, styles.placeholderImage]}>
                  <Ionicons name="person-outline" size={48} color={colors.gold} />
                </View>
              )}

              {/* Content */}
              <View style={styles.cardContent}>
                <View style={styles.titleRow}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <SportBadge sport={item.sport} />
                </View>

                <Text style={styles.cardDescription}>{item.description}</Text>

                {/* Stats Grid */}
                {Object.keys(stats).length > 0 && (
                  <View style={styles.statsGrid}>
                    {Object.entries(stats).map(([key, value]) => (
                      <View key={key} style={styles.statBox}>
                        <Text style={styles.statValue}>{value}</Text>
                        <Text style={styles.statLabel}>{key}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Achievements */}
                {achievements.length > 0 && (
                  <View style={styles.achievementsList}>
                    <Text style={styles.achievementsHeader}>ACHIEVEMENTS</Text>
                    {achievements.map((achievement, i) => (
                      <View key={i} style={styles.achievementRow}>
                        <Ionicons name="medal-outline" size={14} color={colors.gold} />
                        <Text style={styles.achievementText}>{achievement}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Featured Date */}
                <Text style={styles.featuredDate}>
                  Featured {new Date(item.featuredFrom).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  listContent: { paddingBottom: 32 },
  heroSection: {
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingVertical: 24,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.gold,
    letterSpacing: 2,
    marginTop: 8,
  },
  heroSubtitle: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 20,
    overflow: 'hidden',
    ...shadows.card,
  },
  spotlightBanner: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.gold,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  spotlightText: { fontSize: 11, fontWeight: '800', color: colors.textPrimary, letterSpacing: 1 },
  cardImage: { width: '100%', height: 240 },
  placeholderImage: {
    backgroundColor: colors.cardElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: { padding: 18 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary, flex: 1 },
  sportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.goldMuted,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sportBadgeText: { fontSize: 11, fontWeight: '600', color: colors.gold },
  cardDescription: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginBottom: 14 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  statBox: {
    backgroundColor: colors.cardElevated,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    minWidth: 80,
  },
  statValue: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  statLabel: { fontSize: 10, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', marginTop: 2 },
  achievementsList: { marginBottom: 14 },
  achievementsHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: 8,
  },
  achievementRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  achievementText: { fontSize: 13, color: colors.textSecondary },
  featuredDate: { fontSize: 12, color: colors.textMuted, fontStyle: 'italic' },
  skeletonBlock: { backgroundColor: colors.skeletonBase, borderRadius: 6 },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: colors.textPrimary },
  emptySubtitle: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
  retryButton: {
    marginTop: 8,
    backgroundColor: colors.cardElevated,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  retryButtonText: {
    color: colors.gold,
    fontSize: 14,
    fontWeight: '600',
  },
});
