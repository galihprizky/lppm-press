export interface Fakultas {
  id: number;
  kode_fakultas: string;
  nama_fakultas: string;
}

export interface Jurusan {
  id: number;
  fakultas_id: number;
  kode_fakultas: string;
  nama_fakultas: string;
  kode_jurusan: string;
  nama_jurusan: string;
}

export interface UserRole {
  id: number;
  nama_role: string;
  deskripsi: string;
}

export interface User {
  id: number;
  nip: string;
  email: string;
  nama: string;
  no_hp: string;
  jurusan_id: number;
  is_active: boolean;
  created_at?: unknown;
  updated_at?: unknown;
  roles: UserRole[];
  jurusan?: Jurusan | null;
}

export interface UserForm {
  nip: string;
  nama: string;
  email: string;
  no_hp: string;
  fakultas_id: string;
  jurusan_id: string;
  role_ids: number[];
  password: string;
  is_active: boolean;
}

export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

export const EMPTY_USER_FORM: UserForm = {
  nip: "",
  nama: "",
  email: "",
  no_hp: "",
  fakultas_id: "",
  jurusan_id: "",
  role_ids: [],
  password: "",
  is_active: true,
};