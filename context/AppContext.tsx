"use client";
// src/context/AppContext.tsx

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { dummyUsers, dummyMahasiswa, User, Mahasiswa } from "@/data/dummy";

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
  mahasiswa: Mahasiswa[];
  getMahasiswaById: (id: string | number) => Mahasiswa | undefined;
  addMahasiswa: (data: Omit<Mahasiswa, "id" | "created_at" | "updated_at">) => ActionResult;
  updateMahasiswa: (id: string | number, data: Omit<Mahasiswa, "id" | "created_at" | "updated_at">) => ActionResult;
  deleteMahasiswa: (id: string | number) => ActionResult;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(dummyUsers);
  const [mahasiswa, setMahasiswa] = useState<Mahasiswa[]>(dummyMahasiswa);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("currentUser");
      const savedMahasiswa = localStorage.getItem("mahasiswa");
      const savedUsers = localStorage.getItem("users"); 

      if (savedUser) {
        setTimeout(() => {
          setCurrentUser(JSON.parse(savedUser));
        }, 0);
      }
      if (savedMahasiswa) setMahasiswa(JSON.parse(savedMahasiswa));
      if (savedUsers) setUsers(JSON.parse(savedUsers));
    } catch {
      // ignore parse errors
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading) localStorage.setItem("mahasiswa", JSON.stringify(mahasiswa));
  }, [mahasiswa, isLoading]);

  useEffect(() => {
    if (!isLoading) localStorage.setItem("users", JSON.stringify(users));
  }, [users, isLoading]);

  // AUTH
  const login = (email: string, password: string): ActionResult => {
    const user = users.find(
      (u) => u.email === email && u.password === password && u.is_active
    );
    if (user) {
      setCurrentUser(user);
      localStorage.setItem("currentUser", JSON.stringify(user));
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
    localStorage.removeItem("currentUser");
  };

  const updateProfile = (data: Partial<User>): ActionResult => {
    if (!currentUser) return { success: false, message: "Tidak ada pengguna aktif." };
    setUsers((prev) =>
      prev.map((u) => (u.id === currentUser.id ? { ...u, ...data } : u))
    );
    const updated = { ...currentUser, ...data };
    setCurrentUser(updated);
    localStorage.setItem("currentUser", JSON.stringify(updated));
    return { success: true };
  };

  const setAuthenticatedUser = (user: User | null) => {
    setCurrentUser(user);
    if (user) {
      localStorage.setItem("currentUser", JSON.stringify(user));
    } else {
      localStorage.removeItem("currentUser");
    }
  };

  // MAHASISWA CRUD
  const getMahasiswaById = (id: string | number): Mahasiswa | undefined =>
    mahasiswa.find((m) => m.id === Number(id));

  const addMahasiswa = (
    data: Omit<Mahasiswa, "id" | "created_at" | "updated_at">
  ): ActionResult => {
    if (mahasiswa.find((m) => m.nim === data.nim)) {
      return { success: false, message: "NIM sudah terdaftar." };
    }
    if (mahasiswa.find((m) => m.email === data.email)) {
      return { success: false, message: "Email mahasiswa sudah terdaftar." };
    }
    const now = new Date().toISOString();
    const newMhs: Mahasiswa = {
      id: Math.max(0, ...mahasiswa.map((m) => m.id)) + 1,
      ...data,
      created_at: now,
      updated_at: now,
    };
    setMahasiswa((prev) => [...prev, newMhs]);
    return { success: true };
  };

  const updateMahasiswa = (
    id: string | number,
    data: Omit<Mahasiswa, "id" | "created_at" | "updated_at">
  ): ActionResult => {
    const existing = mahasiswa.find((m) => m.id === Number(id));
    if (!existing) return { success: false, message: "Mahasiswa tidak ditemukan." };

    if (mahasiswa.find((m) => m.nim === data.nim && m.id !== Number(id))) {
      return { success: false, message: "NIM sudah digunakan mahasiswa lain." };
    }
    if (mahasiswa.find((m) => m.email === data.email && m.id !== Number(id))) {
      return { success: false, message: "Email sudah digunakan mahasiswa lain." };
    }

    setMahasiswa((prev) =>
      prev.map((m) =>
        m.id === Number(id)
          ? { ...m, ...data, updated_at: new Date().toISOString() }
          : m
      )
    );
    return { success: true };
  };

  const deleteMahasiswa = (id: string | number): ActionResult => {
    setMahasiswa((prev) => prev.filter((m) => m.id !== Number(id)));
    return { success: true };
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
        mahasiswa,
        getMahasiswaById,
        addMahasiswa,
        updateMahasiswa,
        deleteMahasiswa,
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