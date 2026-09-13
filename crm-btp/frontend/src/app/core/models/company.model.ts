export interface Company {
  id: string;
  name: string;
  trade_name?: string;
  legal_form: string;
  nif?: string;
  nis?: string;
  rc?: string;
  article_taxe?: string;
  phone: string;
  email: string;
  address?: string;
  wilaya: string;
  commune?: string;
  currency: string;
  plan: 'STARTER' | 'BUSINESS' | 'PRO';
  status: 'ACTIVE' | 'SUSPENDED' | 'TRIAL';
  settings?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface UpdateCompanyDTO {
  name: string;
  trade_name?: string;
  legal_form: string;
  nif?: string;
  nis?: string;
  rc?: string;
  article_taxe?: string;
  phone: string;
  email: string;
  address?: string;
  wilaya: string;
  commune?: string;
}
