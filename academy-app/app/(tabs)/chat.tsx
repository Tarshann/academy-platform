import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { trackEvent } from '../../lib/analytics';

const ACADEMY_GOLD = '#CFB87C';
const NAVY = '#1a1a2e';

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
    id: 'coaches',
    name: 'Coaches',
    description: 'Coach coordination channel',
    icon: 'shield-outline',
  },
  {
    id: 'parents',
    name: 'Parents',
    description: 'Parent community & updates',
    icon: 'people-outline',
  },
  {
    id: 'announcements',
    name: 'Announcements',
    description: 'Official updates from The Academy',
    icon: 'megaphone-outline',
  },
];

export default function ChatScreen() {
  const router = useRouter();

  const onRoomPress = (channel: ChatChannel) => {
    trackEvent('chat_room_opened', { room: channel.id, room_name: channel.name });
    router.push(`/chat/${channel.id}`);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={CHANNELS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.channelCard}
            onPress={() => onRoomPress(item)}
            activeOpacity={0.7}
          >
            <View style={[
              styles.iconContainer,
              item.id === 'announcements' && styles.iconContainerAnnouncement,
            ]}>
              <Ionicons
                name={item.icon}
                size={24}
                color={item.id === 'announcements' ? NAVY : ACADEMY_GOLD}
              />
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
    backgroundColor: NAVY,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  iconContainerAnnouncement: {
    backgroundColor: ACADEMY_GOLD,
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
