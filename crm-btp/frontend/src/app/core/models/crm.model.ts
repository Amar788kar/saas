export type LeadStatus =
  | 'NOUVEAU'
  | 'CONTACTE'
  | 'QUALIFICATION'
  | 'VISITE'
  | 'DEVIS'
  | 'NEGOCIATION'
  | 'GAGNE'
  | 'PERDU';

export type ClientType = 'INDIVIDUAL' | 'COMPANY';

export interface Client {
  id: string;
  company_id: string;
  type: ClientType;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  wilaya: string;
  commune?: string;
  notes?: string;
  source?: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  updated_at?: string;
}

export interface Contact {
  id: string;
  company_id: string;
  client_id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  email?: string;
  role?: string;
  is_primary: boolean;
}

export interface Lead {
  id: string;
  company_id: string;
  client_id?: string;
  client_name?: string;
  title: string;
  trade_type?: string; // Plomberie, Peinture, Gros Œuvre, Climatisation, etc.
  status: LeadStatus;
  estimated_value: number;
  expected_close_date?: string;
  assigned_to?: string;
  assigned_name?: string;
  wilaya?: string;
  address?: string;
  created_at: string;
  updated_at?: string;
}

export type VisitStatus = 'PLANIFIEE' | 'CONFIRMEE' | 'TERMINEE' | 'ANNULEE';

export interface Visit {
  id: string;
  company_id: string;
  client_id?: string;
  client_name?: string;
  lead_id?: string;
  lead_title?: string;
  scheduled_at: string;
  address: string;
  wilaya?: string;
  description: string;
  notes?: string;
  status: VisitStatus;
  assigned_to?: string;
  assigned_name?: string;
  metrage_details?: string;
  created_at: string;
}

export interface TimelineEvent {
  id: string;
  company_id: string;
  client_id?: string;
  lead_id?: string;
  event_type: 'CALL' | 'EMAIL' | 'VISIT' | 'NOTE' | 'STATUS_CHANGE' | 'PAYMENT' | 'QUOTE';
  description: string;
  created_by?: string;
  created_name?: string;
  created_at: string;
}
