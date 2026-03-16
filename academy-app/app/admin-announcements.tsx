import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { trpc } from '../lib/trpc';
import { colors, shadows, typography } from '../lib/theme';

export default function AdminAnnouncementsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const announcements = trpc.admin.announcements.list.useQuery();
  const create = trpc.admin.announcements.create.useMutation({
    onSuccess: () => {
      announcements.refetch();
      setShowForm(false);
      setTitle('');
      setContent('');
    },
    onError: (err) => Alert.alert('Error', err.message),
  });
  const publish = trpc.admin.announcements.publish.useMutation({
    onSuccess: () => announcements.refetch(),
    onError: (err) => Alert.alert('Error', err.message),
  });
  const remove = trpc.admin.announcements.delete.useMutation({
    onSuccess: () => announcements.refetch(),
    onError: (err) => Alert.alert('Error', err.message),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await announcements.refetch();
    setRefreshing(false);
  };

  const handleCreate = () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Required', 'Title and content are required');
      return;
    }
    create.mutate({ title: title.trim(), content: content.trim() });
  };

  const handleDelete = (id: number) => {
    Alert.alert('Delete', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => remove.mutate({ id }) },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <FlatList
        style={styles.list}
        contentContainerStyle={styles.content}
        data={announcements.data ?? []}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View>
            {/* Create toggle */}
            <TouchableOpacity
              style={styles.createBtn}
              onPress={() => setShowForm(!showForm)}
              activeOpacity={0.7}
            >
              <Ionicons name={showForm ? 'close' : 'add'} size={20} color={colors.card} />
              <Text style={styles.createBtnText}>{showForm ? 'Cancel' : 'New Announcement'}</Text>
            </TouchableOpacity>

            {/* Create form */}
            {showForm && (
              <View style={styles.form}>
                <TextInput
                  style={styles.input}
                  placeholder="Title"
                  placeholderTextColor={colors.textMuted}
                  value={title}
                  onChangeText={setTitle}
                />
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Content"
                  placeholderTextColor={colors.textMuted}
                  value={content}
                  onChangeText={setContent}
                  multiline
                  numberOfLines={4}
                />
                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={handleCreate}
                  disabled={create.isPending}
                  activeOpacity={0.7}
                >
                  <Text style={styles.submitBtnText}>
                    {create.isPending ? 'Creating...' : 'Create Draft'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          announcements.isLoading ? (
            <View style={styles.center}>
              <Text style={styles.emptyText}>Loading...</Text>
            </View>
          ) : announcements.isError ? (
            <View style={styles.center}>
              <Ionicons name="alert-circle-outline" size={40} color={colors.error} />
              <Text style={styles.emptyText}>Failed to load announcements</Text>
              <TouchableOpacity onPress={() => announcements.refetch()} style={styles.retryBtn}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.center}>
              <Ionicons name="megaphone-outline" size={40} color={colors.textMuted} />
              <Text style={styles.emptyText}>No announcements yet</Text>
            </View>
          )
        }
        renderItem={({ item }) => {
          const isDraft = !item.publishedAt;
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <View style={[styles.statusBadge, isDraft ? styles.draftBadge : styles.pubBadge]}>
                  <Text style={[styles.statusText, isDraft ? styles.draftText : styles.pubText]}>
                    {isDraft ? 'Draft' : 'Published'}
                  </Text>
                </View>
              </View>
              <Text style={styles.cardContent} numberOfLines={3}>{item.content}</Text>
              <View style={styles.cardActions}>
                {isDraft && (
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => publish.mutate({ id: item.id })}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="send-outline" size={14} color={colors.success} />
                    <Text style={[styles.actionText, { color: colors.success }]}>Publish</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleDelete(item.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={14} color={colors.error} />
                  <Text style={[styles.actionText, { color: colors.error }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 32 },
  center: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyText: { fontSize: 14, color: colors.textMuted },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.gold,
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 16,
    minHeight: 48,
  },
  createBtnText: { color: colors.card, fontSize: 15, fontWeight: '700' },
  form: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 12,
    ...shadows.card,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.textPrimary,
    fontSize: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  submitBtn: {
    backgroundColor: colors.gold,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  submitBtnText: { color: colors.card, fontSize: 14, fontWeight: '700' },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    ...shadows.subtle,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: { fontSize: 15, fontWeight: '600', color: colors.textPrimary, flex: 1, marginRight: 8 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  draftBadge: { backgroundColor: colors.warning + '22' },
  pubBadge: { backgroundColor: colors.success + '22' },
  statusText: { fontSize: 11, fontWeight: '600' },
  draftText: { color: colors.warning },
  pubText: { color: colors.success },
  cardContent: { fontSize: 13, color: colors.textSecondary, lineHeight: 18, marginBottom: 8 },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: colors.surface,
    minHeight: 44,
  },
  actionText: { fontSize: 12, fontWeight: '600' },
  retryBtn: {
    backgroundColor: colors.gold,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center' as const,
  },
  retryText: {
    color: colors.card,
    fontSize: 14,
    fontWeight: '600' as const,
  },
});
