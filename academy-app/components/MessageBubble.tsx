import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, GestureResponderEvent } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { ImageViewer } from './ImageViewer';
import { colors, spacing } from '../lib/theme';

interface Reaction {
  userId: number;
  emoji: string;
}

interface MessageBubbleProps {
  message: string;
  senderName: string;
  timestamp: string;
  isOwn: boolean;
  showSender: boolean;
  imageUrl?: string | null;
  reactions?: Reaction[];
  currentUserId?: number;
  onReact?: (emoji: string) => void;
  onRemoveReact?: (emoji: string) => void;
}

export function MessageBubble({
  message,
  senderName,
  timestamp,
  isOwn,
  showSender,
  imageUrl,
  reactions = [],
  currentUserId,
  onReact,
  onRemoveReact,
}: MessageBubbleProps) {
  const [viewerVisible, setViewerVisible] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  const REACTION_PRESETS = ['👍', '❤️', '🔥', '👏', '😂', '💪'];

  // Group reactions by emoji
  const reactionGroups = reactions.reduce((acc, r) => {
    const existing = acc.find((g) => g.emoji === r.emoji);
    if (existing) {
      existing.count += 1;
      existing.userIds.add(r.userId);
    } else {
      acc.push({ emoji: r.emoji, count: 1, userIds: new Set([r.userId]) });
    }
    return acc;
  }, [] as Array<{ emoji: string; count: number; userIds: Set<number> }>);

  const handleLongPress = () => {
    setShowReactionPicker(true);
  };

  const handleReactionSelect = (emoji: string) => {
    const hasReacted = reactionGroups.some(
      (g) => g.emoji === emoji && g.userIds.has(currentUserId!)
    );

    if (hasReacted) {
      onRemoveReact?.(emoji);
    } else {
      onReact?.(emoji);
    }
    setShowReactionPicker(false);
  };

  const time = new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const hasImage = !!imageUrl;
  const isImageOnly = hasImage && (!message || message === ' ');

  return (
    <View style={[styles.container, isOwn ? styles.ownContainer : styles.otherContainer]}>
      {/* Long-press overlay for reaction picker */}
      {showReactionPicker && (
        <View style={styles.reactionPickerOverlay}>
          <View style={styles.reactionPickerContainer}>
            {REACTION_PRESETS.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                style={styles.reactionOption}
                onPress={() => handleReactionSelect(emoji)}
              >
                <Text style={styles.reactionEmoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <TouchableOpacity
        activeOpacity={0.7}
        onLongPress={handleLongPress}
        delayLongPress={500}
      >
        <View style={[styles.bubble, isOwn ? styles.ownBubble : styles.otherBubble]}>
          {!isOwn && showSender && (
            <Text style={styles.senderName}>{senderName}</Text>
          )}

          {/* Image with skeleton loading, error state, and tap-to-fullscreen */}
          {hasImage && !imageError && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setViewerVisible(true)}
              style={styles.imageWrapper}
            >
              {/* Skeleton placeholder shown while loading */}
              {!imageLoaded && (
                <View style={styles.imageSkeleton}>
                  <Ionicons name="image-outline" size={32} color={colors.textMuted} />
                </View>
              )}
              <Image
                source={{ uri: imageUrl }}
                style={[styles.image, !imageLoaded && styles.imageHidden]}
                contentFit="cover"
                transition={200}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
              />
            </TouchableOpacity>
          )}

          {/* Error state for failed image load */}
          {hasImage && imageError && (
            <View style={styles.imageErrorContainer}>
              <Ionicons name="alert-circle-outline" size={24} color={colors.textSecondary} />
              <Text style={styles.imageErrorText}>Image failed to load</Text>
            </View>
          )}

          {/* Text message (hide if image-only message) */}
          {!isImageOnly && (
            <Text style={[styles.messageText, isOwn && styles.ownMessageText]}>
              {message}
            </Text>
          )}

          <Text style={[styles.timestamp, isOwn && styles.ownTimestamp]}>{time}</Text>
        </View>
      </TouchableOpacity>

      {/* Reaction chips */}
      {reactionGroups.length > 0 && (
        <View style={[styles.reactionsContainer, isOwn && styles.reactionsContainerOwn]}>
          {reactionGroups.map((group) => {
            const userHasReacted = group.userIds.has(currentUserId!);
            return (
              <TouchableOpacity
                key={group.emoji}
                style={[
                  styles.reactionChip,
                  userHasReacted && styles.reactionChipActive,
                ]}
                onPress={() => handleReactionSelect(group.emoji)}
              >
                <Text style={styles.reactionChipEmoji}>{group.emoji}</Text>
                <Text style={styles.reactionChipCount}>{group.count}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Fullscreen viewer */}
      {hasImage && imageUrl && (
        <ImageViewer
          visible={viewerVisible}
          imageUrl={imageUrl}
          onClose={() => setViewerVisible(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  ownContainer: {
    alignItems: 'flex-end',
  },
  otherContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  ownBubble: {
    backgroundColor: colors.cardElevated,
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 4,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gold,
    marginBottom: 4,
  },
  imageWrapper: {
    marginBottom: 6,
    borderRadius: 10,
    overflow: 'hidden',
  },
  image: {
    width: 220,
    height: 165,
    borderRadius: 10,
  },
  imageHidden: {
    position: 'absolute',
    opacity: 0,
  },
  imageSkeleton: {
    width: 220,
    height: 165,
    borderRadius: 10,
    backgroundColor: colors.skeletonBase,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageErrorContainer: {
    width: 220,
    height: 100,
    borderRadius: 10,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  imageErrorText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  messageText: {
    fontSize: 15,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  ownMessageText: {
    color: colors.textPrimary,
  },
  timestamp: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  ownTimestamp: {
    color: 'rgba(255,255,255,0.6)',
  },
  reactionPickerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  reactionPickerContainer: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 4,
    ...StyleSheet.absoluteFill,
  },
  reactionOption: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactionEmoji: {
    fontSize: 24,
  },
  reactionsContainer: {
    flexDirection: 'row',
    marginTop: 4,
    marginLeft: 12,
    gap: 4,
    flexWrap: 'wrap',
  },
  reactionsContainerOwn: {
    justifyContent: 'flex-end',
    marginRight: 12,
    marginLeft: 0,
  },
  reactionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reactionChipActive: {
    backgroundColor: colors.goldMuted,
    borderColor: colors.gold,
  },
  reactionChipEmoji: {
    fontSize: 14,
  },
  reactionChipCount: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '500',
  },
});
