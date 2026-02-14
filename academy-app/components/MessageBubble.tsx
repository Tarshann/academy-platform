import { View, Text, Image, StyleSheet } from 'react-native';

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
  const time = new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={[styles.container, isOwn ? styles.ownContainer : styles.otherContainer]}>
      <View style={[styles.bubble, isOwn ? styles.ownBubble : styles.otherBubble]}>
        {!isOwn && showSender && (
          <Text style={styles.senderName}>{senderName}</Text>
        )}
        {imageUrl && (
          <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
        )}
        <Text style={[styles.messageText, isOwn && styles.ownMessageText]}>
          {message}
        </Text>
        <Text style={[styles.timestamp, isOwn && styles.ownTimestamp]}>{time}</Text>
      </View>
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
  image: {
    width: 200,
    height: 150,
    borderRadius: 10,
    marginBottom: 6,
  },
});
