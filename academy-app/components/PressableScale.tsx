import React from 'react';
import { ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

interface PressableScaleProps {
  children: React.ReactNode;
  /** Called when the button is pressed */
  onPress: () => void;
  /** Scale factor when pressed (0-1) */
  scale?: number;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Additional style */
  style?: ViewStyle;
}

/**
 * Drop-in button replacement with spring scale-down animation on press.
 * Uses gesture handler + reanimated for native 60fps feel.
 *
 * Usage:
 *   <PressableScale onPress={handleSubmit} style={styles.button}>
 *     <Text>Submit</Text>
 *   </PressableScale>
 */
export function PressableScale({
  children,
  onPress,
  scale = 0.96,
  disabled = false,
  style,
}: PressableScaleProps) {
  const scaleValue = useSharedValue(1);

  const gesture = Gesture.Tap()
    .enabled(!disabled)
    .onBegin(() => {
      scaleValue.value = withSpring(scale, { damping: 15, stiffness: 300 });
    })
    .onFinalize(() => {
      scaleValue.value = withSpring(1, { damping: 15, stiffness: 300 });
    })
    .onEnd(() => {
      if (!disabled) onPress();
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
    opacity: disabled ? 0.5 : 1,
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[style, animatedStyle]}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
}
