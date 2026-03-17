import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Linking,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useState, useCallback } from 'react';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { trpc } from '../../lib/trpc';
import { trackEvent } from '../../lib/analytics';
import { colors, shadows, typography } from '../../lib/theme';
import { AnimatedCard } from '../../components/AnimatedCard';
import { GlassCard } from '../../components/GradientCard';
import { ImageViewer } from '../../components/ImageViewer';

type FeedItem = {
  id: string;
  type: 'video' | 'photo';
  title: string;
  description: string | null;
  mediaUrl: string;
  thumbnail: string | null;
  platform: string | null;
  category: string;
  viewCount: number;
  createdAt: string;
};

type CategoryFilter = 'all' | 'training' | 'highlights';

const CATEGORIES: { key: CategoryFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'training', label: 'Training' },
  { key: 'highlights', label: 'Highlights' },
];

function getPlatformIcon(platform: string | null): keyof typeof Ionicons.glyphMap {
  switch (platform) {
    case 'tiktok':
      return 'logo-tiktok';
    case 'instagram':
      return 'logo-instagram';
    default:
      return 'play-circle-outline';
  }
}

function getPlatformLabel(platform: string | null): string {
  switch (platform) {
    case 'tiktok':
      return 'TikTok';
    case 'instagram':
      return 'Instagram';
    default:
      return 'Video';
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function FeedCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={[styles.skeletonBlock, { width: '100%', height: 200, borderRadius: 12 }]} />
      <View style={{ padding: 12, gap: 8 }}>
        <View style={[styles.skeletonBlock, { width: '70%', height: 16 }]} />
        <View style={[styles.skeletonBlock, { width: '40%', height: 12 }]} />
      </View>
    </View>
  );
}

function MediaImage({
  item,
  imageSource,
  isVideo,
}: {
  item: FeedItem;
  imageSource: { uri: string } | null;
  isVideo: boolean;
}) {
  return (
    <View style={styles.mediaContainer}>
      {imageSource ? (
        <Image
          source={imageSource}
          style={styles.mediaImage}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <View style={[styles.mediaImage, styles.placeholderImage]}>
          <Ionicons
            name={getPlatformIcon(item.platform)}
            size={48}
            color={colors.gold}
          />
        </View>
      )}

      {/* Video overlay */}
      {isVideo && (
        <View style={styles.videoOverlay}>
          <View style={styles.playButton}>
            <Ionicons name="play" size={24} color="#fff" />
          </View>
        </View>
      )}

      {/* Type badge */}
      <View style={[styles.typeBadge, isVideo ? styles.videoBadge : styles.photoBadge]}>
        <Ionicons
          name={isVideo ? getPlatformIcon(item.platform) : 'image-outline'}
          size={12}
          color="#fff"
        />
        <Text style={styles.typeBadgeText}>
          {isVideo ? getPlatformLabel(item.platform) : 'Photo'}
        </Text>
      </View>
    </View>
  );
}

function FeedCard({
  item,
  onVideoPress,
  onPhotoPress,
}: {
  item: FeedItem;
  onVideoPress: (item: FeedItem) => void;
  onPhotoPress: (item: FeedItem) => void;
}) {
  const isVideo = item.type === 'video';
  const imageSource = isVideo
    ? item.thumbnail
      ? { uri: item.thumbnail }
      : null
    : { uri: item.mediaUrl };

  return (
    <View style={styles.card}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => (isVideo ? onVideoPress(item) : onPhotoPress(item))}
      >
        <MediaImage item={item} imageSource={imageSource} isVideo={isVideo} />
      </TouchableOpacity>

      {/* Info */}
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title}
        </Text>
        {item.description ? (
          <Text style={styles.cardDescription} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}
        <View style={styles.cardMeta}>
          <View style={styles.categoryTag}>
            <Text style={styles.categoryTagText}>
              {item.category === 'training' ? 'Training' : 'Highlights'}
            </Text>
          </View>
          {isVideo && item.viewCount > 0 && (
            <View style={styles.viewCount}>
              <Ionicons name="eye-outline" size={12} color={colors.textMuted} />
              <Text style={styles.viewCountText}>{item.viewCount}</Text>
            </View>
          )}
          <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
        </View>
      </View>
    </View>
  );
}

export default function MediaFeedScreen() {
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [viewerImage, setViewerImage] = useState<string | null>(null);

  const feed = trpc.feed.list.useQuery({
    limit: 50,
    offset: 0,
    category,
  });

  const trackViewMutation = trpc.videos.trackView.useMutation();

  const handlePhotoPress = useCallback((item: FeedItem) => {
    trackEvent('media_feed_photo_tapped', { id: item.id });
    setViewerImage(item.mediaUrl);
  }, []);

  const handleVideoPress = useCallback(
    (item: FeedItem) => {
      trackEvent('media_feed_item_tapped', {
        type: item.type,
        id: item.id,
        platform: item.platform,
      });

      const numericId = parseInt(item.id.replace('video-', ''), 10);
      if (!isNaN(numericId)) {
        trackViewMutation.mutate({ id: numericId });
      }
      Linking.openURL(item.mediaUrl).catch(() =>
        Alert.alert('Error', 'Could not open this media.')
      );
    },
    [trackViewMutation]
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await feed.refetch();
    setRefreshing(false);
  };

  const renderItem = useCallback(
    ({ item, index }: { item: FeedItem; index: number }) => (
      <AnimatedCard index={index}>
        <FeedCard item={item} onVideoPress={handleVideoPress} onPhotoPress={handlePhotoPress} />
      </AnimatedCard>
    ),
    [handleVideoPress, handlePhotoPress]
  );

  return (
    <View style={styles.container}>
      <ImageViewer
        visible={!!viewerImage}
        imageUrl={viewerImage ?? ''}
        onClose={() => setViewerImage(null)}
      />
      <FlatList
        data={feed.data?.items ?? []}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <View>
            {/* Category Filter */}
            <View style={styles.filterRow}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.key}
                  style={[
                    styles.filterChip,
                    category === cat.key && styles.filterChipActive,
                  ]}
                  onPress={() => {
                    setCategory(cat.key);
                    trackEvent('media_feed_filter', { category: cat.key });
                  }}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      category === cat.key && styles.filterChipTextActive,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Loading */}
            {feed.isLoading && (
              <View style={{ gap: 16 }}>
                <FeedCardSkeleton />
                <FeedCardSkeleton />
                <FeedCardSkeleton />
              </View>
            )}

            {/* Error */}
            {feed.isError && (
              <View style={styles.emptyState}>
                <Ionicons name="alert-circle-outline" size={48} color="#e74c3c" />
                <Text style={styles.emptyTitle}>Failed to load media</Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={() => feed.refetch()}
                >
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Empty */}
            {!feed.isLoading && !feed.isError && (feed.data?.items?.length ?? 0) === 0 && (
              <View style={styles.emptyState}>
                <GlassCard style={{ padding: 40, alignItems: 'center' }}>
                  <Ionicons name="film-outline" size={48} color={colors.textMuted} />
                </GlassCard>
                <Text style={styles.emptyTitle}>No media yet</Text>
                <Text style={styles.emptySubtitle}>
                  Check back soon for training clips and highlights!
                </Text>
              </View>
            )}
          </View>
        }
        ListFooterComponent={
          feed.isFetching && !feed.isLoading ? (
            <ActivityIndicator
              size="small"
              color={colors.gold}
              style={{ paddingVertical: 20 }}
            />
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  // Skeleton
  skeletonBlock: {
    backgroundColor: colors.skeletonBase,
    borderRadius: 6,
  },
  // Filter
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 36,
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: colors.cardElevated,
    borderColor: colors.cardElevated,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: colors.gold,
  },
  // Card
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    marginBottom: 16,
    ...shadows.card,
    overflow: 'hidden',
  },
  // Media
  mediaContainer: {
    position: 'relative',
    width: '100%',
    height: 220,
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    backgroundColor: colors.cardElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 4,
  },
  typeBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  videoBadge: {
    backgroundColor: 'rgba(26, 26, 46, 0.85)',
  },
  photoBadge: {
    backgroundColor: 'rgba(26, 26, 46, 0.7)',
  },
  typeBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  // Card Info
  cardInfo: {
    padding: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  categoryTag: {
    backgroundColor: colors.goldMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.gold,
  },
  viewCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  viewCountText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  dateText: {
    fontSize: 11,
    color: colors.textMuted,
    marginLeft: 'auto',
  },
  // Empty / Error
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 8,
    backgroundColor: colors.cardElevated,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.gold,
    fontSize: 14,
    fontWeight: '600',
  },
});
