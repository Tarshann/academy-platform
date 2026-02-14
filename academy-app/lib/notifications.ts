import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowInForeground: true,
  }),
});

/**
 * Request push notification permissions and get the Expo push token.
 * Returns null if device doesn't support push or permission is denied.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  // Push notifications require a physical device
  if (!Device.isDevice) {
    console.log('[Push] Not a physical device — skipping registration');
    return null;
  }

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request if not already granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('[Push] Permission not granted');
    return null;
  }

  // Android needs a notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#CFB87C',
    });
  }

  // Get the push token
  try {
    const projectId = process.env.EXPO_PUBLIC_PROJECT_ID;
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: projectId || undefined,
    });
    return tokenData.data;
  } catch (error) {
    console.error('[Push] Failed to get push token:', error);
    return null;
  }
}

/**
 * Add a listener for incoming notifications while the app is foregrounded.
 * Returns a cleanup function.
 */
export function addNotificationReceivedListener(
  handler: (notification: Notifications.Notification) => void
) {
  const subscription = Notifications.addNotificationReceivedListener(handler);
  return () => subscription.remove();
}

/**
 * Add a listener for when the user taps a notification.
 * Returns a cleanup function.
 */
export function addNotificationResponseListener(
  handler: (response: Notifications.NotificationResponse) => void
) {
  const subscription = Notifications.addNotificationResponseReceivedListener(handler);
  return () => subscription.remove();
}
