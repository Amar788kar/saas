import { Company } from './company.model';
import { User } from './user.model';

export interface LoginDTO {
  email: string;
  password: string;
}

export interface RegisterDTO {
  company_name: string;
  trade_name?: string;
  legal_form: string;
  wilaya: string;
  company_phone: string;
  company_email: string;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  expires_at: string;
  user: User;
  company: Company;
}

export interface APIResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
    has_next_page: boolean;
  };
}
