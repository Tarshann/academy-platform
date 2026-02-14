import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

const ACADEMY_GOLD = '#CFB87C';

export function Loading() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={ACADEMY_GOLD} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
