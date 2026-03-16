import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors } from '../lib/theme';

interface SkeletonProps {
  width: number | `${number}%`;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

/**
 * Animated skeleton placeholder with shimmer effect.
 * Uses Reanimated for smooth 60fps opacity pulse.
 */
export function Skeleton({ width, height, borderRadius = 6, style }: SkeletonProps) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.4, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.skeletonBase,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

/** Circle skeleton (for avatars). */
export function SkeletonCircle({ size = 44, style }: { size?: number; style?: ViewStyle }) {
  return <Skeleton width={size} height={size} borderRadius={size / 2} style={style} />;
}

/** Full-width line skeleton (for text rows). */
export function SkeletonLine({
  width = '100%',
  height = 12,
  style,
}: {
  width?: number | `${number}%`;
  height?: number;
  style?: ViewStyle;
}) {
  return <Skeleton width={width} height={height} borderRadius={6} style={style} />;
}

// ---------------------------------------------------------------------------
// Screen-specific skeleton layouts
// ---------------------------------------------------------------------------

/** Conversation list skeleton for Messages tab. */
export function ConversationListSkeleton() {
  return (
    <View style={skeletonStyles.container}>
      {/* New Conversation button skeleton */}
      <Skeleton width="100%" height={48} borderRadius={12} style={{ marginBottom: 16 }} />
      {[1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={skeletonStyles.conversationRow}>
          <SkeletonCircle size={44} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={skeletonStyles.headerRow}>
              <SkeletonLine width={100} height={14} />
              <SkeletonLine width={50} height={10} />
            </View>
            <SkeletonLine width="80%" height={12} style={{ marginTop: 6 }} />
          </View>
        </View>
      ))}
    </View>
  );
}

/** Message list skeleton for DM conversation. */
export function MessageListSkeleton() {
  return (
    <View style={skeletonStyles.messageContainer}>
      {/* Alternating left/right message bubbles */}
      {[
        { isOwn: false, w: '65%' as const },
        { isOwn: false, w: '45%' as const },
        { isOwn: true, w: '55%' as const },
        { isOwn: true, w: '40%' as const },
        { isOwn: false, w: '70%' as const },
        { isOwn: true, w: '50%' as const },
      ].map((msg, i) => (
        <View
          key={i}
          style={[
            skeletonStyles.messageBubble,
            msg.isOwn ? skeletonStyles.messageRight : skeletonStyles.messageLeft,
          ]}
        >
          {!msg.isOwn && i === 0 && (
            <SkeletonLine width={60} height={10} style={{ marginBottom: 4 }} />
          )}
          <Skeleton width={msg.w} height={14} borderRadius={4} />
          <SkeletonLine width={40} height={8} style={{ marginTop: 6, alignSelf: msg.isOwn ? 'flex-end' : 'flex-start' }} />
        </View>
      ))}
    </View>
  );
}

/** Chat room list skeleton. */
export function ChatRoomListSkeleton() {
  return (
    <View style={skeletonStyles.container}>
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={skeletonStyles.channelRow}>
          <Skeleton width={44} height={44} borderRadius={12} />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <SkeletonLine width={100} height={14} />
            <SkeletonLine width="70%" height={12} style={{ marginTop: 4 }} />
          </View>
          <Skeleton width={20} height={20} borderRadius={4} />
        </View>
      ))}
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  container: {
    padding: 16,
  },
  conversationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messageContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 10,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    maxWidth: '80%',
  },
  messageLeft: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
  },
  messageRight: {
    alignSelf: 'flex-end',
    backgroundColor: colors.cardElevated,
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
});
