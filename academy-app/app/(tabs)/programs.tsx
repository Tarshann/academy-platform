import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { trpc } from '../../lib/trpc';
import { trackEvent } from '../../lib/analytics';
import { colors, shadows, typography } from '../../lib/theme';
import { AnimatedCard } from '../../components/AnimatedCard';
import { GradientCard } from '../../components/GradientCard';

function formatPrice(price: string | number): string {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(num)) return '';
  return `$${num % 1 === 0 ? num.toFixed(0) : num.toFixed(2)}`;
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    group: 'Group Training',
    individual: 'Private Training',
    shooting: 'Shooting Lab',
    league: 'League',
    camp: 'Camp',
    membership: 'Membership',
  };
  return labels[category] || category;
}

function getSportLabel(sport: string | null): string | null {
  if (!sport) return null;
  const labels: Record<string, string> = {
    basketball: 'Basketball',
    flag_football: 'Flag Football',
    soccer: 'Soccer',
    multi_sport: 'Multi-Sport',
    saq: 'SAQ',
  };
  return labels[sport] || sport;
}

function ProgramsSkeleton() {
  return (
    <View style={styles.content}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.skeletonBlock, { width: 100, height: 22 }]} />
          </View>
          <View style={[styles.skeletonBlock, { width: '70%', height: 18, marginBottom: 8 }]} />
          <View style={[styles.skeletonBlock, { width: '100%', height: 14, marginBottom: 4 }]} />
          <View style={[styles.skeletonBlock, { width: '80%', height: 14, marginBottom: 14 }]} />
          <View style={[styles.skeletonBlock, { width: 120, height: 14, marginBottom: 14 }]} />
          <View style={styles.priceRow}>
            <View style={[styles.skeletonBlock, { width: 60, height: 24 }]} />
            <View style={[styles.skeletonBlock, { width: 80, height: 36, borderRadius: 8 }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

export default function ProgramsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const programs = trpc.programs.list.useQuery();
  const createCheckout = trpc.payment.createCheckout.useMutation();

  const onRefresh = async () => {
    setRefreshing(true);
    await programs.refetch();
    setRefreshing(false);
  };

  const onInquire = (programName: string) => {
    trackEvent('program_inquiry_started', { program_name: programName });
    Alert.alert(
      `Inquire About ${programName}`,
      'How would you like to reach us?',
      [
        {
          text: 'Call Us',
          onPress: () => {
            trackEvent('program_inquiry_call', { program_name: programName });
            Linking.openURL('tel:+15712920633');
          },
        },
        {
          text: 'Text Us',
          onPress: () => {
            trackEvent('program_inquiry_text', { program_name: programName });
            Linking.openURL(`sms:+15712920633&body=${encodeURIComponent(`Hi, I'm interested in ${programName}`)}`);
          },
        },
        {
          text: 'Visit Website',
          onPress: () => {
            trackEvent('program_inquiry_website', { program_name: programName });
            WebBrowser.openBrowserAsync('https://academytn.com/get-started');
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const onEnroll = async (programSlug: string, programName: string, price: string | number) => {
    if (checkoutLoading) return;

    trackEvent('payment_checkout_started', {
      program_name: programName,
      program_slug: programSlug,
      price: typeof price === 'string' ? parseFloat(price) : price,
    });

    setCheckoutLoading(programSlug);
    try {
      const result = await createCheckout.mutateAsync({
        productIds: [programSlug],
      });

      if (result.url) {
        const browserResult = await WebBrowser.openBrowserAsync(result.url, {
          dismissButtonStyle: 'cancel',
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
        });

        if (browserResult.type === 'cancel') {
          trackEvent('payment_checkout_cancelled', {
            program_name: programName,
            program_slug: programSlug,
          });
        } else {
          // Browser was dismissed (could be after success or other navigation)
          trackEvent('payment_checkout_completed', {
            program_name: programName,
            program_slug: programSlug,
          });
          // Refresh programs list in case enrollment status changed
          programs.refetch();
        }
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error';
      trackEvent('payment_checkout_failed', {
        program_name: programName,
        program_slug: programSlug,
        error_type: errorMessage,
      });
      Alert.alert(
        'Checkout Error',
        errorMessage.includes('not found')
          ? `This program is not yet available for online signup. Please contact us to enroll.`
          : 'Unable to start checkout. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setCheckoutLoading(null);
    }
  };

  if (programs.isLoading) {
    return (
      <FlatList
        style={styles.list}
        data={[]}
        renderItem={() => null}
        ListHeaderComponent={<ProgramsSkeleton />}
      />
    );
  }

  if (programs.isError) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#e74c3c" />
        <Text style={styles.errorTitle}>Could not load programs</Text>
        <Text style={styles.errorSubtitle}>Check your connection and try again</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => programs.refetch()}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      data={programs.data ?? []}
      keyExtractor={(item) => String(item.id)}
      ListEmptyComponent={
        <View style={styles.emptyWrapper}>
          <Ionicons name="fitness-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No programs available</Text>
          <Text style={styles.emptySubtitle}>Check back soon for new offerings</Text>
        </View>
      }
      renderItem={({ item, index }) => {
        const sport = getSportLabel(item.sport);
        const isPerformanceLab = item.slug?.includes('performance');
        const isPrivate = item.category === 'individual';
        const isLoadingThis = checkoutLoading === item.slug;

        let priceDisplay = `${formatPrice(item.price)}`;
        let priceDetail = '';

        if (isPerformanceLab) {
          priceDisplay = `${formatPrice(item.price)}/mo`;
          priceDetail = `Apply \u2014 ${item.maxParticipants || 8} Athletes Per Cohort`;
        } else if (item.category === 'membership') {
          priceDisplay = `${formatPrice(item.price)}/mo`;
        }

        const ctaLabel = isPerformanceLab ? 'Apply' : isPrivate ? 'Inquire' : 'Sign Up';

        return (
          <AnimatedCard index={index}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>
                    {getCategoryLabel(item.category)}
                  </Text>
                </View>
                {sport && <Text style={styles.sportLabel}>{sport}</Text>}
              </View>

              <Text style={styles.programName}>{item.name}</Text>
              <Text style={styles.description} numberOfLines={2}>
                {item.description}
              </Text>

              <View style={styles.metaRow}>
                <Ionicons name="people-outline" size={14} color={colors.textMuted} />
                <Text style={styles.ageRange}>
                  Ages {item.ageMin}\u2013{item.ageMax}
                </Text>
                {item.maxParticipants && (
                  <>
                    <Text style={styles.metaDot}>&middot;</Text>
                    <Text style={styles.ageRange}>
                      Max {item.maxParticipants}
                    </Text>
                  </>
                )}
              </View>

              <View style={styles.priceRow}>
                <View>
                  {priceDetail ? (
                    <Text style={styles.priceDetail}>{priceDetail}</Text>
                  ) : null}
                  <Text style={styles.price}>{priceDisplay}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.ctaButton, isLoadingThis && styles.ctaButtonLoading]}
                  onPress={() => {
                    if (isPrivate) {
                      onInquire(item.name);
                    } else if (item.slug) {
                      onEnroll(item.slug, item.name, item.price);
                    }
                  }}
                  disabled={isLoadingThis || (!isPrivate && !item.slug)}
                  activeOpacity={0.7}
                >
                  {isLoadingThis ? (
                    <ActivityIndicator size="small" color={colors.card} />
                  ) : (
                    <>
                      <Text style={styles.ctaText}>{ctaLabel}</Text>
                      <Ionicons name="arrow-forward" size={14} color={colors.card} />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </AnimatedCard>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  // Skeleton
  skeletonBlock: {
    backgroundColor: colors.skeletonBase,
    borderRadius: 6,
  },
  // Error state
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 32,
    gap: 8,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.gold,
    minHeight: 44,
    justifyContent: 'center',
  },
  retryText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.card,
  },
  // Empty state
  emptyWrapper: {
    padding: 60,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textMuted,
  },
  // Card
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    ...shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  categoryBadge: {
    backgroundColor: colors.cardElevated,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  categoryText: {
    color: colors.gold,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sportLabel: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
  programName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  ageRange: {
    fontSize: 12,
    color: colors.textMuted,
  },
  metaDot: {
    color: colors.textMuted,
    fontSize: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 14,
  },
  priceDetail: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 2,
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: typography.display.fontFamily,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gold,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 6,
    minHeight: 44,
    minWidth: 90,
    justifyContent: 'center',
    ...shadows.glow,
  },
  ctaButtonLoading: {
    opacity: 0.7,
  },
  ctaText: {
    color: colors.card,
    fontSize: 14,
    fontWeight: '600',
  },
});
