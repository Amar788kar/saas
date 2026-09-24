import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

interface BtpContract {
  id: string;
  contractNumber: string;
  clientName: string;
  projectTitle: string;
  wilaya: string;
  signedDate: string;
  startDateOds: string; // Ordre de Service
  durationMonths: number;
  totalAmount: number;
  warrantyRetentionPercent: number; // Retenue de garantie (ex: 5%)
  penaltyPerDay: number;
  status: 'PREPARATION' | 'SIGNE' | 'EN_COURS' | 'AVENANT' | 'CLOTURE';
}

@Component({
  selector: 'app-contracts',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="contracts-page">
      <div class="page-header">
        <div>
          <h2>Contrats, Marchés & Ordres de Service (ODS)</h2>
          <p class="page-subtitle">Formalisez les engagements juridiques, délais d'exécution et clauses contractuelles BTP</p>
        </div>
        <button class="btn btn-primary" (click)="showModal.set(true)">
          + Rédiger un Contrat de Marché
        </button>
      </div>

      <!-- CONTRACT METRICS -->
      <div class="contract-kpi-grid">
        <div class="kpi-box card">
          <span class="label">Valeur totale des marchés</span>
          <span class="val text-primary">32 900 000 DZD</span>
        </div>
        <div class="kpi-box card">
          <span class="label">Marchés en cours d'exécution</span>
          <span class="val text-success">4 chantiers</span>
        </div>
        <div class="kpi-box card">
          <span class="label">Retenues de garantie (5%)</span>
          <span class="val">1 645 000 DZD</span>
        </div>
        <div class="kpi-box card">
          <span class="label">Respect des délais ODS</span>
          <span class="val text-primary">96%</span>
        </div>
      </div>

      <!-- CONTRACTS TABLE -->
      <div class="card table-card">
        <div class="table-responsive">
          <table class="btp-table">
            <thead>
              <tr>
                <th>N° Marché & Date</th>
                <th>Client & Projet</th>
                <th>Wilaya</th>
                <th>Montant Global DZD</th>
                <th>Date ODS & Délais</th>
                <th>Retenue Garantie</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let c of contracts">
                <td>
                  <div class="cell-main font-bold">{{ c.contractNumber }}</div>
                  <div class="cell-sub">Signé le: {{ c.signedDate }}</div>
                </td>
                <td>
                  <div class="cell-main">{{ c.projectTitle }}</div>
                  <div class="cell-sub">👤 {{ c.clientName }}</div>
                </td>
                <td><span class="wilaya-tag">{{ c.wilaya }}</span></td>
                <td class="cell-amount">{{ c.totalAmount | number }} DZD</td>
                <td>
                  <div class="cell-main">ODS: {{ c.startDateOds }}</div>
                  <div class="cell-sub font-semibold">Délai: {{ c.durationMonths }} mois</div>
                </td>
                <td>
                  <span class="retention-badge">{{ c.warrantyRetentionPercent }}% ({{ (c.totalAmount * c.warrantyRetentionPercent / 100) | number }} DZD)</span>
                </td>
                <td>
                  <span class="badge" [ngClass]="getStatusBadge(c.status)">{{ getStatusLabel(c.status) }}</span>
                </td>
                <td>
                  <div class="action-buttons">
                    <a routerLink="/projects" class="btn btn-outline btn-xs" title="Voir le chantier">Chantier</a>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- MODAL CREATE CONTRACT -->
      <div *ngIf="showModal()" class="modal-backdrop">
        <div class="modal-box card">
          <div class="modal-header">
            <h3>Nouveau Marché de Travaux</h3>
            <button class="close-btn" (click)="showModal.set(false)">✕</button>
          </div>

          <div class="modal-body">
            <div class="form-row">
              <div class="form-group flex-1">
                <label>Nom du Client *</label>
                <input type="text" [(ngModel)]="newContract.clientName" placeholder="M. Belkacem Dahmani" />
              </div>
              <div class="form-group flex-1">
                <label>Intitulé du Projet / Chantier *</label>
                <input type="text" [(ngModel)]="newContract.projectTitle" placeholder="Construction Villa R+2" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label>Montant Contractuel TTC (DZD) *</label>
                <input type="number" [(ngModel)]="newContract.totalAmount" placeholder="14200000" />
              </div>
              <div class="form-group flex-1">
                <label>Wilaya du Chantier *</label>
                <select [(ngModel)]="newContract.wilaya">
                  <option value="16 - Alger">16 - Alger</option>
                  <option value="31 - Oran">31 - Oran</option>
                  <option value="25 - Constantine">25 - Constantine</option>
                  <option value="19 - Sétif">19 - Sétif</option>
                  <option value="09 - Blida">09 - Blida</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label>Date Ordre de Service (ODS) *</label>
                <input type="date" [(ngModel)]="newContract.startDateOds" />
              </div>
              <div class="form-group flex-1">
                <label>Délai d'exécution (Mois) *</label>
                <input type="number" [(ngModel)]="newContract.durationMonths" min="1" max="48" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label>Retenue de garantie légale (%)</label>
                <input type="number" [(ngModel)]="newContract.warrantyRetentionPercent" placeholder="5" />
              </div>
              <div class="form-group flex-1">
                <label>Pénalité de retard (DZD / jour)</label>
                <input type="number" [(ngModel)]="newContract.penaltyPerDay" placeholder="5000" />
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-outline" (click)="showModal.set(false)">Annuler</button>
            <button class="btn btn-primary" (click)="saveContract()">Valider & Émettre Contrat</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .contracts-page {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }

    .page-subtitle {
      font-size: 0.875rem;
      color: var(--text-muted);
    }

    .contract-kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
    }

    .kpi-box {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 4px;

      .label {
        font-size: 0.775rem;
        font-weight: 600;
        color: var(--text-muted);
      }

      .val {
        font-size: 1.45rem;
        font-weight: 800;
        font-family: var(--font-display);
      }
    }

    .table-card {
      padding: 0;
      overflow: hidden;
    }

    .retention-badge {
      font-size: 0.75rem;
      font-weight: 600;
      color: #92400e;
      background: #fef3c7;
      padding: 3px 8px;
      border-radius: 4px;
    }

    .btn-xs {
      padding: 3px 8px;
      font-size: 0.75rem;
    }

    // MODAL
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100;
      padding: 16px;
    }

    .modal-box {
      width: 100%;
      max-width: 600px;
      padding: 24px;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 18px;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 12px;
      h3 { font-size: 1.15rem; }
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.25rem;
      cursor: pointer;
      color: var(--text-muted);
    }

    .modal-body {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .form-row {
      display: flex;
      gap: 12px;
    }

    .flex-1 { flex: 1; }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 20px;
      border-top: 1px solid var(--border-color);
      padding-top: 14px;
    }
  `],
})
export class ContractsComponent {
  showModal = signal<boolean>(false);

  contracts: BtpContract[] = [
    {
      id: 'CNT-01',
      contractNumber: 'MAR-2024-001',
      clientName: 'M. Belkacem Brahimi',
      projectTitle: 'Construction Villa R+2 Moderne (Chéraga)',
      wilaya: '16 - Alger',
      signedDate: '2024-08-01',
      startDateOds: '2024-08-15',
      durationMonths: 10,
      totalAmount: 14200000,
      warrantyRetentionPercent: 5,
      penaltyPerDay: 8000,
      status: 'EN_COURS',
    },
    {
      id: 'CNT-02',
      contractNumber: 'MAR-2024-002',
      clientName: 'SARL Numidia Import',
      projectTitle: 'Aménagement Showroom & Bureaux Administratifs',
      wilaya: '31 - Oran',
      signedDate: '2024-08-20',
      startDateOds: '2024-09-01',
      durationMonths: 4,
      totalAmount: 6800000,
      warrantyRetentionPercent: 5,
      penaltyPerDay: 5000,
      status: 'EN_COURS',
    },
    {
      id: 'CNT-03',
      contractNumber: 'MAR-2024-003',
      clientName: 'Copropriété Les Pins',
      projectTitle: 'Rénovation Façades & Étanchéité Toiture Terrasse',
      wilaya: '09 - Blida',
      signedDate: '2024-07-10',
      startDateOds: '2024-07-20',
      durationMonths: 3,
      totalAmount: 3500000,
      warrantyRetentionPercent: 5,
      penaltyPerDay: 3000,
      status: 'CLOTURE',
    },
    {
      id: 'CNT-04',
      contractNumber: 'MAR-2024-004',
      clientName: 'Clinique El Chifa',
      projectTitle: 'Installation Climatisation VRV Centrale',
      wilaya: '19 - Sétif',
      signedDate: '2024-09-10',
      startDateOds: '2024-09-20',
      durationMonths: 2,
      totalAmount: 8400000,
      warrantyRetentionPercent: 5,
      penaltyPerDay: 10000,
      status: 'EN_COURS',
    },
  ];

  newContract = {
    clientName: '',
    projectTitle: '',
    totalAmount: 5000000,
    wilaya: '16 - Alger',
    startDateOds: '2024-10-01',
    durationMonths: 6,
    warrantyRetentionPercent: 5,
    penaltyPerDay: 5000,
  };

  getStatusBadge(st: BtpContract['status']): string {
    switch (st) {
      case 'PREPARATION': return 'badge-manager';
      case 'SIGNE': return 'badge-commercial';
      case 'EN_COURS': return 'badge-active';
      case 'AVENANT': return 'badge-employee';
      case 'CLOTURE': return 'badge-admin';
    }
  }

  getStatusLabel(st: BtpContract['status']): string {
    switch (st) {
      case 'PREPARATION': return 'En rédaction';
      case 'SIGNE': return 'Signé';
      case 'EN_COURS': return 'En exécution';
      case 'AVENANT': return 'Avenant';
      case 'CLOTURE': return 'Clôturé';
    }
  }

  saveContract(): void {
    if (!this.newContract.clientName || !this.newContract.projectTitle) return;
    this.contracts.unshift({
      id: `CNT-${Date.now()}`,
      contractNumber: `MAR-2024-${String(this.contracts.length + 1).padStart(3, '0')}`,
      clientName: this.newContract.clientName,
      projectTitle: this.newContract.projectTitle,
      wilaya: this.newContract.wilaya,
      signedDate: new Date().toISOString().split('T')[0],
      startDateOds: this.newContract.startDateOds,
      durationMonths: Number(this.newContract.durationMonths) || 6,
      totalAmount: Number(this.newContract.totalAmount) || 0,
      warrantyRetentionPercent: Number(this.newContract.warrantyRetentionPercent) || 5,
      penaltyPerDay: Number(this.newContract.penaltyPerDay) || 5000,
      status: 'EN_COURS',
    });
    this.showModal.set(false);
  }
}
