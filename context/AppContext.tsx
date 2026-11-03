"use client";
// src/context/AppContext.tsx

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { dummyUsers, User } from "@/data/dummy";

interface ActionResult {
  success: boolean;
  message?: string;
}

interface AppContextType {
  currentUser: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => ActionResult;
  register: (data: Pick<User, "name" | "email" | "password">) => ActionResult;
  logout: () => void;
  updateProfile: (data: Partial<User>) => ActionResult;
  setAuthenticatedUser: (user: User | null) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(dummyUsers);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  // AUTH
  const login = (email: string, password: string): ActionResult => {
    const user = users.find(
      (u) => u.email === email && u.password === password && u.is_active
    );
    if (user) {
      setCurrentUser(user);
      return { success: true };
    }
    return { success: false, message: "Email atau password salah." };
  };

  const register = (data: Pick<User, "name" | "email" | "password">): ActionResult => {
    if (users.find((u) => u.email === data.email)) {
      return { success: false, message: "Email sudah terdaftar." };
    }
    const newUser: User = {
      id: users.length + 1,
      ...data,
      is_active: true,
      register_date: new Date().toISOString().split("T")[0],
    };
    setUsers((prev) => [...prev, newUser]);
    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const updateProfile = (data: Partial<User>): ActionResult => {
    if (!currentUser) return { success: false, message: "Tidak ada pengguna aktif." };
    setUsers((prev) =>
      prev.map((u) => (u.id === currentUser.id ? { ...u, ...data } : u))
    );
    const updated = { ...currentUser, ...data };
    setCurrentUser(updated);
    return { success: true };
  };

  const setAuthenticatedUser = (user: User | null) => {
    setCurrentUser(user);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        setAuthenticatedUser,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}