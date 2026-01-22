import React from "react";
import { ClerkProvider, useAuth as useClerkAuth } from "@clerk/clerk-react";
import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { getLoginUrl, getClerkPublishableKey } from "./const";
import "./index.css";

const queryClient = new QueryClient();

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  window.location.href = getLoginUrl();
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
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
              console.warn("[tRPC] Failed to get Clerk token:", error);
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

// Register Service Worker for PWA
if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("Service Worker registered:", registration.scope);
      })
      .catch((error) => {
        console.log("Service Worker registration failed:", error);
      });
  });
}

const root = createRoot(document.getElementById("root")!);

// Always render ClerkProvider to avoid hook errors
// This ensures useUser() hook can always be called without errors
// If key is empty/invalid, Clerk will handle it gracefully
root.render(
  <ClerkProvider publishableKey={clerkPublishableKey || "pk_test_placeholder"}>
    <TrpcProviderWithClerk>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </TrpcProviderWithClerk>
  </ClerkProvider>
);
