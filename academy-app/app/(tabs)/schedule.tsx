import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { trpc } from '../../lib/trpc';
import { Loading } from '../../components/Loading';
import { AnimatedCard } from '../../components/AnimatedCard';
import { trackEvent } from '../../lib/analytics';
import { trackSessionRegistration } from '../../lib/rating-prompt';
import { colors, shadows, typography } from '../../lib/theme';

export default function ScheduleScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const schedules = trpc.schedules.upcoming.useQuery();
  const utils = trpc.useUtils();

  // Track session list view
  useEffect(() => {
    trackEvent('session_list_viewed');
  }, []);

  const register = trpc.schedules.register.useMutation({
    onSuccess: () => {
      Alert.alert('Registered', 'You have been registered for this session. A confirmation email has been sent.');
      utils.schedules.upcoming.invalidate();
    },
    onError: (error) => {
      if (error.message === 'Already registered for this session') {
        Alert.alert('Already Registered', 'You are already registered for this session.');
      } else if (error.message === 'This session is full') {
        Alert.alert('Session Full', 'This session has reached its maximum capacity.');
      } else {
        Alert.alert('Registration Failed', error.message || 'Could not register. Please try again.');
      }
    },
  });

  const [registeredIds, setRegisteredIds] = useState<Set<number>>(new Set());

  const onRegister = (scheduleId: number, sessionTitle?: string, sessionType?: string | null) => {
    trackEvent('registration_started', {
      schedule_id: scheduleId,
      session_name: sessionTitle ?? null,
      session_type: sessionType ?? null,
    });

    register.mutate(
      { scheduleId },
      {
        onSuccess: () => {
          setRegisteredIds((prev) => new Set(prev).add(scheduleId));
          trackEvent('registration_completed', {
            schedule_id: scheduleId,
            session_name: sessionTitle ?? null,
            session_type: sessionType ?? null,
          });
          trackSessionRegistration();
        },
      }
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await schedules.refetch();
    setRefreshing(false);
  };

  if (schedules.isLoading) return <Loading />;

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      data={schedules.data ?? []}
      keyExtractor={(item) => String(item.id)}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.empty}>No upcoming sessions.</Text>
        </View>
      }
      renderItem={({ item, index }) => {
        const start = new Date(item.startTime);
        const end = new Date(item.endTime);
        const isRegistered = registeredIds.has(item.id);
        const isRegistering = register.isPending && register.variables?.scheduleId === item.id;

        return (
          <AnimatedCard index={index}>
          <View style={styles.card}>
            <View style={styles.dateColumn}>
              <Text style={styles.dateMonth}>
                {start.toLocaleDateString(undefined, { month: 'short' }).toUpperCase()}
              </Text>
              <Text style={styles.dateDay}>{start.getDate()}</Text>
              <Text style={styles.dateWeekday}>
                {start.toLocaleDateString(undefined, { weekday: 'short' })}
              </Text>
            </View>
            <View style={styles.details}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.time}>
                {start.toLocaleTimeString(undefined, {
                  hour: 'numeric',
                  minute: '2-digit',
                })}{' '}
                -{' '}
                {end.toLocaleTimeString(undefined, {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </Text>
              {item.location && (
                <Text style={styles.location}>{item.location}</Text>
              )}

              <View style={styles.bottomRow}>
                {item.sessionType && (
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText}>
                      {item.sessionType.replace('_', ' ')}
                    </Text>
                  </View>
                )}
                {item.maxParticipants && (
                  <Text style={styles.spots}>
                    {item.maxParticipants} spots
                  </Text>
                )}
              </View>

              {isRegistered ? (
                <View style={styles.registeredBadge}>
                  <Ionicons name="checkmark-circle" size={16} color="#2ecc71" />
                  <Text style={styles.registeredText}>Registered</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.registerButton, isRegistering && styles.registerButtonDisabled]}
                  onPress={() => onRegister(item.id, item.title, item.sessionType)}
                  disabled={isRegistering}
                >
                  <Text style={styles.registerButtonText}>
                    {isRegistering ? 'Registering...' : 'Register'}
                  </Text>
                </TouchableOpacity>
              )}
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
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  empty: {
    color: colors.textMuted,
    fontSize: 16,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    ...shadows.card,
  },
  dateColumn: {
    width: 56,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginRight: 16,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    paddingRight: 16,
    paddingTop: 4,
  },
  dateMonth: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.gold,
    letterSpacing: 1,
  },
  dateDay: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: typography.display.fontFamily,
  },
  dateWeekday: {
    fontSize: 11,
    color: colors.textMuted,
  },
  details: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  time: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  location: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
  },
  typeBadge: {
    backgroundColor: colors.goldMuted,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.gold,
    textTransform: 'capitalize',
  },
  spots: {
    fontSize: 11,
    color: colors.textMuted,
  },
  registerButton: {
    backgroundColor: colors.gold,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
    marginTop: 10,
    ...shadows.glow,
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    color: colors.card,
    fontSize: 13,
    fontWeight: '600',
  },
  registeredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 6,
  },
  registeredText: {
    color: '#2ecc71',
    fontSize: 13,
    fontWeight: '600',
  },
});
