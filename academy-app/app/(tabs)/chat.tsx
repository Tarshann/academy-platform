import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { trackEvent } from '../../lib/analytics';
import { colors, shadows, typography } from '../../lib/theme';
import { AnimatedCard } from '../../components/AnimatedCard';
import { GlassCard } from '../../components/GradientCard';
import { LinearGradient } from 'expo-linear-gradient';
import { trpc } from '../../lib/trpc';

interface ChatChannel {
  id: string;
  name: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const CHANNELS: ChatChannel[] = [
  {
    id: 'general',
    name: 'General',
    description: 'Open discussion for all members',
    icon: 'chatbubbles-outline',
  },
  {
    id: 'coaches',
    name: 'Coaches',
    description: 'Coach coordination channel',
    icon: 'shield-outline',
  },
  {
    id: 'parents',
    name: 'Parents',
    description: 'Parent community & updates',
    icon: 'people-outline',
  },
  {
    id: 'announcements',
    name: 'Announcements',
    description: 'Official updates from The Academy',
    icon: 'megaphone-outline',
  },
];

export default function ChatScreen() {
  const router = useRouter();
  const { data: unreadCounts, refetch: refetchUnreadCounts } = trpc.chatEnhanced.getUnreadCounts.useQuery(
    undefined,
    { refetchInterval: 30000 } // Refetch every 30s
  );

  // Refetch unread counts when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refetchUnreadCounts();
    }, [refetchUnreadCounts])
  );

  const onRoomPress = (channel: ChatChannel) => {
    trackEvent('chat_room_opened', { room: channel.id, room_name: channel.name });
    router.push(`/chat/${channel.id}`);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={CHANNELS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => {
          const unreadCount = unreadCounts?.[item.id as keyof typeof unreadCounts] || 0;
          return (
            <AnimatedCard index={index} style={styles.animatedCardWrapper}>
              <View style={styles.cardContainer}>
                <TouchableOpacity
                  style={styles.channelCard}
                  onPress={() => onRoomPress(item)}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.iconContainer,
                    item.id === 'announcements' && styles.iconContainerAnnouncement,
                  ]}>
                    <Ionicons
                      name={item.icon}
                      size={24}
                      color={item.id === 'announcements' ? colors.card : colors.gold}
                    />
                  </View>
                  <View style={styles.channelInfo}>
                    <Text style={styles.channelName}>#{item.name}</Text>
                    <Text style={styles.channelDescription}>{item.description}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                </TouchableOpacity>
                {/* Unread badge */}
                {unreadCount > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                  </View>
                )}
              </View>
            </AnimatedCard>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    padding: 16,
  },
  animatedCardWrapper: {
    marginBottom: 10,
  },
  cardContainer: {
    position: 'relative',
  },
  channelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: colors.gold,
    ...shadows.card,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.cardElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  iconContainerAnnouncement: {
    backgroundColor: colors.gold,
    ...shadows.glow,
  },
  channelInfo: {
    flex: 1,
  },
  channelName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  channelDescription: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  unreadBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.gold,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.background,
  },
});
