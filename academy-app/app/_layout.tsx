import { ClerkProvider, ClerkLoaded, useAuth, useUser } from '@clerk/clerk-expo';
import { QueryClientProvider } from '@tanstack/react-query';
import { Slot, Stack, useRouter, useSegments, usePathname } from 'expo-router';
import { useEffect, useRef, useCallback } from 'react';
import { Platform, View, Text, StyleSheet } from 'react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-system-ui';
import { tokenCache } from '../lib/clerk';
import { TRPCProvider, queryClient } from '../lib/trpc';
import { trpc } from '../lib/trpc';
import { registerForPushNotifications, addNotificationResponseListener } from '../lib/notifications';
import { getDeviceId } from '../lib/device';
import { Loading } from '../components/Loading';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { initPostHog, identifyUser, resetUser, trackEvent } from '../lib/analytics';
import { closeAbly } from '../lib/realtime';
import { colors } from '../lib/theme';
import { OfflineBanner } from '../components/OfflineBanner';

const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

function ConfigError({ message }: { message: string }) {
  return (
    <View style={configStyles.container}>
      <Text style={configStyles.title}>Configuration Error</Text>
      <Text style={configStyles.message}>{message}</Text>
    </View>
  );
}

const configStyles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.card, padding: 24 },
  title: { fontSize: 20, fontWeight: '700', color: colors.gold, marginBottom: 12 },
  message: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
});

function PushRegistration() {
  const { isSignedIn } = useAuth();
  const registerExpoToken = trpc.pushNotifications.registerExpoToken.useMutation();
  const registered = useRef(false);

  useEffect(() => {
    if (!isSignedIn || registered.current) return;

    (async () => {
      try {
        const [token, deviceId] = await Promise.all([
          registerForPushNotifications(),
          getDeviceId(),
        ]);
        if (token) {
          const platform = Platform.OS === 'ios' ? 'ios' : 'android';
          registerExpoToken.mutate(
            { expoPushToken: token, platform: platform as 'ios' | 'android', deviceId },
            {
              onSuccess: () => {
                registered.current = true;
                if (__DEV__) console.log('[Push] Token registered:', token, 'device:', deviceId);
              },
              onError: (err) => console.error('[Push] Registration failed:', err),
            }
          );
        }
      } catch (err) {
        console.error('[Push] Setup error:', err);
      }
    })();
  }, [isSignedIn]);

  return null;
}

function NotificationHandler() {
  const router = useRouter();

  useEffect(() => {
    // Handle notification taps — deep link to conversation
    const cleanup = addNotificationResponseListener((response) => {
      try {
        const data = response.notification.request.content.data;
        const VALID_ROOMS = ['general', 'coaches', 'parents', 'announcements'];
        if (data?.type === 'chat' && data?.room && VALID_ROOMS.includes(String(data.room))) {
          router.push(`/chat/${data.room}`);
        } else if (data?.type === 'dm' && data?.conversationId && Number.isFinite(Number(data.conversationId))) {
          router.push(`/dm/${data.conversationId}`);
        }
      } catch (err) {
        console.error('[Notification] Deep link error:', err);
      }
    });

    return cleanup;
  }, [router]);

  return null;
}

// Track screen views via Expo Router pathname changes
function ScreenTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname) {
      trackEvent('$screen', { $screen_name: pathname });
    }
  }, [pathname]);

  return null;
}

// Sync Clerk user identity to PostHog
function IdentitySync() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();

  useEffect(() => {
    if (isSignedIn && user) {
      identifyUser(user.id, {
        email: user.primaryEmailAddress?.emailAddress ?? null,
        name: user.fullName ?? null,
      });
    } else if (!isSignedIn) {
      closeAbly();
      resetUser();
    }
  }, [isSignedIn, user]);

  return null;
}

function AuthGuard() {
  const { isLoaded, isSignedIn } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const hasNavigated = useRef(false);
  const onboardingChecked = useRef(false);

  // Check onboarding progress for signed-in users
  const onboardingProgress = trpc.onboarding.getProgress.useQuery(undefined, {
    enabled: isLoaded && !!isSignedIn,
  });

  useEffect(() => {
    if (!isLoaded) return;

    const inAuthGroup = segments[0] === '(auth)';
    const isOnboarding = segments[0] === 'onboarding';

    if (!isSignedIn && !inAuthGroup) {
      hasNavigated.current = true;
      router.replace('/(auth)/sign-in');
    } else if (isSignedIn && inAuthGroup) {
      hasNavigated.current = true;
      router.replace('/(tabs)');
    } else if (
      isSignedIn &&
      !inAuthGroup &&
      !isOnboarding &&
      !onboardingChecked.current &&
      onboardingProgress.data &&
      !onboardingProgress.data.completed
    ) {
      onboardingChecked.current = true;
      router.replace('/onboarding');
    } else if (
      isSignedIn &&
      onboardingProgress.data?.completed
    ) {
      onboardingChecked.current = true;
    }
  }, [isLoaded, isSignedIn, segments, router, onboardingProgress.data]);

  if (!isLoaded) return <Loading />;

  return (
    <>
      <OfflineBanner />
      <PushRegistration />
      <NotificationHandler />
      <ScreenTracker />
      <IdentitySync />
      <ErrorBoundary>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="dm" options={{ headerShown: false, presentation: 'card' }} />
          <Stack.Screen name="chat" options={{ headerShown: false, presentation: 'card' }} />
          <Stack.Screen name="gallery" options={{ headerShown: false, presentation: 'card' }} />
          <Stack.Screen name="showcase" options={{ headerShown: false, presentation: 'card' }} />
          <Stack.Screen name="metrics" options={{ headerShown: false, presentation: 'card' }} />
          <Stack.Screen name="drops" options={{ headerShown: false, presentation: 'card' }} />
          <Stack.Screen name="vision-capture" options={{ headerShown: false, presentation: 'card' }} />
          <Stack.Screen name="admin" options={{ headerShown: false, presentation: 'card' }} />
          <Stack.Screen name="admin-members" options={{ headerShown: true, presentation: 'card', title: 'Members', headerStyle: { backgroundColor: colors.card }, headerTintColor: colors.textPrimary }} />
          <Stack.Screen name="admin-contacts" options={{ headerShown: true, presentation: 'card', title: 'Contacts', headerStyle: { backgroundColor: colors.card }, headerTintColor: colors.textPrimary }} />
          <Stack.Screen name="admin-announcements" options={{ headerShown: true, presentation: 'card', title: 'Announcements', headerStyle: { backgroundColor: colors.card }, headerTintColor: colors.textPrimary }} />
          <Stack.Screen name="admin-schedules" options={{ headerShown: true, presentation: 'card', title: 'Schedules', headerStyle: { backgroundColor: colors.card }, headerTintColor: colors.textPrimary }} />
          <Stack.Screen name="shop" options={{ headerShown: true, presentation: 'card', title: 'Shop', headerStyle: { backgroundColor: colors.card }, headerTintColor: colors.textPrimary }} />
          <Stack.Screen name="payments" options={{ headerShown: true, presentation: 'card', title: 'Payments & Subscriptions', headerStyle: { backgroundColor: colors.card }, headerTintColor: colors.textPrimary }} />
          <Stack.Screen name="notifications-settings" options={{ headerShown: true, presentation: 'card', title: 'Notifications', headerStyle: { backgroundColor: colors.card }, headerTintColor: colors.textPrimary }} />
          <Stack.Screen name="family" options={{ headerShown: false, presentation: 'card' }} />
          <Stack.Screen name="referrals" options={{ headerShown: false, presentation: 'card' }} />
          <Stack.Screen name="progress-reports" options={{ headerShown: false, presentation: 'card' }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false, presentation: 'card' }} />
        </Stack>
      </ErrorBoundary>
    </>
  );
}

function RootLayout() {
  const [fontsLoaded] = useFonts({
    BebasNeue: require('../assets/fonts/BebasNeue-Regular.ttf'),
  });

  useEffect(() => {
    initPostHog();
  }, []);

  if (!fontsLoaded) {
    return <Loading />;
  }

  if (!CLERK_PUBLISHABLE_KEY) {
    return (
      <ConfigError message="Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY. Please check your environment configuration and rebuild." />
    );
  }

  return (
    <ClerkProvider
      publishableKey={CLERK_PUBLISHABLE_KEY}
      tokenCache={tokenCache}
    >
      <ClerkLoaded>
        <QueryClientProvider client={queryClient}>
          <TRPCProvider>
            <AuthGuard />
          </TRPCProvider>
        </QueryClientProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}

export default RootLayout;
