import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoleCode } from '../../core/models/user.model';

export type WorkerStatus = 'SUR_CHANTIER' | 'DISPONIBLE' | 'EN_CONGE';

export interface BtpEmployee {
  id: string;
  fullName: string;
  trade: string; // Spécialité métier BTP
  saasRole: RoleCode; // Rôle SaaS
  phone: string;
  email?: string;
  contractType: 'CDI' | 'JOURNALIER' | 'SOUS_TRAITANT';
  dailyRateDzd: number;
  currentChantier: string;
  assignedTasksCount: number;
  wilaya: string;
  status: WorkerStatus;
  permissions: {
    canCreateQuotes: boolean;
    canValidatePayments: boolean;
    canManageChantiers: boolean;
    canViewFinancials: boolean;
    canManageWorkers: boolean;
  };
}

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="employees-page">
      <!-- HEADER -->
      <div class="page-header">
        <div>
          <h2>Équipes, Artisans & Conduite de Travaux BTP</h2>
          <p class="page-subtitle">Gestion des effectifs, affectation sur chantiers, disponibilités et permissions d'accès</p>
        </div>
        <button class="btn btn-primary" (click)="openAddModal()">
          + Ajouter un Collaborateur / Artisan
        </button>
      </div>

      <!-- WORKERS KPIS -->
      <div class="workers-kpi-grid">
        <div class="kpi-box card">
          <span class="label">Total Effectif BTP</span>
          <span class="val text-primary font-display">{{ workers.length }} collaborateurs</span>
          <span class="sub">Salariés & Sous-traitants</span>
        </div>
        <div class="kpi-box card">
          <span class="label">Actuellement sur Chantier</span>
          <span class="val text-success font-display">{{ getCount('SUR_CHANTIER') }}</span>
          <span class="sub">En intervention active</span>
        </div>
        <div class="kpi-box card">
          <span class="label">Disponibles / En réserve</span>
          <span class="val font-display">{{ getCount('DISPONIBLE') }}</span>
          <span class="sub">Prêts pour nouveaux chantiers</span>
        </div>
        <div class="kpi-box card">
          <span class="label">Masse Salariale Journalière</span>
          <span class="val text-warning font-display">{{ totalDailyWages() | number }} DZD / j</span>
          <span class="sub">Coût direct MO</span>
        </div>
      </div>

      <!-- FILTERS -->
      <div class="filters-card card">
        <div class="search-box">
          <input
            type="text"
            [(ngModel)]="searchQuery"
            placeholder="Rechercher par nom, métier, téléphone ou chantier..."
          />
        </div>

        <div class="filter-group">
          <label>Spécialité :</label>
          <select [(ngModel)]="filterTrade">
            <option value="ALL">Toutes les spécialités</option>
            <option value="Conduite">Conducteurs & Ingénieurs</option>
            <option value="Gros Œuvre">Gros Œuvre / Maçonnerie</option>
            <option value="Électricité">Électricité & Solaire</option>
            <option value="Plomberie">Plomberie & Chauffage</option>
            <option value="Peinture">Peinture & BA13</option>
            <option value="Climatisation">Climatisation HVAC</option>
          </select>
        </div>

        <div class="filter-group">
          <label>Disponibilité :</label>
          <select [(ngModel)]="filterStatus">
            <option value="ALL">Tous les statuts</option>
            <option value="SUR_CHANTIER">Sur chantier</option>
            <option value="DISPONIBLE">Disponible</option>
            <option value="EN_CONGE">En congé</option>
          </select>
        </div>
      </div>

      <!-- WORKERS TABLE -->
      <div class="card table-card">
        <div class="table-responsive">
          <table class="btp-table">
            <thead>
              <tr>
                <th>Collaborateur & Rôle</th>
                <th>Métier BTP</th>
                <th>Téléphone</th>
                <th>Chantier Assigné</th>
                <th>Tâches</th>
                <th>Tarif / jour</th>
                <th>Disponibilité</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let w of filteredWorkers()" class="worker-row" (click)="openPermissionsModal(w)">
                <td>
                  <div class="cell-main">{{ w.fullName }}</div>
                  <div class="cell-sub">
                    <span class="saas-badge" [ngClass]="w.saasRole.toLowerCase()">{{ getRoleLabel(w.saasRole) }}</span>
                    <span class="contract-tag">{{ w.contractType }}</span>
                  </div>
                </td>
                <td><span class="trade-pill">{{ w.trade }}</span></td>
                <td>📞 {{ w.phone }}</td>
                <td>
                  <div class="cell-main font-bold">{{ w.currentChantier }}</div>
                  <div class="cell-sub">{{ w.wilaya }}</div>
                </td>
                <td>
                  <span class="badge badge-manager">{{ w.assignedTasksCount }} tâche{{ w.assignedTasksCount > 1 ? 's' : '' }}</span>
                </td>
                <td>
                  <span class="wage-val">{{ w.dailyRateDzd | number }} DZD</span>
                </td>
                <td>
                  <span class="status-pill" [ngClass]="w.status.toLowerCase()">
                    {{ w.status === 'SUR_CHANTIER' ? '🔨 Sur chantier' : (w.status === 'DISPONIBLE' ? '✓ Disponible' : '🏖️ En congé') }}
                  </span>
                </td>
                <td (click)="$event.stopPropagation()">
                  <div class="action-buttons">
                    <button class="btn btn-outline btn-xs" (click)="openPermissionsModal(w)" title="Voir permissions">
                      Permissions
                    </button>
                    <a [href]="'tel:' + w.phone" class="btn btn-outline btn-xs" title="Appeler">📞</a>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- MODAL PERMISSIONS ET DETAILS EMPLOYE -->
      <div *ngIf="selectedWorker()" class="modal-backdrop" (click)="closePermissionsModal()">
        <div class="modal-box card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <h3>{{ selectedWorker()?.fullName }}</h3>
              <p class="modal-sub">{{ selectedWorker()?.trade }} • Rôle SaaS : <strong>{{ getRoleLabel(selectedWorker()!.saasRole) }}</strong></p>
            </div>
            <button class="close-btn" (click)="closePermissionsModal()">✕</button>
          </div>

          <div class="modal-body">
            <div class="worker-overview-box">
              <div class="ov-item">
                <span class="ov-lbl">Chantier en cours :</span>
                <strong>{{ selectedWorker()?.currentChantier }}</strong>
              </div>
              <div class="ov-item">
                <span class="ov-lbl">Tâches actives :</span>
                <span>{{ selectedWorker()?.assignedTasksCount }} travaux assignés</span>
              </div>
              <div class="ov-item">
                <span class="ov-lbl">Statut actuel :</span>
                <span class="status-pill" [ngClass]="selectedWorker()!.status.toLowerCase()">
                  {{ selectedWorker()?.status }}
                </span>
              </div>
            </div>

            <h4 class="perm-title">Matrice des Permissions & Rôles SaaS :</h4>
            <div class="permissions-checklist">
              <label class="perm-checkbox">
                <input type="checkbox" [(ngModel)]="selectedWorker()!.permissions.canCreateQuotes" />
                <div>
                  <strong>Création & Édition de Devis BTP (DQE)</strong>
                  <p>Autoriser le chiffrage et l'envoi de devis aux clients</p>
                </div>
              </label>

              <label class="perm-checkbox">
                <input type="checkbox" [(ngModel)]="selectedWorker()!.permissions.canValidatePayments" />
                <div>
                  <strong>Validation des Paiements & Acomptes</strong>
                  <p>Enregistrement des règlements par chèque, virement ou espèces</p>
                </div>
              </label>

              <label class="perm-checkbox">
                <input type="checkbox" [(ngModel)]="selectedWorker()!.permissions.canManageChantiers" />
                <div>
                  <strong>Gestion Technique des Chantiers & Planning</strong>
                  <p>Création de chantiers, ouverture des phases et affectation des sous-traitants</p>
                </div>
              </label>

              <label class="perm-checkbox">
                <input type="checkbox" [(ngModel)]="selectedWorker()!.permissions.canViewFinancials" />
                <div>
                  <strong>Visualisation des Marges & Rapports Financiers</strong>
                  <p>Accès au chiffre d'affaires global et analyse de rentabilité</p>
                </div>
              </label>

              <label class="perm-checkbox">
                <input type="checkbox" [(ngModel)]="selectedWorker()!.permissions.canManageWorkers" />
                <div>
                  <strong>Gestion des Effectifs & Pointage</strong>
                  <p>Ajout d'ouvriers journaliers et validation des fiches de paie</p>
                </div>
              </label>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-outline" (click)="closePermissionsModal()">Fermer</button>
            <button class="btn btn-primary" (click)="savePermissions()">Enregistrer les Droits</button>
          </div>
        </div>
      </div>

      <!-- MODAL AJOUT EMPLOYE -->
      <div *ngIf="showAddModal()" class="modal-backdrop">
        <div class="modal-box card">
          <div class="modal-header">
            <h3>Nouveau Collaborateur / Artisan BTP</h3>
            <button class="close-btn" (click)="showAddModal.set(false)">✕</button>
          </div>

          <div class="modal-body">
            <div class="form-group">
              <label>Nom et Prénom *</label>
              <input type="text" [(ngModel)]="newWorker.fullName" placeholder="Ex: Mohamed Amrani" />
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label>Spécialité Métier *</label>
                <select [(ngModel)]="newWorker.trade">
                  <option value="Conducteur de Travaux">Conducteur de Travaux</option>
                  <option value="Chef de Chantier">Chef de Chantier</option>
                  <option value="Maçon / Ferrailleur">Maçon / Ferrailleur</option>
                  <option value="Plombier Sanitaire">Plombier Sanitaire</option>
                  <option value="Électricien BTP">Électricien BTP</option>
                  <option value="Plâtrier BA13">Plâtrier BA13</option>
                  <option value="Peintre BTP">Peintre BTP</option>
                  <option value="Frigoriste HVAC">Frigoriste HVAC</option>
                </select>
              </div>
              <div class="form-group flex-1">
                <label>Rôle SaaS (Permissions) *</label>
                <select [(ngModel)]="newWorker.saasRole">
                  <option value="CHEF_PROJET">Chef de Projet</option>
                  <option value="MANAGER">Manager</option>
                  <option value="COMMERCIAL">Commercial</option>
                  <option value="EMPLOYEE">Employé (Artisan)</option>
                  <option value="ADMIN">Admin</option>
                  <option value="OWNER">Owner</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label>Téléphone *</label>
                <input type="text" [(ngModel)]="newWorker.phone" placeholder="0550 12 34 56" />
              </div>
              <div class="form-group flex-1">
                <label>Type de Contrat</label>
                <select [(ngModel)]="newWorker.contractType">
                  <option value="CDI">CDI Déclaré</option>
                  <option value="JOURNALIER">Journalier (Pointage)</option>
                  <option value="SOUS_TRAITANT">Sous-traitant Partenaire</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label>Tarif Journalier (DZD) *</label>
                <input type="number" [(ngModel)]="newWorker.dailyRateDzd" placeholder="3500" />
              </div>
              <div class="form-group flex-1">
                <label>Chantier Initial</label>
                <input type="text" [(ngModel)]="newWorker.currentChantier" placeholder="Villa R+2 Chéraga" />
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-outline" (click)="showAddModal.set(false)">Annuler</button>
            <button class="btn btn-primary" (click)="saveNewWorker()">Créer le Collaborateur</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .employees-page { display: flex; flex-direction: column; gap: 20px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; }
    .page-subtitle { font-size: 0.875rem; color: var(--text-muted); }
    .workers-kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; }
    .kpi-box {
      padding: 16px; display: flex; flex-direction: column; gap: 4px;
      .label { font-size: 0.775rem; font-weight: 600; color: var(--text-muted); }
      .val { font-size: 1.45rem; font-weight: 800; }
      .sub { font-size: 0.75rem; color: var(--text-muted); }
    }
    .filters-card { display: flex; align-items: center; gap: 16px; padding: 12px 18px; flex-wrap: wrap; }
    .search-box { flex: 1; min-width: 220px; input { width: 100%; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-size: 0.85rem; } }
    .filter-group {
      display: flex; align-items: center; gap: 8px;
      label { font-size: 0.8rem; font-weight: 600; color: var(--text-muted); }
      select { padding: 6px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-size: 0.825rem; }
    }
    .btp-table {
      width: 100%; border-collapse: collapse; font-size: 0.85rem;
      th { text-align: left; padding: 10px 12px; background: #f8fafc; border-bottom: 1px solid var(--border-color); color: var(--text-muted); }
      td { padding: 12px; border-bottom: 1px solid var(--border-color); }
    }
    .worker-row { cursor: pointer; &:hover { background: #f8fafc; } }
    .cell-main { font-weight: 600; }
    .cell-sub { font-size: 0.75rem; color: var(--text-muted); display: flex; align-items: center; gap: 6px; margin-top: 3px; }
    .saas-badge {
      font-size: 0.675rem; font-weight: 700; padding: 2px 6px; border-radius: 4px; text-transform: uppercase;
      &.owner { background: #fee2e2; color: #991b1b; }
      &.admin { background: #fee2e2; color: #b91c1c; }
      &.manager { background: #e0e7ff; color: #3730a3; }
      &.commercial { background: #fef3c7; color: #92400e; }
      &.chef_projet { background: #dbeafe; color: #1e40af; }
      &.employee { background: #d1fae5; color: #065f46; }
    }
    .contract-tag { font-size: 0.675rem; color: #64748b; }
    .trade-pill { font-size: 0.75rem; background: #eff6ff; color: #1d4ed8; padding: 3px 8px; border-radius: 4px; font-weight: 600; }
    .wage-val { font-weight: 700; color: var(--text-main); }
    .status-pill {
      font-size: 0.725rem; font-weight: 700; padding: 3px 8px; border-radius: var(--radius-full);
      &.sur_chantier { background: #dcfce7; color: #15803d; }
      &.disponible { background: #eff6ff; color: #1d4ed8; }
      &.en_conge { background: #f1f5f9; color: #64748b; }
    }
    .action-buttons { display: flex; gap: 6px; }
    .btn-xs { padding: 4px 8px; font-size: 0.725rem; }
    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(15, 23, 42, 0.7);
      display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px;
    }
    .modal-box { width: 100%; max-width: 560px; background: #fff; padding: 24px; }
    .modal-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 18px; border-bottom: 1px solid var(--border-color); padding-bottom: 10px; }
    .modal-sub { font-size: 0.8rem; color: var(--text-muted); }
    .close-btn { background: none; border: none; font-size: 1.2rem; cursor: pointer; }
    .worker-overview-box {
      display: flex; justify-content: space-between; background: #f8fafc; padding: 12px; border-radius: 6px; margin-bottom: 18px; font-size: 0.825rem;
    }
    .ov-item { display: flex; flex-direction: column; gap: 2px; }
    .ov-lbl { font-size: 0.7rem; color: var(--text-muted); }
    .perm-title { font-size: 0.9rem; margin-bottom: 12px; }
    .permissions-checklist { display: flex; flex-direction: column; gap: 10px; }
    .perm-checkbox {
      display: flex; gap: 10px; align-items: flex-start; padding: 10px; border: 1px solid var(--border-color); border-radius: 6px; cursor: pointer;
      input { margin-top: 3px; }
      strong { font-size: 0.85rem; display: block; }
      p { font-size: 0.75rem; color: var(--text-muted); margin: 0; }
    }
    .modal-footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; border-top: 1px solid var(--border-color); padding-top: 12px; }
    .form-row { display: flex; gap: 12px; }
    .flex-1 { flex: 1; }
  `],
})
export class EmployeesComponent {
  searchQuery = '';
  filterTrade = 'ALL';
  filterStatus = 'ALL';
  showAddModal = signal<boolean>(false);
  selectedWorker = signal<BtpEmployee | null>(null);

  workers: BtpEmployee[] = [
    {
      id: 'wrk-1',
      fullName: 'Ing. Rafik Kaci',
      trade: 'Conduite de Travaux & Génie Civil',
      saasRole: 'ADMIN',
      phone: '0550 99 11 22',
      email: 'r.kaci@btp-algerie.dz',
      contractType: 'CDI',
      dailyRateDzd: 7500,
      currentChantier: 'Villa R+2 Chéraga (CH-2024-001)',
      assignedTasksCount: 4,
      wilaya: '16 - Alger',
      status: 'SUR_CHANTIER',
      permissions: {
        canCreateQuotes: true,
        canValidatePayments: true,
        canManageChantiers: true,
        canViewFinancials: true,
        canManageWorkers: true,
      },
    },
    {
      id: 'wrk-2',
      fullName: 'Chef Mourad Tounsi',
      trade: 'Chef de Chantier Bâtiment',
      saasRole: 'CHEF_PROJET',
      phone: '0551 22 33 44',
      contractType: 'CDI',
      dailyRateDzd: 5500,
      currentChantier: 'Showroom Numidia Oran (CH-2024-002)',
      assignedTasksCount: 6,
      wilaya: '31 - Oran',
      status: 'SUR_CHANTIER',
      permissions: {
        canCreateQuotes: true,
        canValidatePayments: false,
        canManageChantiers: true,
        canViewFinancials: false,
        canManageWorkers: true,
      },
    },
    {
      id: 'wrk-3',
      fullName: 'Amine Boumedienne',
      trade: 'Technico-Commercial BTP',
      saasRole: 'COMMERCIAL',
      phone: '0560 33 44 55',
      email: 'a.boumedienne@btp-algerie.dz',
      contractType: 'CDI',
      dailyRateDzd: 4500,
      currentChantier: 'Prospection & Visites Métrés',
      assignedTasksCount: 8,
      wilaya: '16 - Alger',
      status: 'DISPONIBLE',
      permissions: {
        canCreateQuotes: true,
        canValidatePayments: false,
        canManageChantiers: false,
        canViewFinancials: false,
        canManageWorkers: false,
      },
    },
    {
      id: 'wrk-4',
      fullName: 'Slimane Benali',
      trade: 'Maçonnerie & Ferraillage',
      saasRole: 'EMPLOYEE',
      phone: '0552 44 55 66',
      contractType: 'JOURNALIER',
      dailyRateDzd: 3500,
      currentChantier: 'Villa R+2 Chéraga (CH-2024-001)',
      assignedTasksCount: 2,
      wilaya: '16 - Alger',
      status: 'SUR_CHANTIER',
      permissions: {
        canCreateQuotes: false,
        canValidatePayments: false,
        canManageChantiers: false,
        canViewFinancials: false,
        canManageWorkers: false,
      },
    },
    {
      id: 'wrk-5',
      fullName: 'Hocine Meziane',
      trade: 'Plomberie & Chauffage Central',
      saasRole: 'EMPLOYEE',
      phone: '0553 55 66 77',
      contractType: 'SOUS_TRAITANT',
      dailyRateDzd: 4000,
      currentChantier: 'En attente affectation',
      assignedTasksCount: 0,
      wilaya: '09 - Blida',
      status: 'DISPONIBLE',
      permissions: {
        canCreateQuotes: false,
        canValidatePayments: false,
        canManageChantiers: false,
        canViewFinancials: false,
        canManageWorkers: false,
      },
    },
  ];

  newWorker = {
    fullName: '',
    trade: 'Maçon / Ferrailleur',
    saasRole: 'EMPLOYEE' as RoleCode,
    phone: '',
    contractType: 'CDI' as 'CDI' | 'JOURNALIER' | 'SOUS_TRAITANT',
    dailyRateDzd: 3500,
    currentChantier: 'Villa R+2 Chéraga',
  };

  getCount(status: WorkerStatus): number {
    return this.workers.filter((w) => w.status === status).length;
  }

  totalDailyWages(): number {
    return this.workers.reduce((acc, curr) => acc + curr.dailyRateDzd, 0);
  }

  filteredWorkers(): BtpEmployee[] {
    return this.workers.filter((w) => {
      const matchTrade = this.filterTrade === 'ALL' || w.trade.toLowerCase().includes(this.filterTrade.toLowerCase());
      const matchStatus = this.filterStatus === 'ALL' || w.status === this.filterStatus;
      const q = this.searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        w.fullName.toLowerCase().includes(q) ||
        w.trade.toLowerCase().includes(q) ||
        w.phone.includes(q) ||
        w.currentChantier.toLowerCase().includes(q);
      return matchTrade && matchStatus && matchSearch;
    });
  }

  getRoleLabel(role: RoleCode): string {
    switch (role) {
      case 'OWNER': return 'Owner';
      case 'ADMIN': return 'Admin';
      case 'MANAGER': return 'Manager';
      case 'COMMERCIAL': return 'Commercial';
      case 'CHEF_PROJET': return 'Chef de projet';
      case 'EMPLOYEE': return 'Employé';
    }
  }

  openPermissionsModal(w: BtpEmployee): void {
    this.selectedWorker.set(JSON.parse(JSON.stringify(w)));
  }

  closePermissionsModal(): void {
    this.selectedWorker.set(null);
  }

  savePermissions(): void {
    if (!this.selectedWorker()) return;
    const idx = this.workers.findIndex((w) => w.id === this.selectedWorker()!.id);
    if (idx !== -1) {
      this.workers[idx] = this.selectedWorker()!;
    }
    this.selectedWorker.set(null);
  }

  openAddModal(): void {
    this.showAddModal.set(true);
  }

  saveNewWorker(): void {
    if (!this.newWorker.fullName || !this.newWorker.phone) return;
    const item: BtpEmployee = {
      id: 'wrk-' + (this.workers.length + 1),
      fullName: this.newWorker.fullName,
      trade: this.newWorker.trade,
      saasRole: this.newWorker.saasRole,
      phone: this.newWorker.phone,
      contractType: this.newWorker.contractType,
      dailyRateDzd: this.newWorker.dailyRateDzd || 3000,
      currentChantier: this.newWorker.currentChantier || 'Disponible',
      assignedTasksCount: 0,
      wilaya: '16 - Alger',
      status: 'DISPONIBLE',
      permissions: {
        canCreateQuotes: this.newWorker.saasRole === 'ADMIN' || this.newWorker.saasRole === 'COMMERCIAL',
        canValidatePayments: this.newWorker.saasRole === 'ADMIN' || this.newWorker.saasRole === 'OWNER',
        canManageChantiers: this.newWorker.saasRole === 'ADMIN' || this.newWorker.saasRole === 'CHEF_PROJET',
        canViewFinancials: this.newWorker.saasRole === 'ADMIN' || this.newWorker.saasRole === 'OWNER',
        canManageWorkers: this.newWorker.saasRole === 'ADMIN' || this.newWorker.saasRole === 'CHEF_PROJET',
      },
    };
    this.workers.unshift(item);
    this.showAddModal.set(false);
  }
}
