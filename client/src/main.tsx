import React from "react";
import { ClerkProvider, useAuth as useClerkAuth } from "@clerk/clerk-react";
import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import {
  getLoginUrl,
  getClerkPublishableKey,
  isValidClerkPublishableKey,
} from "./const";
import { logger } from "@/lib/logger";
import { toast } from "sonner";
import {
  ClerkStateFallbackProvider,
  ClerkStateProvider,
} from "@/contexts/ClerkStateContext";
import "./index.css";

const isRetryableError = (error: unknown) => {
  if (error instanceof TRPCClientError) {
    const code = error.data?.code;
    return (
      code === "INTERNAL_SERVER_ERROR" ||
      code === "TIMEOUT" ||
      code === "UNAVAILABLE"
    );
  }

  if (error instanceof Error) {
    return /network|timeout|fetch/i.test(error.message);
  }

  return false;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) =>
        isRetryableError(error) && failureCount < 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 4000),
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: (failureCount, error) =>
        isRetryableError(error) && failureCount < 1,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 3000),
    },
  },
});

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  const loginUrl = getLoginUrl();
  if (loginUrl === "#") {
    logger.warn("[Auth] Redirect skipped because authentication is not configured.");
    return;
  }

  window.location.href = loginUrl;
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    logger.error("[API Query Error]", error);
    if (isRetryableError(error)) {
      toast.error("We hit a network issue. Retrying now...");
    }
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    logger.error("[API Mutation Error]", error);
    if (isRetryableError(error)) {
      toast.error("Network error. Please try again.");
    }
  }
});

// Create a function to create the tRPC client with Clerk token support
function createTrpcClient(getToken?: () => Promise<string | null>) {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: "/api/trpc",
        transformer: superjson,
        async headers() {
          const headers: Record<string, string> = {};
          
          // Include Clerk session token if available
          if (getToken) {
            try {
              const token = await getToken();
              if (token) {
                headers.Authorization = `Bearer ${token}`;
              }
            } catch (error) {
              logger.warn("[tRPC] Failed to get Clerk token:", error);
            }
          }
          
          return headers;
        },
        fetch(input, init) {
          return globalThis.fetch(input, {
            ...(init ?? {}),
            credentials: "include",
          });
        },
      }),
    ],
  });
}

const clerkPublishableKey = getClerkPublishableKey();
const isValidClerkKey = isValidClerkPublishableKey(clerkPublishableKey);

const injectAnalyticsScript = () => {
  const endpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT;
  const websiteId = import.meta.env.VITE_ANALYTICS_WEBSITE_ID;

  if (!endpoint || !websiteId) return;
  if (document.querySelector("script[data-website-id]")) return;

  const script = document.createElement("script");
  script.defer = true;
  script.src = `${endpoint.replace(/\/$/, "")}/umami`;
  script.setAttribute("data-website-id", websiteId);
  document.head.appendChild(script);
};

injectAnalyticsScript();

// Component to create tRPC client with Clerk token access
function TrpcProviderWithClerk({ children }: { children: React.ReactNode }) {
  const { getToken } = useClerkAuth();
  
  const trpcClient = React.useMemo(() => {
    return createTrpcClient(() => getToken());
  }, [getToken]);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      {children}
    </trpc.Provider>
  );
}

function TrpcProviderWithoutClerk({ children }: { children: React.ReactNode }) {
  const trpcClient = React.useMemo(() => createTrpcClient(), []);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      {children}
    </trpc.Provider>
  );
}

// Register Service Worker for PWA
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        logger.info("Service Worker registered:", registration.scope);
      })
      .catch((error) => {
        logger.warn("Service Worker registration failed:", error);
      });
  });
}

const root = createRoot(document.getElementById("root")!);

// Render ClerkProvider only when a valid publishable key is present
// This ensures useUser() hook can always be called without errors
// If key is empty/invalid, Clerk will handle it gracefully
root.render(
  isValidClerkKey ? (
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <ClerkStateProvider>
        <TrpcProviderWithClerk>
          <QueryClientProvider client={queryClient}>
            <App />
          </QueryClientProvider>
        </TrpcProviderWithClerk>
      </ClerkStateProvider>
    </ClerkProvider>
  ) : (
    <ClerkStateFallbackProvider>
      <TrpcProviderWithoutClerk>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </TrpcProviderWithoutClerk>
    </ClerkStateFallbackProvider>
  )
);
