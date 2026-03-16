import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../lib/theme';

interface SectionHeaderProps {
  title: string;
  /** Optional "See All" link */
  onSeeAll?: () => void;
  seeAllLabel?: string;
}

/**
 * Standardized section header with overline typography and optional "See All" link.
 */
export function SectionHeader({ title, onSeeAll, seeAllLabel = 'See All' }: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll} style={styles.seeAllBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.seeAllText}>{seeAllLabel}</Text>
          <Ionicons name="chevron-forward" size={12} color={colors.gold} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 8,
  },
  title: {
    ...typography.overline,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minHeight: 44,
    paddingVertical: 8,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gold,
  },
});
