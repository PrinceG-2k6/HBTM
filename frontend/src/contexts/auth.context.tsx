import React, { createContext, useContext, useState, useEffect } from "react";
import { authApi } from "../api/axiosClient";

export interface UserOnboarding {
  currentSelf: string[];
  imagineSelf: string[];
  learningStyles: string[];
  aspirationFocus: string[];
  mediaPreferences: string[];
  dailyCommitmentMinutes: number;
  isOnboarded: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  avatarUrl?: string;
  authProvider: "jwt" | "google";
  onboarding?: UserOnboarding;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loginWithJWT: (email: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  signupWithJWT: (name: string, email: string, pass: string, role?: string, onboarding?: any) => Promise<{ success: boolean; message?: string }>;
  loginWithGoogle: (credentialResponse?: any) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  updateUserOnboarding: (onboardingData: UserOnboarding) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  loginWithJWT: async () => ({ success: false }),
  signupWithJWT: async () => ({ success: false }),
  loginWithGoogle: async () => ({ success: false }),
  logout: () => {},
  updateUserOnboarding: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem("hbtm_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("hbtm_token") || null;
  });

  useEffect(() => {
    if (user && token) {
      localStorage.setItem("hbtm_user", JSON.stringify(user));
      localStorage.setItem("hbtm_token", token);
    } else {
      localStorage.removeItem("hbtm_user");
      localStorage.removeItem("hbtm_token");
    }
  }, [user, token]);

  const loginWithJWT = async (email: string, pass: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await authApi.login({ email, password: pass });
      if (res.token && res.user) {
        const formattedUser: User = {
          id: res.user.id || res.user._id,
          name: res.user.name,
          email: res.user.email,
          role: res.user.role,
          avatarUrl: res.user.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80",
          authProvider: "jwt",
          onboarding: res.user.onboarding,
        };
        setUser(formattedUser);
        setToken(res.token);
        return { success: true };
      }
      return { success: false, message: res.message || "Invalid credentials" };
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || "Login failed" };
    }
  };

  const signupWithJWT = async (name: string, email: string, pass: string, role?: string, onboarding?: any): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await authApi.register({ name, email, password: pass, role, onboarding });
      if (res.token && res.user) {
        const formattedUser: User = {
          id: res.user.id || res.user._id,
          name: res.user.name,
          email: res.user.email,
          role: res.user.role,
          avatarUrl: res.user.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80",
          authProvider: "jwt",
          onboarding: res.user.onboarding,
        };
        setUser(formattedUser);
        setToken(res.token);
        return { success: true };
      }
      return { success: false, message: res.message || "Registration failed" };
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || "Registration failed" };
    }
  };

  const loginWithGoogle = async (credentialResponse?: any): Promise<{ success: boolean; message?: string }> => {
    try {
      const googleToken = credentialResponse?.credential || `google_token_${Date.now()}`;
      const res = await authApi.googleAuth({
        googleToken,
        name: credentialResponse?.name || "Google User",
        email: credentialResponse?.email || `google_${Date.now()}@gmail.com`,
        avatarUrl: credentialResponse?.picture,
        onboarding: credentialResponse?.onboarding,
      });

      if (res.token && res.user) {
        const formattedUser: User = {
          id: res.user.id || res.user._id,
          name: res.user.name,
          email: res.user.email,
          role: res.user.role,
          avatarUrl: res.user.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80",
          authProvider: "google",
          onboarding: res.user.onboarding,
        };
        setUser(formattedUser);
        setToken(res.token);
        return { success: true };
      }
      return { success: false, message: res.message || "Google Auth failed" };
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || "Google Auth failed" };
    }
  };

  const updateUserOnboarding = (onboardingData: UserOnboarding) => {
    if (user) {
      const updatedUser = { ...user, onboarding: onboardingData };
      setUser(updatedUser);
      localStorage.setItem("hbtm_user", JSON.stringify(updatedUser));
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("hbtm_user");
    localStorage.removeItem("hbtm_token");
    localStorage.removeItem("pacer_user");
    localStorage.removeItem("pacer_token");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        loginWithJWT,
        signupWithJWT,
        loginWithGoogle,
        logout,
        updateUserOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
