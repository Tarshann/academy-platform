import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { ImageViewer } from './ImageViewer';
import { colors } from '../lib/theme';

const REACTION_PRESETS = ['👍', '❤️', '🔥', '👏', '😂', '💪'];

interface ReactionGroup {
  emoji: string;
  count: number;
  userReacted: boolean;
}

interface MessageBubbleProps {
  message: string;
  senderName: string;
  timestamp: string;
  isOwn: boolean;
  showSender: boolean;
  imageUrl?: string | null;
  reactions?: ReactionGroup[];
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
  reactions,
  onReact,
  onRemoveReact,
}: MessageBubbleProps) {
  const [viewerVisible, setViewerVisible] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  const time = new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const hasImage = !!imageUrl;
  const isImageOnly = hasImage && (!message || message === ' ');
  const hasReactions = reactions && reactions.length > 0;

  const handleReactionTap = (emoji: string, userReacted: boolean) => {
    if (userReacted && onRemoveReact) {
      onRemoveReact(emoji);
    } else if (!userReacted && onReact) {
      onReact(emoji);
    }
  };

  return (
    <View style={[styles.container, isOwn ? styles.ownContainer : styles.otherContainer]}>
      <Pressable
        onLongPress={() => setShowReactionPicker(true)}
        delayLongPress={400}
        style={[styles.bubble, isOwn ? styles.ownBubble : styles.otherBubble]}
      >
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
      </Pressable>

      {/* Reaction chips below the bubble */}
      {hasReactions && (
        <View style={[styles.reactionsRow, isOwn ? styles.reactionsRowOwn : styles.reactionsRowOther]}>
          {reactions.map((r) => (
            <TouchableOpacity
              key={r.emoji}
              style={[styles.reactionChip, r.userReacted && styles.reactionChipActive]}
              onPress={() => handleReactionTap(r.emoji, r.userReacted)}
              activeOpacity={0.7}
            >
              <Text style={styles.reactionEmoji}>{r.emoji}</Text>
              <Text style={[styles.reactionCount, r.userReacted && styles.reactionCountActive]}>
                {r.count}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Long-press reaction picker */}
      {showReactionPicker && (
        <View style={[styles.reactionPicker, isOwn ? styles.reactionPickerOwn : styles.reactionPickerOther]}>
          {REACTION_PRESETS.map((emoji) => (
            <TouchableOpacity
              key={emoji}
              style={styles.reactionPickerItem}
              onPress={() => {
                if (onReact) onReact(emoji);
                setShowReactionPicker(false);
              }}
              activeOpacity={0.6}
            >
              <Text style={styles.reactionPickerEmoji}>{emoji}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.reactionPickerItem}
            onPress={() => setShowReactionPicker(false)}
            activeOpacity={0.6}
          >
            <Ionicons name="close-circle-outline" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
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
  reactionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 2,
    gap: 4,
    maxWidth: '80%',
  },
  reactionsRowOwn: {
    justifyContent: 'flex-end',
  },
  reactionsRowOther: {
    justifyContent: 'flex-start',
  },
  reactionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  reactionChipActive: {
    borderColor: colors.gold,
    backgroundColor: 'rgba(207, 184, 124, 0.15)',
  },
  reactionEmoji: {
    fontSize: 14,
    marginRight: 3,
  },
  reactionCount: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  reactionCountActive: {
    color: colors.gold,
  },
  reactionPicker: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 24,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginTop: 4,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    gap: 2,
  },
  reactionPickerOwn: {
    alignSelf: 'flex-end',
  },
  reactionPickerOther: {
    alignSelf: 'flex-start',
  },
  reactionPickerItem: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
  },
  reactionPickerEmoji: {
    fontSize: 22,
  },
});
