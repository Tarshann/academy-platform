import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const ACADEMY_GOLD = '#CFB87C';

interface ChatChannel {
  id: string;
  name: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const CHANNELS: ChatChannel[] = [
  {
    id: 'general',
    name: 'General',
    description: 'Open discussion for all members',
    icon: 'chatbubbles-outline',
  },
  {
    id: 'announcements',
    name: 'Announcements',
    description: 'Important updates from coaches',
    icon: 'megaphone-outline',
  },
  {
    id: 'parents',
    name: 'Parents',
    description: 'Parent-only discussions',
    icon: 'people-outline',
  },
  {
    id: 'coaches',
    name: 'Coaches',
    description: 'Coach coordination channel',
    icon: 'shield-outline',
  },
];

export default function ChatScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <FlatList
        data={CHANNELS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.channelCard}
            onPress={() => router.push(`/chat/${item.id}`)}
            activeOpacity={0.7}
          >
            <View style={styles.iconContainer}>
              <Ionicons name={item.icon} size={24} color={ACADEMY_GOLD} />
            </View>
            <View style={styles.channelInfo}>
              <Text style={styles.channelName}>#{item.name}</Text>
              <Text style={styles.channelDescription}>{item.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  list: {
    padding: 16,
  },
  channelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  channelInfo: {
    flex: 1,
  },
  channelName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 2,
  },
  channelDescription: {
    fontSize: 13,
    color: '#888',
  },
});
