import * as Sentry from '@sentry/react-native';
import { ClerkProvider, ClerkLoaded, useAuth, useUser } from '@clerk/clerk-expo';
import { QueryClientProvider } from '@tanstack/react-query';
import { Slot, useRouter, useSegments, usePathname } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Platform, View, Text, StyleSheet } from 'react-native';
import { tokenCache } from '../lib/clerk';
import { TRPCProvider, queryClient } from '../lib/trpc';
import { trpc } from '../lib/trpc';
import { registerForPushNotifications, addNotificationResponseListener } from '../lib/notifications';
import { getDeviceId } from '../lib/device';
import { Loading } from '../components/Loading';
import { initSentry, initPostHog, identifyUser, resetUser, trackEvent } from '../lib/analytics';

// Initialize Sentry before anything renders
initSentry();

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
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a2e', padding: 24 },
  title: { fontSize: 20, fontWeight: '700', color: '#CFB87C', marginBottom: 12 },
  message: { fontSize: 14, color: '#ccc', textAlign: 'center', lineHeight: 20 },
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
                console.log('[Push] Token registered:', token, 'device:', deviceId);
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
        if (data?.type === 'chat' && data?.room) {
          router.push(`/chat/${data.room}`);
        } else if (data?.type === 'dm' && data?.conversationId) {
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

// Sync Clerk user identity to Sentry + PostHog
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
      resetUser();
    }
  }, [isSignedIn, user]);

  return null;
}

function AuthGuard() {
  const { isLoaded, isSignedIn } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isSignedIn && !inAuthGroup) {
      router.replace('/(auth)/sign-in');
    } else if (isSignedIn && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isLoaded, isSignedIn, segments, router]);

  if (!isLoaded) return <Loading />;

  return (
    <>
      <PushRegistration />
      <NotificationHandler />
      <ScreenTracker />
      <IdentitySync />
      <Slot />
    </>
  );
}

function RootLayout() {
  useEffect(() => {
    initPostHog();
  }, []);

  if (!CLERK_PUBLISHABLE_KEY) {
    return (
      <ConfigError message="Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY. Please check your environment configuration and rebuild." />
    );
  }

  return (
    <Sentry.ErrorBoundary
      fallback={({ resetError }) => (
        <View style={configStyles.container}>
          <Text style={configStyles.title}>Something went wrong</Text>
          <Text style={configStyles.message}>
            An unexpected error occurred. Please try again.
          </Text>
          <Text
            style={{ color: '#CFB87C', fontSize: 16, fontWeight: '600', marginTop: 24 }}
            onPress={resetError}
          >
            Try Again
          </Text>
        </View>
      )}
    >
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
    </Sentry.ErrorBoundary>
  );
}

export default Sentry.wrap(RootLayout);
