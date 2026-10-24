import { createContext, useContext, useState, useEffect } from "react";
import ClerkBridge from "./ClerkBridge.jsx";
import { DEMO_LOGIN_ENABLED } from "../utils/env";

const AuthContext = createContext(null);

const STORAGE_KEY_USER = "shop_auth_user";
const STORAGE_KEY_TOKEN = "shop_auth_token";

export const AuthProvider = ({ children, clerkEnabled = false }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USER);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem(STORAGE_KEY_TOKEN) || null;
  });

  const [clerkActions, setClerkActions] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState("user"); // 'user' | 'admin' | 'register'
  const [loading, setLoading] = useState(false);

  // Synchronize state with localStorage (for non-Clerk or cached sessions)
  useEffect(() => {
    if (user && token) {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
      localStorage.setItem(STORAGE_KEY_TOKEN, token);
    } else {
      localStorage.removeItem(STORAGE_KEY_USER);
      localStorage.removeItem(STORAGE_KEY_TOKEN);
    }
  }, [user, token]);

  // Session verification on app initialization for local/seed tokens:
  // Validates the stored token against GET /api/auth/me to ensure:
  // 1. Expired/invalid tokens are automatically cleared from localStorage.
  // 2. Client-side user profile and roles match authoritative server data.
  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      const savedToken = localStorage.getItem(STORAGE_KEY_TOKEN);
      if (!savedToken) return;

      try {
        const res = await fetch("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${savedToken}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.success && data.user) {
            setUser(data.user);
          }
        } else if (res.status === 401 || res.status === 403) {
          if (isMounted) {
            setUser(null);
            setToken(null);
            localStorage.removeItem(STORAGE_KEY_USER);
            localStorage.removeItem(STORAGE_KEY_TOKEN);
          }
        }
      } catch (err) {
        console.warn("Could not verify session with server (offline mode)");
      }
    };

    verifySession();

    return () => {
      isMounted = false;
    };
  }, []);

  // Bridge Clerk state changes into unified Auth state
  const handleClerkStateChange = ({ user: cUser, token: cToken, isSignedIn }) => {
    if (isSignedIn && cUser) {
      setUser(cUser);
      setToken(cToken);
    } else if (!isSignedIn && user?.isClerk) {
      setUser(null);
      setToken(null);
    }
  };

  const openAuthModal = (tab = "user") => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  // Login handler for local seed/admin credentials
  const login = async (email, password, roleHint = null) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, roleHint }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to log in.");
      }

      setUser(data.user);
      setToken(data.token);
      setIsAuthModalOpen(false);
      return { success: true, user: data.user, token: data.token };
    } catch (err) {
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Register handler (strictly registers as standard customer)
  const register = async (name, email, password) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to register account.");
      }

      setUser(data.user);
      setToken(data.token);
      setIsAuthModalOpen(false);
      return { success: true, user: data.user, token: data.token };
    } catch (err) {
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  // One-click demo login (dev mode)
  const quickLogin = async (role = "user") => {
    if (!DEMO_LOGIN_ENABLED) {
      return { success: false, message: "Demo sign-in is only available in local development." };
    }
    if (role === "admin") {
      try {
        return await login("admin@giftingwellness.com", "admin123", "admin");
      } catch {
        return await login("admin@shop.co", "admin123", "admin");
      }
    } else {
      try {
        return await login("user@giftingwellness.com", "user123", "user");
      } catch {
        return await login("user@shop.co", "user123", "user");
      }
    }
  };

  // Logout handler (gracefully signs out from Clerk or local storage)
  const logout = () => {
    if (user?.isClerk && clerkActions?.signOut) {
      clerkActions.signOut().catch((e) => console.warn("Clerk sign-out notice:", e));
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem(STORAGE_KEY_USER);
    localStorage.removeItem(STORAGE_KEY_TOKEN);
  };

  const openClerkSignIn = (opts = {}) => {
    if (clerkActions?.openSignIn) {
      setIsAuthModalOpen(false);
      clerkActions.openSignIn(opts);
    } else {
      openAuthModal("user");
    }
  };

  const openClerkSignUp = (opts = {}) => {
    if (clerkActions?.openSignUp) {
      setIsAuthModalOpen(false);
      clerkActions.openSignUp(opts);
    } else {
      openAuthModal("register");
    }
  };

  const openUserProfile = () => {
    if (clerkActions?.openUserProfile) {
      clerkActions.openUserProfile();
    }
  };

  const value = {
    user,
    token,
    isAdmin: user?.role === "admin",
    isLoggedIn: !!user,
    isClerkUser: Boolean(user?.isClerk),
    isClerkEnabled: Boolean(clerkEnabled),
    loading,
    isAuthModalOpen,
    authModalTab,
    setAuthModalTab,
    openAuthModal,
    closeAuthModal,
    login,
    register,
    quickLogin,
    logout,
    openClerkSignIn,
    openClerkSignUp,
    openUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {clerkEnabled && (
        <ClerkBridge
          onClerkStateChange={handleClerkStateChange}
          registerClerkActions={setClerkActions}
        />
      )}
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
