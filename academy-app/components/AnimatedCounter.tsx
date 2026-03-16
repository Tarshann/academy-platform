import React, { useEffect } from 'react';
import { TextStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { TextInput } from 'react-native';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

interface AnimatedCounterProps {
  /** Target value to count to */
  value: number;
  /** Duration of the count animation in ms */
  duration?: number;
  /** Text style */
  style?: TextStyle;
  /** Prefix (e.g., "$", "+") */
  prefix?: string;
  /** Suffix (e.g., " pts", "%") */
  suffix?: string;
  /** Number of decimal places */
  decimals?: number;
}

/**
 * Animated number counter that rolls up from 0 to the target value.
 * Uses reanimated animated props for smooth 60fps native animation.
 *
 * Usage:
 *   <AnimatedCounter value={1250} suffix=" pts" style={styles.points} />
 */
export function AnimatedCounter({
  value,
  duration = 800,
  style,
  prefix = '',
  suffix = '',
  decimals = 0,
}: AnimatedCounterProps) {
  const animatedValue = useSharedValue(0);

  useEffect(() => {
    animatedValue.value = withTiming(value, {
      duration,
      easing: Easing.out(Easing.cubic),
    });
  }, [value, duration]);

  const animatedProps = useAnimatedProps(() => {
    const num = decimals > 0
      ? animatedValue.value.toFixed(decimals)
      : Math.round(animatedValue.value).toLocaleString();
    return {
      text: `${prefix}${num}${suffix}`,
      defaultValue: `${prefix}${num}${suffix}`,
    };
  });

  return (
    <AnimatedTextInput
      underlineColorAndroid="transparent"
      editable={false}
      animatedProps={animatedProps}
      style={[
        {
          padding: 0,
          // TextInput needs explicit color/size to match Text
        },
        style,
      ]}
    />
  );
}
