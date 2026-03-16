import {
  View,
  Text,
  SectionList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { trpc } from '../lib/trpc';
import { trackEvent } from '../lib/analytics';
import { colors, shadows } from '../lib/theme';

function formatCurrency(amount: string | number, currency = 'usd'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '$0.00';
  // Amount is in dollars (decimal string from DB)
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(num);
}

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'active':
    case 'succeeded':
      return colors.success;
    case 'past_due':
    case 'pending':
      return colors.warning;
    case 'canceled':
    case 'cancelled':
    case 'failed':
      return colors.error;
    default:
      return colors.textSecondary;
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'active':
      return 'Active';
    case 'past_due':
      return 'Past Due';
    case 'canceled':
    case 'cancelled':
      return 'Canceled';
    case 'trialing':
      return 'Trial';
    case 'succeeded':
      return 'Paid';
    case 'pending':
      return 'Pending';
    case 'failed':
      return 'Failed';
    default:
      return status;
  }
}

function PaymentsSkeleton() {
  return (
    <View style={styles.skeletonContainer}>
      {/* Subscriptions skeleton */}
      <View style={styles.skeletonSectionHeader}>
        <View style={[styles.skeletonBlock, { width: 140, height: 14 }]} />
      </View>
      {[1, 2].map((i) => (
        <View key={`sub-${i}`} style={styles.card}>
          <View style={[styles.skeletonBlock, { width: '60%', height: 16, marginBottom: 8 }]} />
          <View style={[styles.skeletonBlock, { width: '40%', height: 12, marginBottom: 6 }]} />
          <View style={[styles.skeletonBlock, { width: '50%', height: 12 }]} />
        </View>
      ))}
      {/* History skeleton */}
      <View style={[styles.skeletonSectionHeader, { marginTop: 16 }]}>
        <View style={[styles.skeletonBlock, { width: 120, height: 14 }]} />
      </View>
      {[1, 2, 3].map((i) => (
        <View key={`pay-${i}`} style={styles.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={[styles.skeletonBlock, { width: '50%', height: 14 }]} />
            <View style={[styles.skeletonBlock, { width: 60, height: 14 }]} />
          </View>
          <View style={[styles.skeletonBlock, { width: '30%', height: 12, marginTop: 8 }]} />
        </View>
      ))}
    </View>
  );
}

export default function PaymentsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const tracked = useRef(false);

  const subscriptions = trpc.payment.mySubscriptions.useQuery();
  const payments = trpc.payment.myPayments.useQuery();

  const isLoading = subscriptions.isLoading || payments.isLoading;
  const isError = subscriptions.isError || payments.isError;

  useEffect(() => {
    if (!tracked.current) {
      trackEvent('payment_history_viewed');
      tracked.current = true;
    }
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([subscriptions.refetch(), payments.refetch()]);
    setRefreshing(false);
  };

  const portalSession = trpc.payment.createPortalSession.useMutation();

  const onManageSubscription = async () => {
    trackEvent('subscription_manage_opened');
    try {
      const result = await portalSession.mutateAsync();
      if (result.url) {
        await WebBrowser.openBrowserAsync(result.url, {
          dismissButtonStyle: 'done',
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
        });
      }
    } catch {
      Alert.alert('Error', 'Unable to open billing portal. Please try again.');
    }
  };

  type SectionItem =
    | { type: 'subscription'; data: NonNullable<typeof subscriptions.data>[number] }
    | { type: 'payment'; data: NonNullable<typeof payments.data>[number] };

  const sections: { title: string; data: SectionItem[] }[] = [];

  if (!isLoading && !isError) {
    const subs = subscriptions.data ?? [];
    const pays = payments.data ?? [];

    if (subs.length > 0) {
      sections.push({
        title: 'Active Subscriptions',
        data: subs.map((s) => ({ type: 'subscription' as const, data: s })),
      });
    }

    sections.push({
      title: subs.length > 0 ? 'Payment History' : 'Payments',
      data: pays.length > 0
        ? pays.map((p) => ({ type: 'payment' as const, data: p }))
        : [],
    });
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Payments',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.textPrimary,
          headerBackTitle: 'Profile',
        }}
      />

      {isLoading ? (
        <View style={styles.list}>
          <PaymentsSkeleton />
        </View>
      ) : isError ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={styles.errorTitle}>Could not load payments</Text>
          <Text style={styles.errorSubtitle}>Check your connection and try again</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={onRefresh}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <SectionList
          style={styles.list}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          sections={sections}
          keyExtractor={(item, index) =>
            item.type === 'subscription'
              ? `sub-${item.data.id}`
              : `pay-${item.data.id}`
          }
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionLabel}>{section.title.toUpperCase()}</Text>
          )}
          renderItem={({ item }) => {
            if (item.type === 'subscription') {
              const sub = item.data;
              return (
                <View style={styles.card}>
                  <View style={styles.subscriptionHeader}>
                    <View style={styles.iconCircle}>
                      <Ionicons name="card-outline" size={18} color={colors.gold} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.subscriptionTitle}>Subscription</Text>
                      <View style={styles.statusRow}>
                        <View
                          style={[
                            styles.statusDot,
                            { backgroundColor: getStatusColor(sub.status) },
                          ]}
                        />
                        <Text style={styles.statusText}>
                          {getStatusLabel(sub.status)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {sub.currentPeriodEnd && (
                    <Text style={styles.renewalText}>
                      {sub.status === 'active'
                        ? `Renews ${formatDate(sub.currentPeriodEnd)}`
                        : `Period ends ${formatDate(sub.currentPeriodEnd)}`}
                    </Text>
                  )}

                  <TouchableOpacity
                    style={[styles.manageBtn, portalSession.isPending && styles.manageBtnLoading]}
                    onPress={onManageSubscription}
                    activeOpacity={0.7}
                    disabled={portalSession.isPending}
                  >
                    {portalSession.isPending ? (
                      <ActivityIndicator size="small" color={colors.card} />
                    ) : (
                      <>
                        <Text style={styles.manageBtnText}>Manage Subscription</Text>
                        <Ionicons name="open-outline" size={14} color={colors.card} />
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              );
            }

            // Payment item
            const pay = item.data;
            return (
              <View style={styles.card}>
                <View style={styles.paymentRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.paymentDescription}>
                      {pay.description || pay.type || 'Payment'}
                    </Text>
                    <Text style={styles.paymentDate}>
                      {formatDate(pay.createdAt)}
                    </Text>
                  </View>
                  <View style={styles.paymentRight}>
                    <Text style={styles.paymentAmount}>
                      {formatCurrency(pay.amount, pay.currency)}
                    </Text>
                    <View style={styles.statusRow}>
                      <View
                        style={[
                          styles.statusDot,
                          { backgroundColor: getStatusColor(pay.status) },
                        ]}
                      />
                      <Text style={[styles.statusText, { fontSize: 11 }]}>
                        {getStatusLabel(pay.status)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyWrapper}>
              <Ionicons name="receipt-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No payments yet</Text>
              <Text style={styles.emptySubtitle}>
                Your payment history will appear here after your first purchase
              </Text>
            </View>
          }
          renderSectionFooter={({ section }) => {
            if (section.data.length === 0 && section.title.includes('Payment')) {
              return (
                <View style={styles.emptyWrapper}>
                  <Ionicons name="receipt-outline" size={48} color={colors.textMuted} />
                  <Text style={styles.emptyTitle}>No payments yet</Text>
                  <Text style={styles.emptySubtitle}>
                    Your payment history will appear here after your first purchase
                  </Text>
                </View>
              );
            }
            return null;
          }}
        />
      )}
    </>
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
  skeletonContainer: {
    padding: 16,
  },
  skeletonSectionHeader: {
    marginBottom: 12,
  },
  skeletonBlock: {
    backgroundColor: colors.skeletonBase,
    borderRadius: 6,
  },
  // Section
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 16,
    marginLeft: 4,
  },
  // Card
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    ...shadows.subtle,
  },
  // Subscription
  subscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.goldMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  subscriptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  renewalText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 12,
    marginLeft: 48,
  },
  manageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gold,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 6,
    minHeight: 44,
  },
  manageBtnLoading: {
    opacity: 0.7,
  },
  manageBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.card,
  },
  // Payment
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentDescription: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  paymentDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  paymentRight: {
    alignItems: 'flex-end',
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  // Error
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
  // Empty
  emptyWrapper: {
    padding: 40,
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
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
