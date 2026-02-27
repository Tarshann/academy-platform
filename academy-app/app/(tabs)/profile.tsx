import { useUser, useAuth } from '@clerk/clerk-expo';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { trpc } from '../../lib/trpc';
import { Loading } from '../../components/Loading';
import { trackEvent } from '../../lib/analytics';

const GOLD = '#CFB87C';
const NAVY = '#1a1a2e';

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

export default function ProfileScreen() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();
  const me = trpc.auth.me.useQuery();
  const coaches = trpc.coaches.list.useQuery({ limit: 20, offset: 0 });

  const role = me.data?.role ?? 'user';
  const displayName = me.data?.name || user?.fullName || 'Member';
  const email = user?.primaryEmailAddress?.emailAddress || me.data?.email || '';

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

  if (me.isLoading) return <Loading />;

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
      <View style={styles.headerCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {displayName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.email}>{email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>
            {role === 'admin' ? 'Administrator' : role === 'coach' ? 'Coach' : 'Member'}
          </Text>
        </View>
      </View>

      {/* Contact Coaches */}
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
            <Ionicons name="people-outline" size={24} color="#ccc" />
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
                  <Ionicons name="call-outline" size={18} color={GOLD} />
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
                    <Ionicons name="chatbox-outline" size={16} color={GOLD} />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Account */}
      <Text style={styles.sectionLabel}>ACCOUNT</Text>
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => router.push('/payments')}
        >
          <Ionicons name="card-outline" size={18} color="#666" />
          <Text style={styles.linkText}>Payments & Subscriptions</Text>
          <Ionicons name="chevron-forward" size={14} color="#ccc" />
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => router.push('/shop')}
        >
          <Ionicons name="bag-outline" size={18} color="#666" />
          <Text style={styles.linkText}>Shop</Text>
          <Ionicons name="chevron-forward" size={14} color="#ccc" />
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => router.push('/notifications-settings')}
        >
          <Ionicons name="notifications-outline" size={18} color="#666" />
          <Text style={styles.linkText}>Notification Settings</Text>
          <Ionicons name="chevron-forward" size={14} color="#ccc" />
        </TouchableOpacity>
      </View>

      {/* Links */}
      <Text style={styles.sectionLabel}>RESOURCES</Text>
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => Linking.openURL('https://academytn.com')}
        >
          <Ionicons name="globe-outline" size={18} color="#666" />
          <Text style={styles.linkText}>Visit Website</Text>
          <Ionicons name="open-outline" size={14} color="#ccc" />
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => Linking.openURL('https://academytn.com/privacy')}
        >
          <Ionicons name="shield-outline" size={18} color="#666" />
          <Text style={styles.linkText}>Privacy Policy</Text>
          <Ionicons name="open-outline" size={14} color="#ccc" />
        </TouchableOpacity>
      </View>

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
        <Ionicons name="trash-outline" size={16} color="#999" />
        <Text style={styles.deleteText}>
          {deleting ? 'Deleting Account...' : 'Delete Account'}
        </Text>
      </TouchableOpacity>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>The Academy v{Constants.expoConfig?.version ?? '1.3.0'}</Text>
        <Text style={styles.footerText}>Gallatin, Tennessee</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  headerCard: {
    backgroundColor: NAVY,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '700',
    color: NAVY,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 10,
  },
  roleBadge: {
    backgroundColor: 'rgba(207,184,124,0.15)',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: GOLD,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#999',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
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
    backgroundColor: '#f0e8d5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactName: {
    fontSize: 15,
    fontWeight: '600',
    color: NAVY,
  },
  contactDetail: {
    fontSize: 13,
    color: '#888',
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
    backgroundColor: '#f0f0f0',
    marginLeft: 64,
  },
  // Skeleton styles
  skeletonCircle: {
    backgroundColor: '#e8e8e8',
  },
  skeletonLine: {
    height: 12,
    borderRadius: 6,
    backgroundColor: '#e8e8e8',
  },
  // Error state
  errorContainer: {
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#888',
  },
  retryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: GOLD,
    minHeight: 44,
    justifyContent: 'center',
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
    color: NAVY,
  },
  // Empty state
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
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
    color: NAVY,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
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
    color: '#999',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  footerText: {
    fontSize: 12,
    color: '#bbb',
  },
});
