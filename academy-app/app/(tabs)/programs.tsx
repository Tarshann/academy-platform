import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { trpc } from '../../lib/trpc';
import { Loading } from '../../components/Loading';

const ACADEMY_GOLD = '#CFB87C';
const SITE_URL = 'https://academytn.com';

function formatPrice(price: string | number): string {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(num)) return '';
  return `$${num % 1 === 0 ? num.toFixed(0) : num.toFixed(2)}`;
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    group: 'Group Training',
    individual: 'Private Training',
    shooting: 'Shooting Lab',
    league: 'League',
    camp: 'Camp',
    membership: 'Membership',
  };
  return labels[category] || category;
}

function getSportLabel(sport: string | null): string | null {
  if (!sport) return null;
  const labels: Record<string, string> = {
    basketball: 'Basketball',
    flag_football: 'Flag Football',
    soccer: 'Soccer',
    multi_sport: 'Multi-Sport',
    saq: 'SAQ',
  };
  return labels[sport] || sport;
}

export default function ProgramsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const programs = trpc.programs.list.useQuery();

  const onRefresh = async () => {
    setRefreshing(true);
    await programs.refetch();
    setRefreshing(false);
  };

  const onProgramTap = (name: string) => {
    Alert.alert(
      name,
      'Would you like to view this program on our website?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'View Program',
          onPress: () => Linking.openURL(`${SITE_URL}/signup`),
        },
      ]
    );
  };

  if (programs.isLoading) return <Loading />;

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      data={programs.data ?? []}
      keyExtractor={(item) => String(item.id)}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.empty}>No programs available.</Text>
        </View>
      }
      renderItem={({ item }) => {
        const sport = getSportLabel(item.sport);
        const isPerformanceLab = item.slug?.includes('performance');
        const isPrivate = item.category === 'individual';

        let priceDisplay = `${formatPrice(item.price)}`;
        let priceDetail = '';

        if (isPerformanceLab) {
          priceDisplay = `${formatPrice(item.price)}/mo`;
          priceDetail = `Apply \u2014 ${item.maxParticipants || 8} Athletes Per Cohort`;
        } else if (item.category === 'membership') {
          priceDisplay = `${formatPrice(item.price)}/mo`;
        }

        return (
          <TouchableOpacity
            style={styles.card}
            onPress={() => onProgramTap(item.name)}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeader}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>
                  {getCategoryLabel(item.category)}
                </Text>
              </View>
              {sport && <Text style={styles.sportLabel}>{sport}</Text>}
            </View>

            <Text style={styles.programName}>{item.name}</Text>
            <Text style={styles.description} numberOfLines={2}>
              {item.description}
            </Text>

            <View style={styles.metaRow}>
              <Ionicons name="people-outline" size={14} color="#888" />
              <Text style={styles.ageRange}>
                Ages {item.ageMin}\u2013{item.ageMax}
              </Text>
              {item.maxParticipants && (
                <>
                  <Text style={styles.metaDot}>&middot;</Text>
                  <Text style={styles.ageRange}>
                    Max {item.maxParticipants}
                  </Text>
                </>
              )}
            </View>

            <View style={styles.priceRow}>
              <View>
                {priceDetail ? (
                  <Text style={styles.priceDetail}>{priceDetail}</Text>
                ) : null}
                <Text style={styles.price}>{priceDisplay}</Text>
              </View>
              <View style={styles.ctaButton}>
                <Text style={styles.ctaText}>
                  {isPerformanceLab ? 'Apply' : isPrivate ? 'Inquire' : 'Sign Up'}
                </Text>
                <Ionicons name="arrow-forward" size={14} color="#1a1a2e" />
              </View>
            </View>
          </TouchableOpacity>
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
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  categoryBadge: {
    backgroundColor: '#1a1a2e',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  categoryText: {
    color: ACADEMY_GOLD,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sportLabel: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
  },
  programName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  ageRange: {
    fontSize: 12,
    color: '#888',
  },
  metaDot: {
    color: '#ccc',
    fontSize: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 14,
  },
  priceDetail: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ACADEMY_GOLD,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    gap: 6,
  },
  ctaText: {
    color: '#1a1a2e',
    fontSize: 13,
    fontWeight: '600',
  },
});
