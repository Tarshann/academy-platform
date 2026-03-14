import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Linking,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useState, useCallback } from 'react';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { trpc } from '../../lib/trpc';
import { trackEvent } from '../../lib/analytics';

const ACADEMY_GOLD = '#CFB87C';
const NAVY = '#1a1a2e';
const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_PADDING = 16;
const IMAGE_WIDTH = SCREEN_WIDTH - CARD_PADDING * 2;

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

function FeedCard({ item }: { item: FeedItem }) {
  const trackViewMutation = trpc.videos.trackView.useMutation();

  const handlePress = useCallback(() => {
    trackEvent('media_feed_item_tapped', {
      type: item.type,
      id: item.id,
      platform: item.platform,
    });

    if (item.type === 'video' && item.mediaUrl) {
      // Track view and open in browser/native app
      const numericId = parseInt(item.id.replace('video-', ''), 10);
      if (!isNaN(numericId)) {
        trackViewMutation.mutate({ id: numericId });
      }
      Linking.openURL(item.mediaUrl);
    }
  }, [item]);

  const isVideo = item.type === 'video';
  const imageSource = isVideo
    ? item.thumbnail
      ? { uri: item.thumbnail }
      : null
    : { uri: item.mediaUrl };

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={isVideo ? 0.7 : 0.9}
      onPress={isVideo ? handlePress : undefined}
      disabled={!isVideo}
    >
      {/* Media */}
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
              color={ACADEMY_GOLD}
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
              <Ionicons name="eye-outline" size={12} color="#999" />
              <Text style={styles.viewCountText}>{item.viewCount}</Text>
            </View>
          )}
          <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function MediaFeedScreen() {
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [refreshing, setRefreshing] = useState(false);

  const feed = trpc.feed.list.useQuery({
    limit: 50,
    offset: 0,
    category,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await feed.refetch();
    setRefreshing(false);
  };

  const renderItem = useCallback(
    ({ item }: { item: FeedItem }) => <FeedCard item={item} />,
    []
  );

  return (
    <View style={styles.container}>
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

            {/* Empty */}
            {!feed.isLoading && (feed.data?.items?.length ?? 0) === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="film-outline" size={48} color="#ccc" />
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
              color={ACADEMY_GOLD}
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
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    padding: CARD_PADDING,
    paddingBottom: 32,
  },
  // Skeleton
  skeletonBlock: {
    backgroundColor: '#e8e8e8',
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
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minHeight: 36,
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: NAVY,
    borderColor: NAVY,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  filterChipTextActive: {
    color: ACADEMY_GOLD,
  },
  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
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
    backgroundColor: NAVY,
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
    color: NAVY,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
    color: '#666',
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
    backgroundColor: '#f0e8d5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: NAVY,
  },
  viewCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  viewCountText: {
    fontSize: 11,
    color: '#999',
  },
  dateText: {
    fontSize: 11,
    color: '#999',
    marginLeft: 'auto',
  },
  // Empty
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: NAVY,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
