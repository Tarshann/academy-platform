import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { trpc } from '../lib/trpc';
import { trackEvent } from '../lib/analytics';

const ACADEMY_GOLD = '#CFB87C';
const NAVY = '#1a1a2e';

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const hour = i % 12 === 0 ? 12 : i % 12;
  const ampm = i < 12 ? 'AM' : 'PM';
  return {
    value: `${String(i).padStart(2, '0')}:00`,
    label: `${hour}:00 ${ampm}`,
  };
});

function formatTime(time: string | null): string {
  if (!time) return '10:00 PM';
  const [hours] = time.split(':').map(Number);
  const hour = hours % 12 === 0 ? 12 : hours % 12;
  const ampm = hours < 12 ? 'AM' : 'PM';
  return `${hour}:00 ${ampm}`;
}

function SettingsSkeleton() {
  return (
    <View style={styles.skeletonContainer}>
      <View style={[styles.skeletonBlock, { width: 120, height: 12, marginBottom: 12, marginLeft: 4 }]} />
      <View style={styles.card}>
        {[1, 2, 3, 4, 5].map((i) => (
          <View key={i}>
            {i > 1 && <View style={styles.divider} />}
            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <View style={[styles.skeletonBlock, { width: '60%', height: 14, marginBottom: 4 }]} />
                <View style={[styles.skeletonBlock, { width: '80%', height: 10 }]} />
              </View>
              <View style={[styles.skeletonBlock, { width: 50, height: 30, borderRadius: 15 }]} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

type SettingKey =
  | 'pushEnabled'
  | 'emailFallback'
  | 'dmNotifications'
  | 'channelNotifications'
  | 'mentionNotifications'
  | 'announcementNotifications'
  | 'quietHoursEnabled';

export default function NotificationsSettingsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const tracked = useRef(false);

  const settings = trpc.pushNotifications.getSettings.useQuery();
  const updateSettings = trpc.pushNotifications.updateSettings.useMutation();

  useEffect(() => {
    if (!tracked.current) {
      trackEvent('notification_settings_viewed');
      tracked.current = true;
    }
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await settings.refetch();
    setRefreshing(false);
  };

  const onToggle = useCallback(
    async (key: SettingKey, value: boolean) => {
      trackEvent('notification_settings_changed', {
        setting: key,
        new_value: value,
      });

      try {
        await updateSettings.mutateAsync({ [key]: value });
        settings.refetch();
      } catch {
        Alert.alert('Error', 'Could not update setting. Please try again.');
        settings.refetch();
      }
    },
    [updateSettings, settings]
  );

  const onChangeTime = useCallback(
    async (key: 'quietHoursStart' | 'quietHoursEnd', value: string) => {
      trackEvent('notification_settings_changed', {
        setting: key,
        new_value: value,
      });

      try {
        await updateSettings.mutateAsync({ [key]: value });
        settings.refetch();
      } catch {
        Alert.alert('Error', 'Could not update quiet hours. Please try again.');
        settings.refetch();
      }
    },
    [updateSettings, settings]
  );

  if (settings.isLoading) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Notifications',
            headerStyle: { backgroundColor: NAVY },
            headerTintColor: '#fff',
            headerBackTitle: 'Profile',
          }}
        />
        <ScrollView style={styles.scroll}>
          <SettingsSkeleton />
        </ScrollView>
      </>
    );
  }

  if (settings.isError) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Notifications',
            headerStyle: { backgroundColor: NAVY },
            headerTintColor: '#fff',
            headerBackTitle: 'Profile',
          }}
        />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#e74c3c" />
          <Text style={styles.errorTitle}>Could not load settings</Text>
          <Text style={styles.errorSubtitle}>Check your connection and try again</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={onRefresh}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  const data = settings.data;

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Notifications',
          headerStyle: { backgroundColor: NAVY },
          headerTintColor: '#fff',
          headerBackTitle: 'Profile',
        }}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* General */}
        <Text style={styles.sectionLabel}>GENERAL</Text>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingTitle}>Push Notifications</Text>
              <Text style={styles.settingDesc}>Receive push notifications on this device</Text>
            </View>
            <Switch
              value={data?.pushEnabled ?? false}
              onValueChange={(v) => onToggle('pushEnabled', v)}
              trackColor={{ false: '#e0e0e0', true: ACADEMY_GOLD }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingTitle}>Email Fallback</Text>
              <Text style={styles.settingDesc}>Get email when push is unavailable</Text>
            </View>
            <Switch
              value={data?.emailFallback ?? true}
              onValueChange={(v) => onToggle('emailFallback', v)}
              trackColor={{ false: '#e0e0e0', true: ACADEMY_GOLD }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Notification Types */}
        <Text style={styles.sectionLabel}>NOTIFICATION TYPES</Text>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingTitle}>Direct Messages</Text>
              <Text style={styles.settingDesc}>New messages in your DMs</Text>
            </View>
            <Switch
              value={data?.dmNotifications ?? true}
              onValueChange={(v) => onToggle('dmNotifications', v)}
              trackColor={{ false: '#e0e0e0', true: ACADEMY_GOLD }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingTitle}>Group Chat</Text>
              <Text style={styles.settingDesc}>New messages in chat rooms</Text>
            </View>
            <Switch
              value={data?.channelNotifications ?? true}
              onValueChange={(v) => onToggle('channelNotifications', v)}
              trackColor={{ false: '#e0e0e0', true: ACADEMY_GOLD }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingTitle}>@Mentions</Text>
              <Text style={styles.settingDesc}>When someone mentions you</Text>
            </View>
            <Switch
              value={data?.mentionNotifications ?? true}
              onValueChange={(v) => onToggle('mentionNotifications', v)}
              trackColor={{ false: '#e0e0e0', true: ACADEMY_GOLD }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingTitle}>Announcements</Text>
              <Text style={styles.settingDesc}>Important updates from coaches</Text>
            </View>
            <Switch
              value={data?.announcementNotifications ?? true}
              onValueChange={(v) => onToggle('announcementNotifications', v)}
              trackColor={{ false: '#e0e0e0', true: ACADEMY_GOLD }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Quiet Hours */}
        <Text style={styles.sectionLabel}>QUIET HOURS</Text>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingTitle}>Quiet Hours</Text>
              <Text style={styles.settingDesc}>Silence notifications during set hours</Text>
            </View>
            <Switch
              value={data?.quietHoursEnabled ?? false}
              onValueChange={(v) => onToggle('quietHoursEnabled', v)}
              trackColor={{ false: '#e0e0e0', true: ACADEMY_GOLD }}
              thumbColor="#fff"
            />
          </View>

          {data?.quietHoursEnabled && (
            <>
              <View style={styles.divider} />

              <TouchableOpacity
                style={styles.settingRow}
                onPress={() => setShowStartPicker(!showStartPicker)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingTitle}>Start Time</Text>
                </View>
                <Text style={styles.timeValue}>
                  {formatTime(data?.quietHoursStart ?? null)}
                </Text>
                <Ionicons name="chevron-down" size={14} color="#ccc" style={{ marginLeft: 4 }} />
              </TouchableOpacity>

              {showStartPicker && (
                <View style={styles.timePicker}>
                  {HOUR_OPTIONS.map((opt) => (
                    <TouchableOpacity
                      key={opt.value}
                      style={[
                        styles.timeOption,
                        (data?.quietHoursStart ?? '22:00') === opt.value && styles.timeOptionSelected,
                      ]}
                      onPress={() => {
                        onChangeTime('quietHoursStart', opt.value);
                        setShowStartPicker(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.timeOptionText,
                          (data?.quietHoursStart ?? '22:00') === opt.value && styles.timeOptionTextSelected,
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <View style={styles.divider} />

              <TouchableOpacity
                style={styles.settingRow}
                onPress={() => setShowEndPicker(!showEndPicker)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingTitle}>End Time</Text>
                </View>
                <Text style={styles.timeValue}>
                  {formatTime(data?.quietHoursEnd ?? null)}
                </Text>
                <Ionicons name="chevron-down" size={14} color="#ccc" style={{ marginLeft: 4 }} />
              </TouchableOpacity>

              {showEndPicker && (
                <View style={styles.timePicker}>
                  {HOUR_OPTIONS.map((opt) => (
                    <TouchableOpacity
                      key={opt.value}
                      style={[
                        styles.timeOption,
                        (data?.quietHoursEnd ?? '07:00') === opt.value && styles.timeOptionSelected,
                      ]}
                      onPress={() => {
                        onChangeTime('quietHoursEnd', opt.value);
                        setShowEndPicker(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.timeOptionText,
                          (data?.quietHoursEnd ?? '07:00') === opt.value && styles.timeOptionTextSelected,
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  // Skeleton
  skeletonContainer: {
    padding: 16,
  },
  skeletonBlock: {
    backgroundColor: '#e8e8e8',
    borderRadius: 6,
  },
  // Section
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#999',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  // Setting Row
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    minHeight: 56,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: NAVY,
    marginBottom: 2,
  },
  settingDesc: {
    fontSize: 12,
    color: '#888',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginLeft: 16,
  },
  // Time picker
  timeValue: {
    fontSize: 14,
    fontWeight: '500',
    color: ACADEMY_GOLD,
  },
  timePicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    paddingTop: 0,
    gap: 4,
  },
  timeOption: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 72,
    alignItems: 'center',
    minHeight: 36,
    justifyContent: 'center',
  },
  timeOptionSelected: {
    backgroundColor: NAVY,
  },
  timeOptionText: {
    fontSize: 13,
    color: '#666',
  },
  timeOptionTextSelected: {
    color: ACADEMY_GOLD,
    fontWeight: '600',
  },
  // Error
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 32,
    gap: 8,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: NAVY,
    marginTop: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: ACADEMY_GOLD,
    minHeight: 44,
    justifyContent: 'center',
  },
  retryText: {
    fontSize: 15,
    fontWeight: '600',
    color: NAVY,
  },
});
