import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Linking,
  Alert,
} from 'react-native';
import { useState, useCallback } from 'react';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { trpc } from '../lib/trpc';
import { trackEvent } from '../lib/analytics';
import { colors, shadows } from '../lib/theme';

type PlatformFilter = 'all' | 'instagram' | 'tiktok' | 'twitter' | 'facebook' | 'youtube';

const PLATFORMS: { key: PlatformFilter; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'all', label: 'All', icon: 'apps-outline' },
  { key: 'instagram', label: 'Instagram', icon: 'logo-instagram' },
  { key: 'tiktok', label: 'TikTok', icon: 'logo-tiktok' },
  { key: 'twitter', label: 'X', icon: 'logo-twitter' },
  { key: 'facebook', label: 'Facebook', icon: 'logo-facebook' },
  { key: 'youtube', label: 'YouTube', icon: 'logo-youtube' },
];

function getPlatformColor(platform: string): string {
  switch (platform) {
    case 'instagram': return '#E4405F';
    case 'tiktok': return '#000000';
    case 'twitter': return '#1DA1F2';
    case 'facebook': return '#1877F2';
    case 'youtube': return '#FF0000';
    default: return colors.card;
  }
}

function PostCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={[styles.skeletonBlock, { width: '100%', height: 250, borderRadius: 0 }]} />
      <View style={{ padding: 14, gap: 8 }}>
        <View style={[styles.skeletonBlock, { width: '80%', height: 14 }]} />
        <View style={[styles.skeletonBlock, { width: '50%', height: 12 }]} />
      </View>
    </View>
  );
}

export default function GalleryScreen() {
  const router = useRouter();
  const [platform, setPlatform] = useState<PlatformFilter>('all');
  const [refreshing, setRefreshing] = useState(false);

  const posts = trpc.socialPosts.list.useQuery();

  const filteredPosts = (posts.data ?? []).filter(
    (p) => platform === 'all' || p.platform === platform
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await posts.refetch();
    setRefreshing(false);
  };

  const handlePostPress = useCallback((post: any) => {
    trackEvent('gallery_post_tapped', { platform: post.platform, id: post.id });
    Linking.openURL(post.postUrl).catch(() => Alert.alert('Error', 'Could not open this link'));
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Social Gallery</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={filteredPosts}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <View>
            {/* Platform Filter */}
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={PLATFORMS}
              keyExtractor={(item) => item.key}
              contentContainerStyle={styles.filterRow}
              renderItem={({ item: plat }) => (
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    platform === plat.key && styles.filterChipActive,
                  ]}
                  onPress={() => setPlatform(plat.key)}
                >
                  <Ionicons
                    name={plat.icon}
                    size={14}
                    color={platform === plat.key ? colors.gold : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.filterChipText,
                      platform === plat.key && styles.filterChipTextActive,
                    ]}
                  >
                    {plat.label}
                  </Text>
                </TouchableOpacity>
              )}
            />

            {/* Loading */}
            {posts.isLoading && (
              <View style={styles.row}>
                <PostCardSkeleton />
                <PostCardSkeleton />
              </View>
            )}

            {/* Empty */}
            {!posts.isLoading && filteredPosts.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="images-outline" size={48} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>No posts yet</Text>
                <Text style={styles.emptySubtitle}>
                  Follow us on social media for the latest content!
                </Text>
              </View>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.gridCard}
            activeOpacity={0.8}
            onPress={() => handlePostPress(item)}
          >
            {item.thumbnailUrl ? (
              <Image
                source={{ uri: item.thumbnailUrl }}
                style={styles.gridImage}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <View style={[styles.gridImage, styles.placeholderImage]}>
                <Ionicons
                  name={PLATFORMS.find((p) => p.key === item.platform)?.icon ?? 'link-outline'}
                  size={32}
                  color={colors.gold}
                />
              </View>
            )}
            {/* Platform badge */}
            <View style={[styles.platformBadge, { backgroundColor: getPlatformColor(item.platform) }]}>
              <Ionicons
                name={PLATFORMS.find((p) => p.key === item.platform)?.icon ?? 'link-outline'}
                size={10}
                color="#fff"
              />
            </View>
            {item.caption && (
              <View style={styles.captionContainer}>
                <Text style={styles.caption} numberOfLines={2}>
                  {item.caption}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}
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
  listContent: { padding: 12, paddingBottom: 32 },
  row: { gap: 10 },
  filterRow: { gap: 8, paddingBottom: 16, paddingHorizontal: 4 },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: { backgroundColor: colors.cardElevated, borderColor: colors.gold },
  filterChipText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  filterChipTextActive: { color: colors.gold },
  gridCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 10,
    ...shadows.subtle,
    position: 'relative',
  },
  gridImage: { width: '100%', height: 160 },
  placeholderImage: {
    backgroundColor: colors.cardElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  platformBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captionContainer: { padding: 10 },
  caption: { fontSize: 12, color: colors.textSecondary, lineHeight: 16 },
  skeletonBlock: { backgroundColor: colors.skeletonBase, borderRadius: 6 },
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 10,
  },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: colors.textPrimary },
  emptySubtitle: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
});
