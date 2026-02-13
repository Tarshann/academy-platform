import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { useState } from 'react';
import { trpc } from '../../lib/trpc';
import { Loading } from '../../components/Loading';

const ACADEMY_GOLD = '#CFB87C';

export default function ScheduleScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const schedules = trpc.schedules.upcoming.useQuery();

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
      renderItem={({ item }) => {
        const start = new Date(item.startTime);
        const end = new Date(item.endTime);

        return (
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
              {item.sessionType && (
                <View style={styles.typeBadge}>
                  <Text style={styles.typeBadgeText}>
                    {item.sessionType.replace('_', ' ')}
                  </Text>
                </View>
              )}
            </View>
          </View>
        );
      }}
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
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  empty: {
    color: '#999',
    fontSize: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dateColumn: {
    width: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderRightWidth: 1,
    borderRightColor: '#eee',
    paddingRight: 16,
  },
  dateMonth: {
    fontSize: 11,
    fontWeight: '600',
    color: ACADEMY_GOLD,
    letterSpacing: 1,
  },
  dateDay: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  dateWeekday: {
    fontSize: 11,
    color: '#999',
  },
  details: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 4,
  },
  time: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  location: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0e8d5',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 6,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8a7340',
    textTransform: 'capitalize',
  },
});
