"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

// Base API URL (without /auth) - auth routes will append /auth
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";
const AUTH_URL = API_BASE.endsWith('/auth') ? API_BASE : `${API_BASE}/auth`;

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user from token on mount
  useEffect(() => {
    const token = localStorage.getItem("klyx_access_token");
    if (token) {
      // Verify token and get user info
      fetchCurrentUser(token);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchCurrentUser = async (token: string) => {
    try {
      const response = await fetch(`${AUTH_URL}/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.data.user);
      } else {
        // Token invalid, clear it
        localStorage.removeItem("klyx_access_token");
        localStorage.removeItem("klyx_refresh_token");
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      localStorage.removeItem("klyx_access_token");
      localStorage.removeItem("klyx_refresh_token");
    } finally {
      setLoading(false);
    }
  };

  const signup = async (
    email: string,
    password: string,
    name: string,
  ): Promise<boolean> => {
    try {
      const response = await fetch(`${AUTH_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();

      if (response.ok && data.status === "success") {
        // Store tokens
        localStorage.setItem("klyx_access_token", data.data.access_token);
        localStorage.setItem("klyx_refresh_token", data.data.refresh_token);
        setUser(data.data.user);
        return true;
      }

      return false;
    } catch (error) {
      console.error("Signup error:", error);
      return false;
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${AUTH_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.status === "success") {
        // Store tokens
        localStorage.setItem("klyx_access_token", data.data.access_token);
        localStorage.setItem("klyx_refresh_token", data.data.refresh_token);
        setUser(data.data.user);
        return true;
      }

      return false;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem("klyx_access_token");
      if (token) {
        await fetch(`${AUTH_URL}/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear local state and tokens
      setUser(null);
      localStorage.removeItem("klyx_access_token");
      localStorage.removeItem("klyx_refresh_token");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        signup,
        logout,
        isAuthenticated: !!user,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
