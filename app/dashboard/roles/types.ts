export interface Role {
  id: number;
  nama_role: string;
  deskripsi: string;
}

export interface RoleForm {
  nama_role: string;
  deskripsi: string;
}

export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

export const EMPTY_ROLE_FORM: RoleForm = {
  nama_role: "",
  deskripsi: "",
};