import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { trpc } from '../lib/trpc';
import { trackEvent } from '../lib/analytics';
import { colors, shadows, typography } from '../lib/theme';
import { AnimatedCard } from '../components/AnimatedCard';
import { Skeleton, SkeletonLine } from '../components/Skeleton';

function FamilySkeleton() {
  return (
    <View style={styles.skeletonWrap}>
      {[1, 2].map((i) => (
        <View key={i} style={styles.memberCard}>
          <View style={styles.memberHeader}>
            <View style={[styles.skeletonBlock, { width: 44, height: 44, borderRadius: 22 }]} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={[styles.skeletonBlock, { width: 120, height: 16, marginBottom: 6 }]} />
              <View style={[styles.skeletonBlock, { width: 80, height: 12 }]} />
            </View>
          </View>
          <View style={styles.statsRow}>
            {[1, 2, 3].map((j) => (
              <View key={j} style={styles.statBox}>
                <View style={[styles.skeletonBlock, { width: 32, height: 20, marginBottom: 4 }]} />
                <View style={[styles.skeletonBlock, { width: 48, height: 10 }]} />
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

function AddMemberModal({
  visible,
  onClose,
  onAdd,
  loading,
}: {
  visible: boolean;
  onClose: () => void;
  onAdd: (childId: number) => void;
  loading: boolean;
}) {
  const [childIdStr, setChildIdStr] = useState('');

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={styles.modalContent} activeOpacity={1} onPress={() => {}}>
          <Text style={styles.modalTitle}>Add Family Member</Text>
          <Text style={styles.modalSubtitle}>
            Enter the member ID of the child you'd like to add to your family.
          </Text>
          <TextInput
            style={styles.modalInput}
            value={childIdStr}
            onChangeText={setChildIdStr}
            placeholder="Member ID"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            autoFocus
            maxLength={10}
          />
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={onClose} disabled={loading}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalSaveBtn, (!childIdStr.trim() || loading) && { opacity: 0.5 }]}
              onPress={() => {
                const id = parseInt(childIdStr.trim(), 10);
                if (!isNaN(id) && id > 0) onAdd(id);
              }}
              disabled={!childIdStr.trim() || loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.card} />
              ) : (
                <Text style={styles.modalSaveText}>Add</Text>
              )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

export default function FamilyScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [expandedChild, setExpandedChild] = useState<number | null>(null);

  const members = trpc.family.getMembers.useQuery();
  const addMember = trpc.family.addMember.useMutation({
    onSuccess: () => {
      members.refetch();
      setAddModalVisible(false);
      trackEvent('family_member_added');
    },
    onError: (err) => {
      Alert.alert('Error', err.message || 'Failed to add family member.');
    },
  });
  const removeMember = trpc.family.removeMember.useMutation({
    onSuccess: () => {
      members.refetch();
      trackEvent('family_member_removed');
    },
    onError: (err) => {
      Alert.alert('Error', err.message || 'Failed to remove family member.');
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await members.refetch();
    setRefreshing(false);
  };

  const onRemoveMember = (childId: number, name: string) => {
    Alert.alert(
      'Remove Family Member',
      `Are you sure you want to remove ${name} from your family?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeMember.mutate({ childId }),
        },
      ]
    );
  };

  if (members.isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Family</Text>
          <View style={styles.headerRight} />
        </View>
        <FamilySkeleton />
      </SafeAreaView>
    );
  }

  if (members.isError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Family</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#e74c3c" />
          <Text style={styles.errorTitle}>Could not load family</Text>
          <Text style={styles.errorSubtitle}>Check your connection and try again</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => members.refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Family</Text>
        <TouchableOpacity
          onPress={() => setAddModalVisible(true)}
          style={styles.addBtn}
        >
          <Ionicons name="person-add-outline" size={20} color={colors.gold} />
        </TouchableOpacity>
      </View>

      <FlatList
        style={styles.list}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        data={members.data ?? []}
        keyExtractor={(item: any) => String(item.id)}
        ListEmptyComponent={
          <View style={styles.emptyWrapper}>
            <Ionicons name="people-outline" size={56} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No family members yet</Text>
            <Text style={styles.emptySubtitle}>
              Add your children to track their progress, attendance, and schedules.
            </Text>
            <TouchableOpacity
              style={styles.emptyAction}
              onPress={() => setAddModalVisible(true)}
            >
              <Ionicons name="person-add-outline" size={18} color={colors.card} />
              <Text style={styles.emptyActionText}>Add Family Member</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item, index }) => (
          <ChildCard
            key={item.id}
            child={item}
            index={index}
            expanded={expandedChild === item.id}
            onToggle={() => setExpandedChild(expandedChild === item.id ? null : item.id)}
            onRemove={() => onRemoveMember(item.id, item.name ?? 'this member')}
          />
        )}
      />

      <AddMemberModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onAdd={(childId) => addMember.mutate({ childId })}
        loading={addMember.isPending}
      />
    </SafeAreaView>
  );
}

function ChildCard({
  child,
  index,
  expanded,
  onToggle,
  onRemove,
}: {
  child: any;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const childData = trpc.family.getChildData.useQuery(
    { childId: child.id },
    { enabled: expanded }
  );

  return (
    <AnimatedCard index={index}>
      <View style={styles.memberCard}>
        <TouchableOpacity style={styles.memberHeader} onPress={onToggle} activeOpacity={0.7}>
          <View style={styles.memberAvatar}>
            <Text style={styles.memberAvatarText}>
              {(child.name ?? 'M').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.memberName}>{child.name ?? 'Member'}</Text>
            {child.relationshipType && (
              <Text style={styles.memberRelation}>{child.relationshipType}</Text>
            )}
          </View>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={colors.textMuted}
          />
        </TouchableOpacity>

        {expanded && (
          <View style={styles.expandedContent}>
            {childData.isLoading ? (
              <View style={styles.expandedLoading}>
                <ActivityIndicator size="small" color={colors.gold} />
                <Text style={styles.expandedLoadingText}>Loading details...</Text>
              </View>
            ) : childData.isError ? (
              <View style={styles.expandedError}>
                <Text style={styles.expandedErrorText}>Could not load details</Text>
                <TouchableOpacity onPress={() => childData.refetch()}>
                  <Text style={styles.expandedRetry}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={styles.statsRow}>
                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>
                      {childData.data?.metrics?.length ?? 0}
                    </Text>
                    <Text style={styles.statLabel}>Metrics</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>
                      {childData.data?.attendance?.length ?? 0}
                    </Text>
                    <Text style={styles.statLabel}>Sessions</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>
                      {childData.data?.schedules?.length ?? 0}
                    </Text>
                    <Text style={styles.statLabel}>Upcoming</Text>
                  </View>
                </View>

                {/* Recent Metrics */}
                {(childData.data?.metrics?.length ?? 0) > 0 && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailTitle}>RECENT METRICS</Text>
                    {childData.data!.metrics.slice(0, 3).map((m: any, i: number) => (
                      <View key={i} style={styles.detailRow}>
                        <Text style={styles.detailLabel} numberOfLines={1}>{m.metricName}</Text>
                        <Text style={styles.detailValue}>
                          {m.value}{m.unit ? ` ${m.unit}` : ''}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Upcoming Schedules */}
                {(childData.data?.schedules?.length ?? 0) > 0 && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailTitle}>UPCOMING SESSIONS</Text>
                    {childData.data!.schedules.slice(0, 3).map((s: any, i: number) => (
                      <View key={i} style={styles.detailRow}>
                        <Text style={styles.detailLabel} numberOfLines={1}>{s.title}</Text>
                        <Text style={styles.detailValue}>
                          {new Date(s.startTime).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                <TouchableOpacity style={styles.removeBtn} onPress={onRemove}>
                  <Ionicons name="trash-outline" size={14} color="#e74c3c" />
                  <Text style={styles.removeBtnText}>Remove from Family</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </View>
    </AnimatedCard>
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
  addBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  skeletonWrap: {
    padding: 16,
  },
  skeletonBlock: {
    backgroundColor: colors.skeletonBase,
    borderRadius: 6,
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
    marginBottom: 8,
  },
  emptyAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.gold,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
    minHeight: 44,
  },
  emptyActionText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.card,
  },
  // Member Card
  memberCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    marginBottom: 12,
    ...shadows.card,
    overflow: 'hidden',
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    minHeight: 72,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.goldMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  memberAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gold,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  memberRelation: {
    fontSize: 12,
    color: colors.textMuted,
    textTransform: 'capitalize',
    marginTop: 2,
  },
  // Expanded
  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: 16,
  },
  expandedLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
  },
  expandedLoadingText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  expandedError: {
    alignItems: 'center',
    padding: 16,
    gap: 8,
  },
  expandedErrorText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  expandedRetry: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gold,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
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
  detailSection: {
    marginBottom: 12,
  },
  detailTitle: {
    ...typography.overline,
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    fontFamily: typography.display.fontFamily,
  },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    marginTop: 8,
    minHeight: 44,
  },
  removeBtnText: {
    fontSize: 13,
    color: '#e74c3c',
    fontWeight: '500',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  modalContent: {
    backgroundColor: colors.cardElevated,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: colors.surface,
    minHeight: 48,
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  modalSaveBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: colors.gold,
    minHeight: 48,
    justifyContent: 'center',
  },
  modalSaveText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.card,
  },
});
