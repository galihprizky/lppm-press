// src/data/dummy.ts

export interface User {
  id: number;
  email: string;
  name: string;
  password: string;
  is_active: boolean;
  register_date: string;
}

export const dummyUsers: User[] = [
  {
    id: 1,
    email: "admin@kampus.ac.id",
    name: "Administrator",
    password: "admin123",
    is_active: true,
    register_date: "2024-01-01",
  },
  {
    id: 2,
    email: "user@kampus.ac.id",
    name: "User Biasa",
    password: "user123",
    is_active: true,
    register_date: "2024-03-15",
  },
];