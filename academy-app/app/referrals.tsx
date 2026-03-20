import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
  TextInput,
  Share,
  ActivityIndicator,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { trpc } from '../lib/trpc';
import { trackEvent } from '../lib/analytics';
import { colors, shadows, typography } from '../lib/theme';
import { AnimatedCard } from '../components/AnimatedCard';
import { GradientCard } from '../components/GradientCard';
import { Loading } from '../components/Loading';

export default function ReferralsScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [email, setEmail] = useState('');
  const [copied, setCopied] = useState(false);

  const codeQuery = trpc.referrals.getMyCode.useQuery();
  const referralsQuery = trpc.referrals.getMyReferrals.useQuery();
  const statsQuery = trpc.referrals.getStats.useQuery();
  const invite = trpc.referrals.invite.useMutation({
    onSuccess: () => {
      setEmail('');
      referralsQuery.refetch();
      statsQuery.refetch();
      Alert.alert('Invite Sent', 'Your referral invitation has been sent!');
      trackEvent('referral_invite_sent');
    },
    onError: (err) => {
      Alert.alert('Error', err.message || 'Failed to send invitation.');
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      codeQuery.refetch(),
      referralsQuery.refetch(),
      statsQuery.refetch(),
    ]);
    setRefreshing(false);
  };

  const referralCode = codeQuery.data?.referralCode ?? codeQuery.data?.code ?? '';

  const onCopyCode = async () => {
    if (!referralCode) return;
    await Clipboard.setStringAsync(referralCode);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    trackEvent('referral_code_copied');
    setTimeout(() => setCopied(false), 2000);
  };

  const onShare = async () => {
    if (!referralCode) return;
    try {
      await Share.share({
        message: `Join me at The Academy in Gallatin, TN! Use my referral code: ${referralCode}\n\nhttps://academytn.com`,
      });
      trackEvent('referral_shared');
    } catch {
      // User cancelled share
    }
  };

  const onSendInvite = () => {
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    invite.mutate({ email: trimmed });
  };

  if (codeQuery.isLoading) {
    return <Loading />;
  }

  if (codeQuery.isError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Referrals</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#e74c3c" />
          <Text style={styles.errorTitle}>Could not load referrals</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => codeQuery.refetch()}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const referrals = referralsQuery.data ?? [];
  const stats = statsQuery.data;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Referrals</Text>
        <View style={styles.headerRight} />
      </View>

      <FlatList
        style={styles.list}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        data={referrals}
        keyExtractor={(item: any) => String(item.id)}
        ListHeaderComponent={
          <View>
            {/* Referral Code Card */}
            <AnimatedCard index={0}>
              <GradientCard
                gradientColors={[colors.cardElevated, colors.card]}
                style={styles.codeCardOuter}
              >
                <View style={styles.codeCard}>
                  <Text style={styles.codeLabel}>YOUR REFERRAL CODE</Text>
                  <TouchableOpacity
                    style={styles.codeBox}
                    onPress={onCopyCode}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.codeText}>{referralCode || '—'}</Text>
                    <Ionicons
                      name={copied ? 'checkmark-circle' : 'copy-outline'}
                      size={20}
                      color={copied ? '#27ae60' : colors.textMuted}
                    />
                  </TouchableOpacity>
                  {copied && (
                    <Text style={styles.copiedText}>Copied to clipboard!</Text>
                  )}

                  <TouchableOpacity
                    style={styles.shareBtn}
                    onPress={onShare}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="share-outline" size={18} color={colors.card} />
                    <Text style={styles.shareBtnText}>Share Code</Text>
                  </TouchableOpacity>
                </View>
              </GradientCard>
            </AnimatedCard>

            {/* Stats */}
            {stats && (
              <AnimatedCard index={1}>
                <View style={styles.statsRow}>
                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>{stats.totalReferrals ?? 0}</Text>
                    <Text style={styles.statLabel}>Referrals</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>{stats.converted ?? 0}</Text>
                    <Text style={styles.statLabel}>Signed Up</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={[styles.statValue, { color: colors.gold }]}>
                      {stats.totalPoints ?? 0}
                    </Text>
                    <Text style={styles.statLabel}>Points</Text>
                  </View>
                </View>
              </AnimatedCard>
            )}

            {/* Invite by Email */}
            <AnimatedCard index={2}>
              <View style={styles.inviteSection}>
                <Text style={styles.inviteTitle}>INVITE BY EMAIL</Text>
                <View style={styles.inviteRow}>
                  <TextInput
                    style={styles.inviteInput}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="friend@email.com"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    maxLength={320}
                  />
                  <TouchableOpacity
                    style={[styles.inviteSendBtn, invite.isPending && { opacity: 0.5 }]}
                    onPress={onSendInvite}
                    disabled={invite.isPending || !email.trim()}
                    activeOpacity={0.7}
                  >
                    {invite.isPending ? (
                      <ActivityIndicator size="small" color={colors.card} />
                    ) : (
                      <Ionicons name="send" size={18} color={colors.card} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </AnimatedCard>

            {/* Referral History Header */}
            {referrals.length > 0 && (
              <Text style={styles.sectionTitle}>REFERRAL HISTORY</Text>
            )}
          </View>
        }
        ListEmptyComponent={
          !referralsQuery.isLoading ? (
            <View style={styles.emptyWrapper}>
              <Ionicons name="gift-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No referrals yet</Text>
              <Text style={styles.emptySubtitle}>
                Share your code with friends and earn 100 points for each sign-up!
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item, index }) => (
          <AnimatedCard index={index + 3}>
            <View style={styles.referralCard}>
              <View style={styles.referralIcon}>
                <Ionicons name="person-outline" size={18} color={colors.gold} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.referralName}>
                  {item.referredName || item.invitedEmail || item.email || 'Invited User'}
                </Text>
                <Text style={styles.referralDate}>
                  {item.createdAt
                    ? new Date(item.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : ''}
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  item.converted && styles.statusBadgeConverted,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    item.converted && styles.statusTextConverted,
                  ]}
                >
                  {item.converted ? 'Signed Up' : 'Pending'}
                </Text>
              </View>
            </View>
          </AnimatedCard>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    ...typography.heading,
    fontSize: 18,
  },
  headerRight: {
    width: 44,
  },
  list: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  // Error
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 8,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 8,
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
  retryBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.card,
  },
  // Code Card
  codeCardOuter: {
    marginBottom: 16,
  },
  codeCard: {
    padding: 24,
    alignItems: 'center',
  },
  codeLabel: {
    ...typography.overline,
    marginBottom: 12,
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 6,
    minHeight: 56,
  },
  codeText: {
    fontFamily: 'BebasNeue',
    fontSize: 28,
    color: colors.gold,
    letterSpacing: 3,
  },
  copiedText: {
    fontSize: 12,
    color: '#27ae60',
    fontWeight: '500',
    marginBottom: 8,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.gold,
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 8,
    minHeight: 48,
    ...shadows.glow,
  },
  shareBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.card,
  },
  // Stats
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
    ...shadows.card,
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: typography.display.fontFamily,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
    marginTop: 2,
  },
  // Invite
  inviteSection: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    ...shadows.card,
  },
  inviteTitle: {
    ...typography.overline,
    marginBottom: 10,
  },
  inviteRow: {
    flexDirection: 'row',
    gap: 10,
  },
  inviteInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  inviteSendBtn: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Section
  sectionTitle: {
    ...typography.overline,
    marginBottom: 10,
  },
  // Empty
  emptyWrapper: {
    padding: 48,
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
    textAlign: 'center',
    lineHeight: 20,
  },
  // Referral card
  referralCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    gap: 12,
    ...shadows.card,
    minHeight: 60,
  },
  referralIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.goldMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  referralName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  referralDate: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: colors.surface,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusBadgeConverted: {
    backgroundColor: 'rgba(39, 174, 96, 0.15)',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  statusTextConverted: {
    color: '#27ae60',
  },
});
