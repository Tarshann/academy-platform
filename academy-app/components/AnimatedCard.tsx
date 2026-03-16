import React from 'react';
import { ViewStyle } from 'react-native';
import Animated, { FadeInDown, FadeInRight, FadeInUp, ZoomIn } from 'react-native-reanimated';

type AnimationType = 'fade-up' | 'fade-down' | 'fade-right' | 'zoom';

interface AnimatedCardProps {
  children: React.ReactNode;
  /** Stagger delay index (multiplied by delayMs) */
  index?: number;
  /** Delay per item in ms */
  delayMs?: number;
  /** Animation type */
  animation?: AnimationType;
  /** Additional style */
  style?: ViewStyle;
}

/**
 * Wrapper that adds entrance animation to any card/element.
 * Uses reanimated layout animations for 60fps native performance.
 *
 * Usage:
 *   <AnimatedCard index={i}>
 *     <YourCard />
 *   </AnimatedCard>
 */
export function AnimatedCard({
  children,
  index = 0,
  delayMs = 80,
  animation = 'fade-up',
  style,
}: AnimatedCardProps) {
  const delay = index * delayMs;

  const entering = (() => {
    switch (animation) {
      case 'fade-down':
        return FadeInDown.delay(delay).duration(400).springify();
      case 'fade-right':
        return FadeInRight.delay(delay).duration(400).springify();
      case 'zoom':
        return ZoomIn.delay(delay).duration(300).springify();
      case 'fade-up':
      default:
        return FadeInUp.delay(delay).duration(400).springify();
    }
  })();

  return (
    <Animated.View entering={entering} style={style}>
      {children}
    </Animated.View>
  );
}
