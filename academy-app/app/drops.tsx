import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { useState, useEffect } from 'react';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { trpc } from '../lib/trpc';
import { trackEvent } from '../lib/analytics';
import { colors, shadows } from '../lib/theme';

type DropType = 'product' | 'program' | 'content' | 'event';

const DROP_TYPE_CONFIG: Record<DropType, { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  product: { label: 'New Merch', icon: 'bag-outline', color: '#e74c3c' },
  program: { label: 'New Program', icon: 'grid-outline', color: '#3498db' },
  content: { label: 'New Content', icon: 'play-circle-outline', color: '#2ecc71' },
  event: { label: 'Event', icon: 'calendar-outline', color: '#f39c12' },
};

function CountdownTimer({ scheduledAt }: { scheduledAt: string }) {
  const target = new Date(scheduledAt).getTime();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60_000); // update every minute
    return () => clearInterval(interval);
  }, []);

  const diff = target - now;

  if (diff <= 0) return <Text style={styles.dropLive}>LIVE NOW</Text>;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const mins = Math.floor((diff / (1000 * 60)) % 60);

  return (
    <View style={styles.countdownRow}>
      {days > 0 && (
        <View style={styles.countdownBlock}>
          <Text style={styles.countdownValue}>{days}</Text>
          <Text style={styles.countdownUnit}>days</Text>
        </View>
      )}
      <View style={styles.countdownBlock}>
        <Text style={styles.countdownValue}>{hours}</Text>
        <Text style={styles.countdownUnit}>hrs</Text>
      </View>
      <View style={styles.countdownBlock}>
        <Text style={styles.countdownValue}>{mins}</Text>
        <Text style={styles.countdownUnit}>min</Text>
      </View>
    </View>
  );
}

// Admin create drop form
function CreateDropForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dropType, setDropType] = useState<DropType>('product');
  const [imageUrl, setImageUrl] = useState('');

  const createMutation = trpc.merchDrops.admin.create.useMutation({
    onSuccess: () => {
      trackEvent('merch_drop_created', { dropType });
      onSuccess();
    },
    onError: (err) => Alert.alert('Error', err.message),
  });

  const handleSubmit = () => {
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter a title for the drop.');
      return;
    }

    createMutation.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      dropType,
      imageUrl: imageUrl.trim() || undefined,
      scheduledAt: new Date().toISOString(), // Schedule for now
    });
  };

  return (
    <View style={styles.formOverlay}>
      <View style={styles.formContainer}>
        <View style={styles.formHeader}>
          <Text style={styles.formTitle}>New Drop Alert</Text>
          <TouchableOpacity onPress={onCancel}>
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.formScroll}>
          {/* Drop Type Selector */}
          <Text style={styles.fieldLabel}>TYPE</Text>
          <View style={styles.typeRow}>
            {(Object.entries(DROP_TYPE_CONFIG) as [DropType, typeof DROP_TYPE_CONFIG[DropType]][]).map(
              ([type, config]) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeChip,
                    dropType === type && { backgroundColor: config.color },
                  ]}
                  onPress={() => setDropType(type)}
                >
                  <Ionicons
                    name={config.icon}
                    size={16}
                    color={dropType === type ? colors.textPrimary : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.typeChipText,
                      dropType === type && { color: colors.textPrimary },
                    ]}
                  >
                    {config.label}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </View>

          <Text style={styles.fieldLabel}>TITLE</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Academy Spring Collection"
            placeholderTextColor={colors.textMuted}
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.fieldLabel}>DESCRIPTION</Text>
          <TextInput
            style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
            placeholder="Tell members what's dropping..."
            placeholderTextColor={colors.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
          />

          <Text style={styles.fieldLabel}>IMAGE URL (OPTIONAL)</Text>
          <TextInput
            style={styles.input}
            placeholder="https://..."
            placeholderTextColor={colors.textMuted}
            value={imageUrl}
            onChangeText={setImageUrl}
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={[styles.submitBtn, createMutation.isPending && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={createMutation.isPending}
          >
            <Ionicons name="megaphone-outline" size={20} color="#fff" />
            <Text style={styles.submitBtnText}>
              {createMutation.isPending ? 'Sending...' : 'Send Drop Alert'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
}

export default function DropsScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const me = trpc.auth.me.useQuery();
  const isAdmin = me.data?.role === 'admin';
  const drops = trpc.merchDrops.upcoming.useQuery();
  const allDrops = trpc.merchDrops.admin.list.useQuery(undefined, { enabled: isAdmin });

  const displayDrops = isAdmin ? allDrops.data ?? [] : drops.data ?? [];

  const sendNowMutation = trpc.merchDrops.admin.sendNow.useMutation({
    onSuccess: () => {
      trackEvent('merch_drop_sent');
      allDrops.refetch();
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([drops.refetch(), isAdmin ? allDrops.refetch() : Promise.resolve()]);
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Drops</Text>
        {isAdmin ? (
          <TouchableOpacity onPress={() => setShowForm(true)} style={styles.addBtn}>
            <Ionicons name="add" size={24} color={colors.gold} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <FlatList
        data={displayDrops}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          !drops.isLoading ? (
            <View style={styles.emptyState}>
              <Ionicons name="notifications-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No upcoming drops</Text>
              <Text style={styles.emptySubtitle}>
                Stay tuned for new merch, programs, and content!
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const config = DROP_TYPE_CONFIG[item.dropType as DropType] ?? DROP_TYPE_CONFIG.product;

          return (
            <View style={styles.dropCard}>
              {/* Image */}
              {item.imageUrl ? (
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.dropImage}
                  contentFit="cover"
                  transition={200}
                />
              ) : (
                <View style={[styles.dropImage, styles.dropImagePlaceholder]}>
                  <Ionicons name={config.icon} size={40} color={colors.gold} />
                </View>
              )}

              {/* Type Badge */}
              <View style={[styles.typeBadge, { backgroundColor: config.color }]}>
                <Ionicons name={config.icon} size={12} color="#fff" />
                <Text style={styles.typeBadgeText}>{config.label}</Text>
              </View>

              {/* Content */}
              <View style={styles.dropContent}>
                <Text style={styles.dropTitle}>{item.title}</Text>
                {item.description && (
                  <Text style={styles.dropDescription} numberOfLines={3}>
                    {item.description}
                  </Text>
                )}

                {/* Countdown or Sent status */}
                {item.isSent ? (
                  <View style={styles.sentRow}>
                    <Ionicons name="checkmark-circle" size={16} color="#27ae60" />
                    <Text style={styles.sentText}>
                      Sent {item.sentAt ? new Date(item.sentAt).toLocaleDateString() : ''}
                    </Text>
                  </View>
                ) : (
                  <CountdownTimer scheduledAt={String(item.scheduledAt)} />
                )}

                {/* Admin: Send Now */}
                {isAdmin && !item.isSent && (
                  <TouchableOpacity
                    style={styles.sendNowBtn}
                    onPress={() => {
                      Alert.alert(
                        'Send Now?',
                        'This will notify all members about this drop.',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Send',
                            onPress: () => sendNowMutation.mutate({ id: item.id }),
                          },
                        ]
                      );
                    }}
                  >
                    <Ionicons name="send-outline" size={14} color="#fff" />
                    <Text style={styles.sendNowText}>Send Now</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }}
      />

      {/* Create Form */}
      {showForm && (
        <CreateDropForm
          onSuccess={() => {
            setShowForm(false);
            allDrops.refetch();
          }}
          onCancel={() => setShowForm(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  addBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-end' },
  listContent: { padding: 16, paddingBottom: 32 },
  dropCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    ...shadows.card,
  },
  dropImage: { width: '100%', height: 180 },
  dropImagePlaceholder: {
    backgroundColor: colors.cardElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  typeBadgeText: { fontSize: 11, fontWeight: '700', color: colors.textPrimary },
  dropContent: { padding: 16 },
  dropTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
  dropDescription: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginBottom: 12 },
  countdownRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  countdownBlock: {
    backgroundColor: colors.cardElevated,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
    minWidth: 52,
  },
  countdownValue: { fontSize: 20, fontWeight: '800', color: colors.gold },
  countdownUnit: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
  dropLive: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.success,
    letterSpacing: 1,
    marginTop: 8,
  },
  sentRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  sentText: { fontSize: 13, color: colors.success, fontWeight: '500' },
  sendNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.gold,
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 12,
  },
  sendNowText: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  // Form
  formOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  formContainer: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 40,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  formTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  formScroll: { paddingHorizontal: 20 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1,
    marginTop: 16,
    marginBottom: 8,
  },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeChipText: { fontSize: 13, fontWeight: '500', color: colors.textSecondary },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.gold,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 20,
    marginBottom: 20,
  },
  submitBtnText: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: colors.textPrimary },
  emptySubtitle: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
});
