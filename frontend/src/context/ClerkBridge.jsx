import { useEffect, useRef } from "react";
import { useUser, useAuth as useClerkAuth, useClerk } from "@clerk/clerk-react";

/**
 * ClerkBridge Component
 * Safely bridges Clerk user session and actions into the unified AuthContext
 * Only mounted when VITE_CLERK_PUBLISHABLE_KEY is configured
 */
export const ClerkBridge = ({ onClerkStateChange, registerClerkActions }) => {
  const { isLoaded, isSignedIn, user: clerkUser } = useUser();
  const { getToken, signOut } = useClerkAuth();
  const clerk = useClerk();

  // Register Clerk UI triggers (Sign In, Sign Up, User Profile, Sign Out)
  useEffect(() => {
    if (typeof registerClerkActions === "function") {
      registerClerkActions({
        openSignIn: (opts = {}) => clerk.openSignIn(opts),
        openSignUp: (opts = {}) => clerk.openSignUp(opts),
        openUserProfile: (opts = {}) => clerk.openUserProfile(opts),
        signOut: () => signOut(),
        isClerkActive: true,
      });
    }
  }, [clerk, signOut, registerClerkActions]);

  // Keep the latest callback in a ref so a new function identity never re-triggers the sync.
  const onChangeRef = useRef(onClerkStateChange);
  onChangeRef.current = onClerkStateChange;

  // Synchronize Clerk user identity & JWT session token with AuthContext.
  // Keyed on the user id and profile timestamp (not the user object) so it runs once per
  // real change: sign-in, sign-out, profile edit.
  const clerkUserId = clerkUser?.id;
  const clerkUserUpdatedAt = clerkUser?.updatedAt?.getTime?.() ?? null;

  useEffect(() => {
    if (!isLoaded) return undefined;
    let cancelled = false;
    const onClerkStateChange = (state) => {
      if (!cancelled) onChangeRef.current?.(state);
    };

    if (isSignedIn && clerkUser) {
      getToken()
        .then((token) => {
          const primaryEmail =
            clerkUser.primaryEmailAddress?.emailAddress ||
            clerkUser.emailAddresses?.[0]?.emailAddress ||
            "";

          const normalizedUser = {
            id: clerkUser.id,
            name:
              `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
              clerkUser.username ||
              (primaryEmail ? primaryEmail.split("@")[0] : "Customer"),
            email: primaryEmail,
            avatar: clerkUser.imageUrl || null,
            role: clerkUser.publicMetadata?.role === "admin" ? "admin" : "customer",
            isClerk: true,
          };

          onClerkStateChange({
            user: normalizedUser,
            token: token || null,
            isSignedIn: true,
          });
        })
        .catch((err) => {
          console.warn("[ClerkBridge] Could not retrieve session token:", err);
        });
    } else {
      onClerkStateChange({
        user: null,
        token: null,
        isSignedIn: false,
      });
    }
    // Ignore a token that resolves after the session already changed (e.g. sign-out mid-request).
    return () => {
      cancelled = true;
    };
    // clerkUser is read inside but intentionally keyed by id/updatedAt to avoid re-running on new object identities.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn, clerkUserId, clerkUserUpdatedAt, getToken]);

  return null;
};

export default ClerkBridge;
