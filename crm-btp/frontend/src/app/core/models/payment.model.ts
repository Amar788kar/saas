export type PaymentType = 'ACOMPTE' | 'SITUATION_TRAVAUX' | 'SOLDE_RECEPTION' | 'AVANCE_MATERIAUX';
export type PaymentMethod = 'ESPECES' | 'CHEQUE' | 'VIREMENT_CCP' | 'VIREMENT_BANCAIRE' | 'BARIDIMOB';
export type PaymentStatus = 'EN_ATTENTE' | 'VALIDE' | 'REJETE';

export interface Payment {
  id: string;
  payment_number: string;
  company_id: string;
  project_id?: string;
  project_title?: string;
  client_id: string;
  client_name: string;
  quote_id?: string;
  amount: number;
  type: PaymentType;
  method: PaymentMethod;
  status: PaymentStatus;
  payment_date: string;
  reference_piece?: string; // N° Chèque, Référence CCP / BaridiMob
  received_by?: string;
  notes?: string;
  created_at: string;
}
