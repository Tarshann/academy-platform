import { useUser, useAuth } from '@clerk/clerk-expo';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert, Modal, TextInput, ActivityIndicator, Platform } from 'react-native';
import { Image } from 'expo-image';
import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { trpc } from '../../lib/trpc';
import { Skeleton, SkeletonCircle, SkeletonLine } from '../../components/Skeleton';
import { AnimatedCard } from '../../components/AnimatedCard';
import { trackEvent } from '../../lib/analytics';
import { colors, shadows, typography } from '../../lib/theme';

// Phone-only bridge — name and email now come from API (coaches JOIN users, commit da4a61b).
// Users table has no phone column, so phone numbers are bridged here.
const COACH_PHONES: Record<number, string> = {
  1: '5712920633',
  2: '3155426222',
};

function formatPhone(phone: string): string {
  if (phone.length === 10) {
    return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`;
  }
  return phone;
}

function CoachContactSkeleton() {
  return (
    <View style={styles.section}>
      {[1, 2].map((i) => (
        <View key={i}>
          {i > 1 && <View style={styles.divider} />}
          <View style={styles.contactRow}>
            <View style={[styles.contactIcon, styles.skeletonCircle]} />
            <View style={{ flex: 1 }}>
              <View style={[styles.skeletonLine, { width: 100 }]} />
              <View style={[styles.skeletonLine, { width: 130, marginTop: 6 }]} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

function EditNameModal({
  visible,
  currentName,
  onClose,
  onSave,
  saving,
}: {
  visible: boolean;
  currentName: string;
  onClose: () => void;
  onSave: (name: string) => void;
  saving: boolean;
}) {
  const [name, setName] = useState(currentName);

  // Reset name when modal opens
  useEffect(() => {
    if (visible) {
      setName(currentName);
    }
  }, [visible, currentName]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={styles.modalContent} activeOpacity={1} onPress={() => {}}>
          <Text style={styles.modalTitle}>Edit Name</Text>
          <TextInput
            style={styles.modalInput}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={colors.textMuted}
            autoFocus
            maxLength={100}
            returnKeyType="done"
            onSubmitEditing={() => name.trim() && onSave(name.trim())}
          />
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={onClose} disabled={saving}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalSaveBtn, (!name.trim() || saving) && { opacity: 0.5 }]}
              onPress={() => onSave(name.trim())}
              disabled={!name.trim() || saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={colors.card} />
              ) : (
                <Text style={styles.modalSaveText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

export default function ProfileScreen() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();
  const me = trpc.auth.me.useQuery();
  const coaches = trpc.coaches.list.useQuery({ limit: 20, offset: 0 });

  const role = me.data?.role ?? 'user';
  const displayName = user?.fullName || me.data?.name || 'Member';
  const email = user?.primaryEmailAddress?.emailAddress || me.data?.email || '';
  const profilePictureUrl = user?.imageUrl || null;

  const [nameModalVisible, setNameModalVisible] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [uploadingPicture, setUploadingPicture] = useState(false);

  const onEditName = () => setNameModalVisible(true);

  const onSaveName = async (newName: string) => {
    if (!user) return;
    setSavingName(true);
    try {
      // Split into first/last name for Clerk
      const parts = newName.trim().split(/\s+/);
      const firstName = parts[0] || '';
      const lastName = parts.slice(1).join(' ') || '';

      await user.update({ firstName, lastName });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      trackEvent('profile_name_updated');
      setNameModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update name. Please try again.');
    } finally {
      setSavingName(false);
    }
  };

  const onChangeProfilePicture = () => {
    const options: { text: string; onPress?: () => void; style?: 'cancel' | 'destructive' }[] = [
      {
        text: 'Camera',
        onPress: () => pickAndUploadImage('camera'),
      },
      {
        text: 'Photo Library',
        onPress: () => pickAndUploadImage('library'),
      },
    ];

    // Allow removing picture if one is set
    if (profilePictureUrl && !profilePictureUrl.includes('gravatar')) {
      options.push({
        text: 'Remove Photo',
        style: 'destructive',
        onPress: removeProfilePicture,
      });
    }

    options.push({ text: 'Cancel', style: 'cancel' });

    Alert.alert('Change Profile Picture', 'Choose a source', options);
  };

  const removeProfilePicture = async () => {
    if (!user) return;
    setUploadingPicture(true);
    try {
      await user.setProfileImage({ file: null });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      trackEvent('profile_picture_removed');
    } catch {
      Alert.alert('Error', 'Failed to remove profile picture.');
    } finally {
      setUploadingPicture(false);
    }
  };

  const pickAndUploadImage = async (source: 'camera' | 'library') => {
    if (!user) return;

    if (source === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera access is needed to take a profile photo.');
        return;
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Photo library access is needed to choose a profile photo.');
        return;
      }
    }

    const launchFn = source === 'camera'
      ? ImagePicker.launchCameraAsync
      : ImagePicker.launchImageLibraryAsync;

    const result = await launchFn({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
      Alert.alert('Image Too Large', 'Please choose an image under 5MB.');
      return;
    }

    setUploadingPicture(true);
    try {
      // Read file as base64 and pass to Clerk as a data URI
      const base64 = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const ext = asset.uri.split('.').pop()?.toLowerCase() || 'jpg';
      const mimeType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;
      const dataUri = `data:${mimeType};base64,${base64}`;

      await user.setProfileImage({ file: dataUri });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      trackEvent('profile_picture_updated');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile picture. Please try again.');
    } finally {
      setUploadingPicture(false);
    }
  };

  const onSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => signOut(),
      },
    ]);
  };

  const [deleting, setDeleting] = useState(false);

  const onDeleteAccount = useCallback(() => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all associated data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete My Account',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Are you absolutely sure?',
              'Your account, messages, and all data will be permanently removed.',
              [
                { text: 'Keep My Account', style: 'cancel' },
                {
                  text: 'Yes, Delete',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      setDeleting(true);
                      await user?.delete();
                      await signOut();
                    } catch (error) {
                      setDeleting(false);
                      Alert.alert(
                        'Error',
                        'Failed to delete account. Please try again or contact support.'
                      );
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  }, [user, signOut]);

  const onCall = (name: string, phone: string) => {
    trackEvent('coach_contact_call', { coach_name: name, phone });
    Linking.openURL(`tel:${phone}`);
  };

  const onText = (name: string, phone: string) => {
    trackEvent('coach_contact_text', { coach_name: name, phone });
    Linking.openURL(`sms:${phone}`);
  };

  if (me.isLoading) {
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Profile header skeleton */}
        <View style={[styles.headerCard, { alignItems: 'center' }]}>
          <SkeletonCircle size={80} style={{ marginBottom: 12 }} />
          <SkeletonLine width={140} height={18} style={{ marginBottom: 6 }} />
          <SkeletonLine width={180} height={12} style={{ marginBottom: 10 }} />
          <Skeleton width={80} height={22} borderRadius={6} />
        </View>
        {/* Contact skeleton */}
        <SkeletonLine width={80} height={12} style={{ marginBottom: 8, marginLeft: 4 }} />
        <View style={styles.section}>
          {[1, 2].map((i) => (
            <View key={i} style={[styles.contactRow, i > 1 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
              <SkeletonCircle size={36} style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <SkeletonLine width={100} height={14} />
                <SkeletonLine width={130} height={10} style={{ marginTop: 6 }} />
              </View>
            </View>
          ))}
        </View>
        {/* Account links skeleton */}
        <SkeletonLine width={80} height={12} style={{ marginBottom: 8, marginLeft: 4 }} />
        <View style={styles.section}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={[styles.linkRow, i > 1 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
              <Skeleton width={18} height={18} borderRadius={4} />
              <SkeletonLine width={150} height={14} style={{ marginLeft: 12 }} />
            </View>
          ))}
        </View>
      </ScrollView>
    );
  }

  // Build coach contact list from API data — names from JOIN, phones from bridge
  const coachList = (coaches.data ?? []).map((coach: any) => ({
    id: coach.id,
    name: coach.name ?? 'Coach',
    phone: COACH_PHONES[coach.id] ?? null,
    email: coach.email ?? null,
    specialties: coach.specialties,
  }));

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* Profile header */}
      <AnimatedCard index={0}>
      <LinearGradient colors={[colors.cardElevated, colors.card]} style={styles.headerCard}>
        <TouchableOpacity onPress={onChangeProfilePicture} style={styles.avatarWrapper} disabled={uploadingPicture}>
          {profilePictureUrl ? (
            <Image
              source={{ uri: profilePictureUrl }}
              style={styles.avatarImage}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.avatarEditBadge}>
            {uploadingPicture ? (
              <ActivityIndicator size={12} color="#fff" />
            ) : (
              <Ionicons name="camera" size={12} color="#fff" />
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={onEditName} style={styles.nameRow}>
          <Text style={styles.name}>{displayName}</Text>
          <Ionicons name="pencil" size={14} color="rgba(255,255,255,0.6)" style={{ marginLeft: 6 }} />
        </TouchableOpacity>
        <Text style={styles.email}>{email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>
            {role === 'admin' ? 'Administrator' : role === 'coach' ? 'Coach' : 'Member'}
          </Text>
        </View>
      </LinearGradient>
      </AnimatedCard>

      {/* Contact Coaches */}
      <AnimatedCard index={1}>
      <Text style={styles.sectionLabel}>CONTACT</Text>
      {coaches.isLoading ? (
        <CoachContactSkeleton />
      ) : coaches.isError ? (
        <View style={styles.section}>
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={24} color="#e74c3c" />
            <Text style={styles.errorText}>Could not load coaches</Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => coaches.refetch()}
            >
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : coachList.length === 0 ? (
        <View style={styles.section}>
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={24} color={colors.textMuted} />
            <Text style={styles.emptyText}>No coaches available</Text>
          </View>
        </View>
      ) : (
        <View style={styles.section}>
          {coachList.map((coach, index) => (
            <View key={coach.id}>
              {index > 0 && <View style={styles.divider} />}
              <TouchableOpacity
                style={styles.contactRow}
                onPress={() => coach.phone ? onCall(coach.name, coach.phone) : undefined}
                disabled={!coach.phone}
              >
                <View style={styles.contactIcon}>
                  <Ionicons name="call-outline" size={18} color={colors.gold} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.contactName}>{coach.name}</Text>
                  {coach.phone ? (
                    <Text style={styles.contactDetail}>{formatPhone(coach.phone)}</Text>
                  ) : coach.specialties ? (
                    <Text style={styles.contactDetail}>{coach.specialties}</Text>
                  ) : null}
                </View>
                {coach.phone && (
                  <TouchableOpacity onPress={() => onText(coach.name, coach.phone!)} style={styles.textBtn}>
                    <Ionicons name="chatbox-outline" size={16} color={colors.gold} />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
      </AnimatedCard>

      {/* Features */}
      <AnimatedCard index={2}>
      <Text style={styles.sectionLabel}>FEATURES</Text>
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => router.push('/family' as any)}
        >
          <Ionicons name="people-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.linkText}>Family & Household</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => router.push('/referrals' as any)}
        >
          <Ionicons name="gift-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.linkText}>Referral Program</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => router.push('/progress-reports' as any)}
        >
          <Ionicons name="document-text-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.linkText}>Progress Reports</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => router.push('/metrics' as any)}
        >
          <Ionicons name="analytics-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.linkText}>Athlete Metrics</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => router.push('/showcase' as any)}
        >
          <Ionicons name="star-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.linkText}>Athlete Showcase</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => router.push('/gallery' as any)}
        >
          <Ionicons name="images-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.linkText}>Social Gallery</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => router.push('/drops' as any)}
        >
          <Ionicons name="megaphone-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.linkText}>Drops & Alerts</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
      </AnimatedCard>

      {/* Account */}
      <AnimatedCard index={3}>
      <Text style={styles.sectionLabel}>ACCOUNT</Text>
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => router.push('/payments')}
        >
          <Ionicons name="card-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.linkText}>Payments & Subscriptions</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => router.push('/shop')}
        >
          <Ionicons name="bag-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.linkText}>Shop</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => router.push('/notifications-settings')}
        >
          <Ionicons name="notifications-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.linkText}>Notification Settings</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
      </AnimatedCard>

      {/* Links */}
      <AnimatedCard index={4}>
      <Text style={styles.sectionLabel}>RESOURCES</Text>
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => Linking.openURL('https://academytn.com')}
        >
          <Ionicons name="globe-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.linkText}>Visit Website</Text>
          <Ionicons name="open-outline" size={14} color={colors.textMuted} />
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => Linking.openURL('https://academytn.com/privacy')}
        >
          <Ionicons name="shield-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.linkText}>Privacy Policy</Text>
          <Ionicons name="open-outline" size={14} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
      </AnimatedCard>

      {/* Sign out */}
      <TouchableOpacity style={styles.signOutBtn} onPress={onSignOut}>
        <Ionicons name="log-out-outline" size={18} color="#e74c3c" />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      {/* Delete account */}
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={onDeleteAccount}
        disabled={deleting}
      >
        <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
        <Text style={styles.deleteText}>
          {deleting ? 'Deleting Account...' : 'Delete Account'}
        </Text>
      </TouchableOpacity>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>The Academy v{Constants.expoConfig?.version ?? '1.6.1'}</Text>
        <Text style={styles.footerText}>Gallatin, Tennessee</Text>
      </View>

      <EditNameModal
        visible={nameModalVisible}
        currentName={displayName}
        onClose={() => setNameModalVisible(false)}
        onSave={onSaveName}
        saving={savingName}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  headerCard: {
    backgroundColor: colors.cardElevated,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.gold,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: colors.gold,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.card,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.cardElevated,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  name: {
    fontFamily: 'BebasNeue',
    fontSize: 24,
    color: colors.textPrimary,
  },
  email: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  roleBadge: {
    backgroundColor: colors.goldMuted,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionLabel: {
    ...typography.overline,
    color: colors.textMuted,
    marginBottom: 8,
    marginLeft: 4,
  },
  section: {
    backgroundColor: colors.card,
    borderRadius: 12,
    marginBottom: 20,
    ...shadows.subtle,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    minHeight: 60,
  },
  contactIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.goldMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  contactDetail: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 1,
  },
  textBtn: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 64,
  },
  // Skeleton styles
  skeletonCircle: {
    backgroundColor: colors.skeletonBase,
  },
  skeletonLine: {
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.skeletonBase,
  },
  // Error state
  errorContainer: {
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  retryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.gold,
    minHeight: 44,
    justifyContent: 'center',
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.card,
  },
  // Empty state
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  linkText: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    gap: 8,
    marginBottom: 24,
    ...shadows.subtle,
  },
  signOutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#e74c3c',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    gap: 6,
    marginBottom: 24,
  },
  deleteText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  footerText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  // Modal styles
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
