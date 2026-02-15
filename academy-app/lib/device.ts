import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const DEVICE_ID_KEY = 'academy_device_id';

function generateId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 24; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return `${Platform.OS}-${id}`;
}

/**
 * Returns a stable device identifier persisted in SecureStore.
 * Created once per install, survives app updates but not reinstalls.
 */
export async function getDeviceId(): Promise<string> {
  try {
    const existing = await SecureStore.getItemAsync(DEVICE_ID_KEY);
    if (existing) return existing;

    const id = generateId();
    await SecureStore.setItemAsync(DEVICE_ID_KEY, id);
    return id;
  } catch {
    // SecureStore unavailable (e.g. simulator) — return ephemeral ID
    return generateId();
  }
}
