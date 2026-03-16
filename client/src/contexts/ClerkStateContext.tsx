import { createContext, useCallback, useContext } from "react";
import { useUser, useClerk } from "@clerk/clerk-react";

type ClerkUser = ReturnType<typeof useUser>["user"];

type ClerkState = {
  isEnabled: boolean;
  isSignedIn: boolean;
  user: ClerkUser | null;
  signOut: (() => Promise<void>) | null;
};

const ClerkStateContext = createContext<ClerkState>({
  isEnabled: false,
  isSignedIn: false,
  user: null,
  signOut: null,
});

export function ClerkStateProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isSignedIn } = useUser();
  const clerk = useClerk();

  const signOut = useCallback(async () => {
    await clerk.signOut();
  }, [clerk]);

  return (
    <ClerkStateContext.Provider
      value={{
        isEnabled: true,
        isSignedIn: Boolean(isSignedIn),
        user: user ?? null,
        signOut,
      }}
    >
      {children}
    </ClerkStateContext.Provider>
  );
}

export function ClerkStateFallbackProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkStateContext.Provider
      value={{
        isEnabled: false,
        isSignedIn: false,
        user: null,
        signOut: null,
      }}
    >
      {children}
    </ClerkStateContext.Provider>
  );
}

export function useClerkState() {
  return useContext(ClerkStateContext);
}
