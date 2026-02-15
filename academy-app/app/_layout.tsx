import { ClerkProvider, ClerkLoaded, useAuth } from '@clerk/clerk-expo';
import { QueryClientProvider } from '@tanstack/react-query';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { tokenCache } from '../lib/clerk';
import { TRPCProvider, queryClient } from '../lib/trpc';
import { trpc } from '../lib/trpc';
import { registerForPushNotifications, addNotificationResponseListener } from '../lib/notifications';
import { getDeviceId } from '../lib/device';
import { Loading } from '../components/Loading';

const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

function PushRegistration() {
  const { isSignedIn } = useAuth();
  const registerExpoToken = trpc.pushNotifications.registerExpoToken.useMutation();
  const registered = useRef(false);

  useEffect(() => {
    if (!isSignedIn || registered.current) return;

    (async () => {
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
    })();
  }, [isSignedIn]);

  return null;
}

function NotificationHandler() {
  const router = useRouter();

  useEffect(() => {
    // Handle notification taps — deep link to conversation
    const cleanup = addNotificationResponseListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.type === 'chat' && data?.room) {
        router.push(`/chat/${data.room}`);
      } else if (data?.type === 'dm' && data?.conversationId) {
        router.push(`/dm/${data.conversationId}`);
      }
    });

    return cleanup;
  }, [router]);

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
      <Slot />
    </>
  );
}

export default function RootLayout() {
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
