export type ProjectStatus =
  | 'PREPARATION'
  | 'GROS_OEUVRE'
  | 'SECOND_OEUVRE'
  | 'FINITIONS'
  | 'RECEPTION_CHANTIER'
  | 'TERMINE'
  | 'APRES_VENTE';

export interface ProjectTask {
  id: string;
  project_id: string;
  title: string;
  trade_type: string;
  assigned_to?: string;
  assigned_name?: string;
  start_date: string;
  due_date: string;
  status: 'A_FAIRE' | 'EN_COURS' | 'BLOQUE' | 'TERMINE';
  progress_percent: number;
}

export interface Project {
  id: string;
  company_id: string;
  code: string;
  title: string;
  client_id: string;
  client_name: string;
  quote_id?: string;
  wilaya: string;
  address: string;
  manager_id?: string;
  manager_name?: string;
  start_date: string;
  end_date_estimated: string;
  status: ProjectStatus;
  progress_percent: number;
  budget_total: number;
  amount_invoiced: number;
  amount_paid: number;
  remaining_due: number;
  notes?: string;
  created_at: string;
  tasks?: ProjectTask[];
}
