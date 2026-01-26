import { createContext, useContext } from "react";
import { useUser } from "@clerk/clerk-react";

type ClerkUser = ReturnType<typeof useUser>["user"];

type ClerkState = {
  isEnabled: boolean;
  isSignedIn: boolean;
  user: ClerkUser | null;
};

const ClerkStateContext = createContext<ClerkState>({
  isEnabled: false,
  isSignedIn: false,
  user: null,
});

export function ClerkStateProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isSignedIn } = useUser();

  return (
    <ClerkStateContext.Provider
      value={{
        isEnabled: true,
        isSignedIn: Boolean(isSignedIn),
        user: user ?? null,
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
      }}
    >
      {children}
    </ClerkStateContext.Provider>
  );
}

export function useClerkState() {
  return useContext(ClerkStateContext);
}
