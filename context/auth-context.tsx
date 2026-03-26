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
import { toast } from "sonner";
import type { User } from "@/lib/api-types";
import { getToken, setToken, clearToken } from "@/lib/token-storage";
import { fetchMe, logout as apiLogout, googleLoginUrl, login as apiLogin, register as apiRegister } from "@/lib/api-client";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** Re-fetch authenticated user from /auth/me */
  refreshUser: () => Promise<User | null>;
  /** Store token and hydrate user from /auth/me */
  loginWithToken: (token: string) => Promise<void>;
  /** Sign in with email + password */
  loginWithCredentials: (email: string, password: string) => Promise<void>;
  /** Register new account, store token, hydrate user */
  registerUser: (name: string, email: string, password: string) => Promise<void>;
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

  const refreshUser = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      return null;
    }
    try {
      const me = await fetchMe();
      setUser(me);
      return me;
    } catch {
      clearToken();
      setUser(null);
      return null;
    }
  }, []);

  const loginWithCredentials = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { token } = await apiLogin(email, password);
      setToken(token);
      const me = await fetchMe();
      setUser(me);
    } catch (err) {
      clearToken();
      const message = err instanceof Error ? err.message : "Invalid email or password";
      toast.error(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const registerUser = useCallback(async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const { token } = await apiRegister(name, email, password);
      setToken(token);
      const me = await fetchMe();
      setUser(me);
    } catch (err) {
      clearToken();
      const message = err instanceof Error ? err.message : "Registration failed. Please try again.";
      toast.error(message);
      throw err;
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
      refreshUser,
      loginWithToken,
      loginWithCredentials,
      registerUser,
      loginWithGoogle,
      logout,
    }),
    [user, isLoading, refreshUser, loginWithToken, loginWithCredentials, registerUser, loginWithGoogle, logout],
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
