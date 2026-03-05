import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface TypingIndicatorProps {
  typingUsers: { userId: number; name: string }[];
  myUserId?: number;
}

/**
 * Displays "[User] is typing..." below the message list.
 * Filters out the current user from the typing list.
 */
export function TypingIndicator({ typingUsers, myUserId }: TypingIndicatorProps) {
  const others = typingUsers.filter((u) => u.userId !== myUserId);
  if (others.length === 0) return null;

  let text: string;
  if (others.length === 1) {
    text = `${others[0].name} is typing...`;
  } else if (others.length === 2) {
    text = `${others[0].name} and ${others[1].name} are typing...`;
  } else {
    text = `${others[0].name} and ${others.length - 1} others are typing...`;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    backgroundColor: '#f5f5f5',
  },
  text: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
});
