export type RoleCode = 'ADMIN' | 'MANAGER' | 'COMMERCIAL' | 'EMPLOYEE';

export interface User {
  id: string;
  company_id: string;
  role_id: number;
  role_code: RoleCode;
  role_name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  job_title?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  avatar_url?: string;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateUserDTO {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  job_title?: string;
  role_code: RoleCode;
  password: string;
}

export interface UpdateUserDTO {
  first_name: string;
  last_name: string;
  phone?: string;
  job_title?: string;
  role_code: RoleCode;
  status: 'ACTIVE' | 'INACTIVE';
}
