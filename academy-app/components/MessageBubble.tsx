import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { ImageViewer } from './ImageViewer';

const ACADEMY_GOLD = '#CFB87C';

interface MessageBubbleProps {
  message: string;
  senderName: string;
  timestamp: string;
  isOwn: boolean;
  showSender: boolean;
  imageUrl?: string | null;
}

export function MessageBubble({
  message,
  senderName,
  timestamp,
  isOwn,
  showSender,
  imageUrl,
}: MessageBubbleProps) {
  const [viewerVisible, setViewerVisible] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const time = new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const hasImage = !!imageUrl;
  const isImageOnly = hasImage && (!message || message === ' ');

  return (
    <View style={[styles.container, isOwn ? styles.ownContainer : styles.otherContainer]}>
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
                <Ionicons name="image-outline" size={32} color="#ccc" />
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
            <Ionicons name="alert-circle-outline" size={24} color="#999" />
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
    backgroundColor: '#1a1a2e',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#e8e8ed',
    borderBottomLeftRadius: 4,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: ACADEMY_GOLD,
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
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageErrorContainer: {
    width: 220,
    height: 100,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  imageErrorText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  messageText: {
    fontSize: 15,
    color: '#1a1a2e',
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#fff',
  },
  timestamp: {
    fontSize: 10,
    color: '#888',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  ownTimestamp: {
    color: 'rgba(255,255,255,0.6)',
  },
});
