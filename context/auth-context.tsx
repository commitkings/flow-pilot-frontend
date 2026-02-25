"use client";

import React, { createContext, useContext, useState } from "react";
import { useRouter } from "next/navigation";
import { clearCurrentUserEmail } from "@/lib/auth-storage";

interface AuthContextType {
  isAuthenticated: boolean;
  isReady: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("flowpilot_auth") === "true";
  });
  const isReady = true;
  const router = useRouter();

  const login = () => {
    localStorage.setItem("flowpilot_auth", "true");
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem("flowpilot_auth");
    clearCurrentUserEmail();
    setIsAuthenticated(false);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isReady, login, logout }}>
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
