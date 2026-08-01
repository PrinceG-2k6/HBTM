import React, { createContext, useContext, useState, useEffect } from "react";

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl: string;
  authProvider: "jwt" | "google";
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loginWithJWT: (email: string, pass: string) => Promise<boolean>;
  signupWithJWT: (name: string, email: string, pass: string, role: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  logout: () => void;
}

const DEFAULT_USER: User = {
  id: "usr-101",
  name: "Prince",
  email: "prince@pacer.ai",
  role: "AI Systems Founder & Cognitive Engineer",
  avatarUrl: "https://media.istockphoto.com/id/1791833349/photo/student-university-and-portrait-of-black-woman-in-library-for-learning-education-and-reading.jpg?s=612x612&w=0&k=20&c=itaBSNJVOXsvG0POV3cTlyVIi9FbzC9YGdwcNsFf914=",
  authProvider: "jwt",
};

const AuthContext = createContext<AuthContextType>({
  user: DEFAULT_USER,
  token: "mock-jwt-token",
  isAuthenticated: true,
  loginWithJWT: async () => true,
  signupWithJWT: async () => true,
  loginWithGoogle: async () => true,
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("pacer_user");
    return saved ? JSON.parse(saved) : DEFAULT_USER;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("pacer_token") || "mock-jwt-token-xyz987";
  });

  useEffect(() => {
    if (user && token) {
      localStorage.setItem("pacer_user", JSON.stringify(user));
      localStorage.setItem("pacer_token", token);
    } else {
      localStorage.removeItem("pacer_user");
      localStorage.removeItem("pacer_token");
    }
  }, [user, token]);

  const loginWithJWT = async (email: string): Promise<boolean> => {
    // Simulate JWT network call
    await new Promise((res) => setTimeout(res, 600));
    const loggedUser: User = {
      ...DEFAULT_USER,
      email: email || DEFAULT_USER.email,
      name: email.split("@")[0] ? email.split("@")[0].charAt(0).toUpperCase() + email.split("@")[0].slice(1) : "Prince",
      authProvider: "jwt",
    };
    const newToken = `jwt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    setUser(loggedUser);
    setToken(newToken);
    return true;
  };

  const signupWithJWT = async (name: string, email: string, _pass: string, role: string): Promise<boolean> => {
    await new Promise((res) => setTimeout(res, 700));
    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: name || "Learner",
      email: email || "user@pacer.ai",
      role: role || "AI Research Engineer",
      avatarUrl: DEFAULT_USER.avatarUrl,
      authProvider: "jwt",
    };
    const newToken = `jwt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    setUser(newUser);
    setToken(newToken);
    return true;
  };

  const loginWithGoogle = async (): Promise<boolean> => {
    await new Promise((res) => setTimeout(res, 800));
    const googleUser: User = {
      id: `usr-g-${Date.now()}`,
      name: "Prince (Google)",
      email: "prince.google@gmail.com",
      role: "AI Systems Founder & Cognitive Engineer",
      avatarUrl: DEFAULT_USER.avatarUrl,
      authProvider: "google",
    };
    const googleToken = `oauth_google_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    setUser(googleUser);
    setToken(googleToken);
    return true;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
