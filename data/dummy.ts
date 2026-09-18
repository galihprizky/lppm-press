// src/data/dummy.ts

export interface User {
  id: number;
  email: string;
  name: string;
  password: string;
  is_active: boolean;
  register_date: string;
}

export interface Mahasiswa {
  id: number;
  nim: string;
  nama: string;
  email: string;
  jurusan: string;
  tanggal_lahir: string;
  created_at: string;
  updated_at: string;
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

export const dummyMahasiswa: Mahasiswa[] = [
  {
    id: 1,
    nim: "2021001",
    nama: "Andi Pratama",
    email: "andi.pratama@mhs.ac.id",
    jurusan: "Informatika",
    tanggal_lahir: "2003-04-12",
    created_at: "2024-01-10T08:00:00Z",
    updated_at: "2024-01-10T08:00:00Z",
  },
  {
    id: 2,
    nim: "2021002",
    nama: "Budi Santoso",
    email: "budi.santoso@mhs.ac.id",
    jurusan: "Sistem Informasi",
    tanggal_lahir: "2002-09-25",
    created_at: "2024-01-11T09:00:00Z",
    updated_at: "2024-01-11T09:00:00Z",
  },
  {
    id: 3,
    nim: "2021003",
    nama: "Citra Dewi",
    email: "citra.dewi@mhs.ac.id",
    jurusan: "Teknik Elektro",
    tanggal_lahir: "2003-01-30",
    created_at: "2024-01-12T10:00:00Z",
    updated_at: "2024-01-12T10:00:00Z",
  },
  {
    id: 4,
    nim: "2021004",
    nama: "Dian Permata",
    email: "dian.permata@mhs.ac.id",
    jurusan: "Manajemen",
    tanggal_lahir: "2002-07-14",
    created_at: "2024-01-13T11:00:00Z",
    updated_at: "2024-01-13T11:00:00Z",
  },
  {
    id: 5,
    nim: "2021005",
    nama: "Eko Wahyudi",
    email: "eko.wahyudi@mhs.ac.id",
    jurusan: "Informatika",
    tanggal_lahir: "2003-11-05",
    created_at: "2024-01-14T12:00:00Z",
    updated_at: "2024-01-14T12:00:00Z",
  },
  {
    id: 6,
    nim: "2021006",
    nama: "Farah Aulia",
    email: "farah.aulia@mhs.ac.id",
    jurusan: "Sistem Informasi",
    tanggal_lahir: "2002-03-22",
    created_at: "2024-01-15T08:30:00Z",
    updated_at: "2024-01-15T08:30:00Z",
  },
  {
    id: 7,
    nim: "2021007",
    nama: "Gilang Ramadan",
    email: "gilang.ramadan@mhs.ac.id",
    jurusan: "Teknik Elektro",
    tanggal_lahir: "2003-08-17",
    created_at: "2024-01-16T09:30:00Z",
    updated_at: "2024-01-16T09:30:00Z",
  },
  {
    id: 8,
    nim: "2021008",
    nama: "Hana Safitri",
    email: "hana.safitri@mhs.ac.id",
    jurusan: "Manajemen",
    tanggal_lahir: "2002-12-01",
    created_at: "2024-01-17T10:30:00Z",
    updated_at: "2024-01-17T10:30:00Z",
  },
  {
    id: 9,
    nim: "2021009",
    nama: "Irfan Maulana",
    email: "irfan.maulana@mhs.ac.id",
    jurusan: "Informatika",
    tanggal_lahir: "2003-06-28",
    created_at: "2024-01-18T11:30:00Z",
    updated_at: "2024-01-18T11:30:00Z",
  },
  {
    id: 10,
    nim: "2021010",
    nama: "Julia Rahayu",
    email: "julia.rahayu@mhs.ac.id",
    jurusan: "Sistem Informasi",
    tanggal_lahir: "2002-05-19",
    created_at: "2024-01-19T12:30:00Z",
    updated_at: "2024-01-19T12:30:00Z",
  },
  {
    id: 11,
    nim: "2021011",
    nama: "Kevin Hartanto",
    email: "kevin.hartanto@mhs.ac.id",
    jurusan: "Teknik Elektro",
    tanggal_lahir: "2003-02-10",
    created_at: "2024-01-20T08:00:00Z",
    updated_at: "2024-01-20T08:00:00Z",
  },
  {
    id: 12,
    nim: "2021012",
    nama: "Lia Kusuma",
    email: "lia.kusuma@mhs.ac.id",
    jurusan: "Manajemen",
    tanggal_lahir: "2002-10-07",
    created_at: "2024-01-21T09:00:00Z",
    updated_at: "2024-01-21T09:00:00Z",
  },
];

export const JURUSAN_OPTIONS = [
  "Informatika",
  "Sistem Informasi",
  "Teknik Elektro",
  "Manajemen",
] as const;

export type JurusanType = (typeof JURUSAN_OPTIONS)[number];