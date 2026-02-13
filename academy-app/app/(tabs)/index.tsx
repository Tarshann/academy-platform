import { useUser } from '@clerk/clerk-expo';
import { View, Text, Image, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { useState } from 'react';
import { trpc } from '../../lib/trpc';
import { Loading } from '../../components/Loading';

const ACADEMY_GOLD = '#CFB87C';

export default function DashboardScreen() {
  const { user } = useUser();
  const [refreshing, setRefreshing] = useState(false);

  const me = trpc.auth.me.useQuery();
  const announcements = trpc.announcements.list.useQuery();
  const schedules = trpc.schedules.upcoming.useQuery();

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      me.refetch(),
      announcements.refetch(),
      schedules.refetch(),
    ]);
    setRefreshing(false);
  };

  const isAdmin = me.data?.role === 'admin';

  const nextSession = schedules.data?.[0];

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      data={announcements.data ?? []}
      keyExtractor={(item) => String(item.id)}
      ListHeaderComponent={
        <View>
          <View style={styles.headerRow}>
            <Image
              source={require('../../assets/academy-logo.jpeg')}
              style={styles.headerLogo}
              resizeMode="contain"
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.welcome}>
                Welcome, {user?.firstName || 'Member'}
              </Text>
            </View>
            {isAdmin && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Admin</Text>
              </View>
            )}
          </View>

          {nextSession && (
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Next Session</Text>
              <Text style={styles.cardTitle}>{nextSession.title}</Text>
              <Text style={styles.cardMeta}>
                {new Date(nextSession.startTime).toLocaleDateString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}{' '}
                at{' '}
                {new Date(nextSession.startTime).toLocaleTimeString(undefined, {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </Text>
              {nextSession.location && (
                <Text style={styles.cardMeta}>{nextSession.location}</Text>
              )}
            </View>
          )}

          <Text style={styles.sectionTitle}>Announcements</Text>

          {announcements.isLoading && <Loading />}
          {announcements.data?.length === 0 && (
            <Text style={styles.empty}>No announcements right now.</Text>
          )}
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.announcementCard}>
          <Text style={styles.announcementTitle}>{item.title}</Text>
          <Text style={styles.announcementContent}>{item.content}</Text>
          {item.publishedAt && (
            <Text style={styles.announcementDate}>
              {new Date(item.publishedAt).toLocaleDateString()}
            </Text>
          )}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLogo: {
    width: 44,
    height: 44,
    borderRadius: 8,
    marginRight: 12,
  },
  welcome: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  badge: {
    backgroundColor: ACADEMY_GOLD,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 12,
  },
  badgeText: {
    color: '#1a1a2e',
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  cardLabel: {
    color: ACADEMY_GOLD,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardMeta: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 12,
  },
  empty: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
  },
  announcementCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  announcementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 6,
  },
  announcementContent: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
  },
  announcementDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
});
