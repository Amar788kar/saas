export type QuoteStatus = 'BROUILLON' | 'ENVOYE' | 'NEGOCIATION' | 'ACCEPTE' | 'REFUSE';

export interface QuoteItem {
  id?: string;
  designation: string;
  unit: 'm²' | 'ml' | 'm³' | 'kg' | 'u' | 'forfait' | 'j';
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Quote {
  id: string;
  quote_number: string;
  company_id: string;
  client_id: string;
  client_name: string;
  client_phone?: string;
  lead_id?: string;
  project_title: string;
  status: QuoteStatus;
  items: QuoteItem[];
  subtotal: number;
  discount_percentage?: number;
  discount_amount?: number;
  tva_rate?: number; // 0% ou 19%
  tva_amount?: number;
  timbre_fiscal?: number;
  total_ttc: number;
  validity_days: number;
  payment_terms: string;
  wilaya: string;
  notes?: string;
  created_at: string;
  accepted_at?: string;
}
