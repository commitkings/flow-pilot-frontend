"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import type { User } from "@/lib/api-types";
import { getToken, setToken, clearToken } from "@/lib/token-storage";
import { fetchMe, logout as apiLogout, googleLoginUrl } from "@/lib/api-client";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** Store token and hydrate user from /auth/me */
  loginWithToken: (token: string) => Promise<void>;
  /** Redirect browser to backend Google OAuth */
  loginWithGoogle: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Hydrate on mount: if a token exists, fetch /auth/me
  useEffect(() => {
    let cancelled = false;
    const token = getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }
    fetchMe()
      .then((me) => { if (!cancelled) setUser(me); })
      .catch(() => {
        clearToken();
      })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const loginWithToken = useCallback(async (token: string) => {
    setToken(token);
    setIsLoading(true);
    try {
      const me = await fetchMe();
      setUser(me);
    } catch {
      clearToken();
      throw new Error("Failed to fetch user profile after login");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginWithGoogle = useCallback(() => {
    window.location.href = googleLoginUrl();
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // best-effort; clear locally regardless
    }
    clearToken();
    setUser(null);
    router.push("/login");
  }, [router]);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      loginWithToken,
      loginWithGoogle,
      logout,
    }),
    [user, isLoading, loginWithToken, loginWithGoogle, logout],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
