import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radii, shadows } from '../lib/theme';

interface GradientCardProps {
  children: React.ReactNode;
  /** Gradient colors — defaults to gold-to-transparent top edge */
  gradientColors?: readonly [string, string, ...string[]];
  /** Gradient direction start point */
  start?: { x: number; y: number };
  /** Gradient direction end point */
  end?: { x: number; y: number };
  /** Additional style for the outer container */
  style?: ViewStyle;
  /** Border radius — defaults to 16 */
  borderRadius?: number;
  /** Whether to show a gradient border instead of gradient fill */
  borderOnly?: boolean;
  /** Border width when borderOnly is true */
  borderWidth?: number;
}

/**
 * Premium card with gradient background or gradient border.
 *
 * Usage:
 *   <GradientCard>
 *     <Text>Content on gradient</Text>
 *   </GradientCard>
 *
 *   <GradientCard borderOnly borderWidth={1.5}>
 *     <Text>Content with gradient border</Text>
 *   </GradientCard>
 */
export function GradientCard({
  children,
  gradientColors = [colors.gold, colors.goldDark] as const,
  start = { x: 0, y: 0 },
  end = { x: 1, y: 1 },
  style,
  borderRadius = radii.lg,
  borderOnly = false,
  borderWidth = 1.5,
}: GradientCardProps) {
  if (borderOnly) {
    return (
      <LinearGradient
        colors={gradientColors as any}
        start={start}
        end={end}
        style={[
          {
            borderRadius,
            padding: borderWidth,
          },
          shadows.card,
          style,
        ]}
      >
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: borderRadius - borderWidth,
            overflow: 'hidden',
          }}
        >
          {children}
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={gradientColors as any}
      start={start}
      end={end}
      style={[
        {
          borderRadius,
          overflow: 'hidden',
        },
        shadows.card,
        style,
      ]}
    >
      {children}
    </LinearGradient>
  );
}

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  borderRadius?: number;
}

/**
 * Semi-transparent glass-effect card for dark theme.
 * Uses rgba overlay instead of blur for broad device compatibility.
 */
export function GlassCard({
  children,
  style,
  borderRadius = radii.lg,
}: GlassCardProps) {
  return (
    <View
      style={[
        {
          backgroundColor: 'rgba(255,255,255,0.06)',
          borderRadius,
          borderWidth: 1,
          borderColor: colors.borderLight,
          overflow: 'hidden',
        },
        shadows.subtle,
        style,
      ]}
    >
      {children}
    </View>
  );
}
