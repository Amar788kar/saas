import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface BtpPayment {
  id: string;
  paymentNumber: string;
  clientName: string;
  clientPhone: string;
  projectCode: string;
  projectTitle: string;
  amount: number;
  type: 'ACOMPTE' | 'SITUATION_TRAVAUX' | 'SOLDE_RECEPTION';
  method: 'CHEQUE' | 'VIREMENT_BANCAIRE' | 'ESPECES' | 'BARIDIMOB';
  reference: string;
  date: string;
  dueDate: string;
  status: 'VALIDE' | 'EN_ATTENTE' | 'EN_RETARD';
}

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="payments-page">
      <!-- HEADER -->
      <div class="page-header">
        <div>
          <h2>Règlements, Facturation & Encaissements BTP</h2>
          <p class="page-subtitle">Suivi de la trésorerie des chantiers, acomptes à la commande, situations et relances</p>
        </div>
        <button class="btn btn-primary" (click)="showModal.set(true)">
          + Enregistrer un Paiement
        </button>
      </div>

      <!-- 5 FINANCIAL KPIS DU PROMPT -->
      <div class="pay-kpi-grid">
        <div class="kpi-box card">
          <span class="label">Montant Global Marchés</span>
          <span class="val font-display">{{ totalMarketAmount() | number }} DZD</span>
          <span class="sub">Cumul de tous les chantiers</span>
        </div>
        <div class="kpi-box card">
          <span class="label">Total Encaissé (Payé)</span>
          <span class="val text-success font-display">{{ totalCollected() | number }} DZD</span>
          <span class="sub">65.5% des montants facturés</span>
        </div>
        <div class="kpi-box card">
          <span class="label">Reste à Payer (Créances)</span>
          <span class="val text-primary font-display">{{ totalBalanceDue() | number }} DZD</span>
          <span class="sub">Situations à recouvrer</span>
        </div>
        <div class="kpi-box card">
          <span class="label">Acomptes Reçus</span>
          <span class="val text-secondary font-display">{{ totalDeposits() | number }} DZD</span>
          <span class="sub">Garantie de démarrage</span>
        </div>
        <div class="kpi-box card alert-card">
          <span class="label">Paiements en Retard</span>
          <span class="val text-danger font-display">{{ totalOverdue() | number }} DZD</span>
          <span class="sub text-danger">⚠️ {{ overdueCount() }} factures échues</span>
        </div>
      </div>

      <!-- GRAPHIQUE FINANCIER & CASHFLOW CHANTIERS -->
      <div class="card chart-box">
        <div class="chart-header">
          <div>
            <h3>Graphique Financier — Flux de Trésorerie Chantiers (2024)</h3>
            <p class="chart-sub">Comparatif mensuel : Encaissements Clients vs Décaissements Matériaux & Main d'Œuvre (DZD)</p>
          </div>
          <div class="chart-legend">
            <span class="legend-item"><span class="dot in"></span> Encaissements Clients</span>
            <span class="legend-item"><span class="dot out"></span> Dépenses Fournisseurs & Paie</span>
          </div>
        </div>

        <div class="cashflow-bars">
          <div *ngFor="let m of financialMonths" class="month-col">
            <div class="bars-pair">
              <div class="bar bar-in" [style.height.%]="m.inPercent" [title]="'Encaissement: ' + (m.inflow | number) + ' DZD'"></div>
              <div class="bar bar-out" [style.height.%]="m.outPercent" [title]="'Dépense: ' + (m.outflow | number) + ' DZD'"></div>
            </div>
            <span class="month-name">{{ m.month }}</span>
          </div>
        </div>
      </div>

      <!-- SEARCH & FILTER -->
      <div class="filters-card card">
        <div class="search-input-box">
          <input
            type="text"
            [(ngModel)]="searchQuery"
            placeholder="Rechercher par N° règlement, client, chantier ou chèque..."
          />
        </div>
        <div class="filter-group">
          <label>Filtrer statut :</label>
          <select [(ngModel)]="filterStatus">
            <option value="ALL">Tous les statuts</option>
            <option value="VALIDE">Encaissés / Validés</option>
            <option value="EN_ATTENTE">En attente d'encaissement</option>
            <option value="EN_RETARD">En retard de paiement</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Mode de règlement :</label>
          <select [(ngModel)]="filterMethod">
            <option value="ALL">Tous les modes</option>
            <option value="CHEQUE">Chèque Bancaire</option>
            <option value="VIREMENT_BANCAIRE">Virement Bancaire (BADR/BNA/CPA)</option>
            <option value="ESPECES">Espèces (Reçu de caisse)</option>
            <option value="BARIDIMOB">BaridiMob / CCP</option>
          </select>
        </div>
      </div>

      <!-- TABLEAU DES PAIEMENTS & HISTORIQUE -->
      <div class="card table-card">
        <div class="table-responsive">
          <table class="btp-table">
            <thead>
              <tr>
                <th>Réf & Date</th>
                <th>Client & Chantier</th>
                <th>Type de Règlement</th>
                <th>Mode & Réf Chèque/Virement</th>
                <th>Montant</th>
                <th>Échéance</th>
                <th>Statut</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let p of filteredPayments()">
                <td>
                  <div class="cell-main font-bold">{{ p.paymentNumber }}</div>
                  <div class="cell-sub">Date: {{ p.date }}</div>
                </td>
                <td>
                  <div class="cell-main">{{ p.clientName }}</div>
                  <div class="cell-sub">🏗️ {{ p.projectTitle }} ({{ p.projectCode }})</div>
                </td>
                <td>
                  <span class="type-badge" [ngClass]="p.type.toLowerCase()">{{ getTypeLabel(p.type) }}</span>
                </td>
                <td>
                  <div class="cell-main">{{ getMethodLabel(p.method) }}</div>
                  <div class="cell-sub text-muted">Réf: {{ p.reference }}</div>
                </td>
                <td>
                  <div class="cell-amount text-success">{{ p.amount | number }} DZD</div>
                </td>
                <td>
                  <span class="cell-sub" [class.text-danger]="p.status === 'EN_RETARD'">{{ p.dueDate }}</span>
                </td>
                <td>
                  <span class="status-pill" [ngClass]="p.status.toLowerCase()">
                    {{ p.status === 'VALIDE' ? '✓ Encaissé' : (p.status === 'EN_RETARD' ? '⚠️ En retard' : '⏳ En cours') }}
                  </span>
                </td>
                <td>
                  <div class="action-buttons">
                    <button
                      *ngIf="p.status === 'EN_RETARD'"
                      class="btn btn-danger btn-xs"
                      (click)="sendReminder(p)"
                      title="Relancer le client sur WhatsApp"
                    >
                      Relancer
                    </button>
                    <button class="btn btn-outline btn-xs" (click)="printReceipt(p)" title="Bon de caisse">
                      Reçu
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- MODAL ENREGISTRER PAIEMENT -->
      <div *ngIf="showModal()" class="modal-backdrop">
        <div class="modal-box card">
          <div class="modal-header">
            <h3>Enregistrer un Encaissement Chantier</h3>
            <button class="close-btn" (click)="showModal.set(false)">✕</button>
          </div>

          <div class="modal-body">
            <div class="form-row">
              <div class="form-group flex-1">
                <label>Nom du Client *</label>
                <input type="text" [(ngModel)]="newPayment.clientName" placeholder="M. Belkacem Brahimi" />
              </div>
              <div class="form-group flex-1">
                <label>Téléphone Client</label>
                <input type="text" [(ngModel)]="newPayment.clientPhone" placeholder="0550 11 22 33" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label>Chantier associé *</label>
                <select [(ngModel)]="newPayment.projectCode">
                  <option value="CH-2024-001">Villa R+2 Chéraga (CH-2024-001)</option>
                  <option value="CH-2024-002">Showroom Numidia Oran (CH-2024-002)</option>
                  <option value="CH-2024-003">Résidence Les Pins Blida (CH-2024-003)</option>
                </select>
              </div>
              <div class="form-group flex-1">
                <label>Type de paiement</label>
                <select [(ngModel)]="newPayment.type">
                  <option value="ACOMPTE">Acompte à la commande</option>
                  <option value="SITUATION_TRAVAUX">Situation de Travaux</option>
                  <option value="SOLDE_RECEPTION">Solde de réception (PV)</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label>Montant en Dinars (DZD) *</label>
                <input type="number" [(ngModel)]="newPayment.amount" placeholder="2500000" />
              </div>
              <div class="form-group flex-1">
                <label>Mode de règlement *</label>
                <select [(ngModel)]="newPayment.method">
                  <option value="CHEQUE">Chèque Bancaire</option>
                  <option value="VIREMENT_BANCAIRE">Virement Bancaire (BADR/BNA/CPA)</option>
                  <option value="ESPECES">Espèces (Reçu de caisse)</option>
                  <option value="BARIDIMOB">BaridiMob / Poste</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label>N° Chèque / Référence transaction</label>
                <input type="text" [(ngModel)]="newPayment.reference" placeholder="Ex: Chèque BNA N° 890123" />
              </div>
              <div class="form-group flex-1">
                <label>Date de l'opération</label>
                <input type="date" [(ngModel)]="newPayment.date" />
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-outline" (click)="showModal.set(false)">Annuler</button>
            <button class="btn btn-primary" (click)="savePayment()">Valider l'encaissement</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .payments-page { display: flex; flex-direction: column; gap: 20px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; }
    .page-subtitle { font-size: 0.875rem; color: var(--text-muted); }
    .pay-kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; }
    .kpi-box {
      padding: 16px; display: flex; flex-direction: column; gap: 4px;
      .label { font-size: 0.775rem; font-weight: 600; color: var(--text-muted); }
      .val { font-size: 1.45rem; font-weight: 800; }
      .sub { font-size: 0.75rem; color: var(--text-muted); }
      &.alert-card { border-color: #fca5a5; background: #fffafa; }
    }
    .chart-box { padding: 20px; }
    .chart-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
    .chart-sub { font-size: 0.8rem; color: var(--text-muted); margin-top: 4px; }
    .chart-legend { display: flex; gap: 16px; font-size: 0.775rem; }
    .legend-item { display: flex; align-items: center; gap: 6px; }
    .dot {
      width: 10px; height: 10px; border-radius: 2px;
      &.in { background: #10b981; }
      &.out { background: #f97316; }
    }
    .cashflow-bars {
      display: flex; justify-content: space-between; align-items: flex-end; height: 180px;
      padding: 10px 0 20px; border-bottom: 1px solid var(--border-color); gap: 10px;
    }
    .month-col { flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; justify-content: flex-end; }
    .bars-pair { display: flex; gap: 4px; align-items: flex-end; height: 100%; width: 100%; max-width: 32px; }
    .bar {
      flex: 1; border-radius: 4px 4px 0 0; transition: height 0.3s ease;
      &.bar-in { background: #10b981; }
      &.bar-out { background: #f97316; }
    }
    .month-name { font-size: 0.725rem; color: var(--text-muted); margin-top: 8px; }
    .filters-card { display: flex; align-items: center; gap: 16px; padding: 12px 18px; flex-wrap: wrap; }
    .search-input-box { flex: 1; min-width: 220px; input { width: 100%; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-size: 0.85rem; } }
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
    .cell-main { font-weight: 600; }
    .cell-sub { font-size: 0.75rem; color: var(--text-muted); margin-top: 2px; }
    .cell-amount { font-weight: 700; font-size: 0.95rem; }
    .type-badge {
      font-size: 0.7rem; font-weight: 700; padding: 3px 8px; border-radius: 4px;
      &.acompte { background: #eff6ff; color: #1d4ed8; }
      &.situation_travaux { background: #fef3c7; color: #b45309; }
      &.solde_reception { background: #dcfce7; color: #15803d; }
    }
    .status-pill {
      font-size: 0.725rem; font-weight: 700; padding: 3px 8px; border-radius: var(--radius-full);
      &.valide { background: #dcfce7; color: #15803d; }
      &.en_attente { background: #fef3c7; color: #b45309; }
      &.en_retard { background: #fee2e2; color: #b91c1c; }
    }
    .action-buttons { display: flex; gap: 6px; }
    .btn-xs { padding: 4px 8px; font-size: 0.725rem; }
    .btn-danger { background: var(--danger); color: #fff; border: none; }
    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(15, 23, 42, 0.7);
      display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px;
    }
    .modal-box { width: 100%; max-width: 540px; background: #fff; padding: 24px; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; border-bottom: 1px solid var(--border-color); padding-bottom: 10px; }
    .close-btn { background: none; border: none; font-size: 1.2rem; cursor: pointer; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; border-top: 1px solid var(--border-color); padding-top: 12px; }
    .form-row { display: flex; gap: 12px; }
    .flex-1 { flex: 1; }
  `],
})
export class PaymentsComponent {
  searchQuery = '';
  filterStatus = 'ALL';
  filterMethod = 'ALL';
  showModal = signal<boolean>(false);

  financialMonths = [
    { month: 'Jan', inflow: 2200000, inPercent: 55, outflow: 1400000, outPercent: 35 },
    { month: 'Fév', inflow: 2800000, inPercent: 70, outflow: 1900000, outPercent: 48 },
    { month: 'Mar', inflow: 3100000, inPercent: 78, outflow: 2100000, outPercent: 53 },
    { month: 'Avr', inflow: 2400000, inPercent: 60, outflow: 1800000, outPercent: 45 },
    { month: 'Mai', inflow: 3400000, inPercent: 85, outflow: 2600000, outPercent: 65 },
    { month: 'Juin', inflow: 4100000, inPercent: 100, outflow: 3000000, outPercent: 75 },
    { month: 'Juil', inflow: 3600000, inPercent: 90, outflow: 2700000, outPercent: 68 },
    { month: 'Août', inflow: 1800000, inPercent: 45, outflow: 1500000, outPercent: 38 },
    { month: 'Sep', inflow: 3900000, inPercent: 98, outflow: 2900000, outPercent: 73 },
  ];

  payments: BtpPayment[] = [
    {
      id: 'pay-1',
      paymentNumber: 'REG-2024-001',
      clientName: 'M. Belkacem Brahimi',
      clientPhone: '0550 11 22 33',
      projectCode: 'CH-2024-001',
      projectTitle: 'Villa R+2 Chéraga',
      amount: 4260000,
      type: 'ACOMPTE',
      method: 'CHEQUE',
      reference: 'Chèque BNA #892011',
      date: '16 Aoû 2024',
      dueDate: '16 Aoû 2024',
      status: 'VALIDE',
    },
    {
      id: 'pay-2',
      paymentNumber: 'REG-2024-002',
      clientName: 'M. Belkacem Brahimi',
      clientPhone: '0550 11 22 33',
      projectCode: 'CH-2024-001',
      projectTitle: 'Villa R+2 Chéraga',
      amount: 4970000,
      type: 'SITUATION_TRAVAUX',
      method: 'VIREMENT_BANCAIRE',
      reference: 'Vir. BADR #VIR-99881',
      date: '10 Sep 2024',
      dueDate: '10 Sep 2024',
      status: 'VALIDE',
    },
    {
      id: 'pay-3',
      paymentNumber: 'REG-2024-003',
      clientName: 'SARL Numidia Import',
      clientPhone: '0661 44 55 66',
      projectCode: 'CH-2024-002',
      projectTitle: 'Showroom Numidia Oran',
      amount: 3400000,
      type: 'ACOMPTE',
      method: 'VIREMENT_BANCAIRE',
      reference: 'Vir. CPA #982210',
      date: '22 Aoû 2024',
      dueDate: '22 Aoû 2024',
      status: 'VALIDE',
    },
    {
      id: 'pay-4',
      paymentNumber: 'REG-2024-004',
      clientName: 'Copropriété Les Pins',
      clientPhone: '0555 33 22 11',
      projectCode: 'CH-2024-003',
      projectTitle: 'Rénovation Étanchéité Blida',
      amount: 1400000,
      type: 'SITUATION_TRAVAUX',
      method: 'CHEQUE',
      reference: 'Chèque BEA #55441',
      date: '05 Sep 2024',
      dueDate: '15 Sep 2024',
      status: 'EN_RETARD',
    },
    {
      id: 'pay-5',
      paymentNumber: 'REG-2024-005',
      clientName: 'Clinique El Chifa',
      clientPhone: '0661 99 88 00',
      projectCode: 'CH-2024-004',
      projectTitle: 'Climatisation VRV Sétif',
      amount: 1000000,
      type: 'SOLDE_RECEPTION',
      method: 'BARIDIMOB',
      reference: 'Transaction #TX-098812',
      date: '22 Sep 2024',
      dueDate: '30 Sep 2024',
      status: 'EN_ATTENTE',
    },
  ];

  newPayment = {
    clientName: '',
    clientPhone: '',
    projectCode: 'CH-2024-001',
    amount: 1500000,
    type: 'ACOMPTE' as 'ACOMPTE' | 'SITUATION_TRAVAUX' | 'SOLDE_RECEPTION',
    method: 'CHEQUE' as 'CHEQUE' | 'VIREMENT_BANCAIRE' | 'ESPECES' | 'BARIDIMOB',
    reference: '',
    date: 'Aujourd’hui',
  };

  totalMarketAmount(): number {
    return 32900000;
  }

  totalCollected(): number {
    return this.payments.filter((p) => p.status === 'VALIDE').reduce((acc, curr) => acc + curr.amount, 0);
  }

  totalBalanceDue(): number {
    return this.totalMarketAmount() - this.totalCollected();
  }

  totalDeposits(): number {
    return this.payments.filter((p) => p.type === 'ACOMPTE' && p.status === 'VALIDE').reduce((acc, curr) => acc + curr.amount, 0);
  }

  totalOverdue(): number {
    return this.payments.filter((p) => p.status === 'EN_RETARD').reduce((acc, curr) => acc + curr.amount, 0);
  }

  overdueCount(): number {
    return this.payments.filter((p) => p.status === 'EN_RETARD').length;
  }

  filteredPayments(): BtpPayment[] {
    return this.payments.filter((p) => {
      const matchStatus = this.filterStatus === 'ALL' || p.status === this.filterStatus;
      const matchMethod = this.filterMethod === 'ALL' || p.method === this.filterMethod;
      const q = this.searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        p.paymentNumber.toLowerCase().includes(q) ||
        p.clientName.toLowerCase().includes(q) ||
        p.projectTitle.toLowerCase().includes(q) ||
        p.reference.toLowerCase().includes(q);
      return matchStatus && matchMethod && matchSearch;
    });
  }

  getTypeLabel(t: string): string {
    switch (t) {
      case 'ACOMPTE': return 'Acompte Démarrage';
      case 'SITUATION_TRAVAUX': return 'Situation de Travaux';
      case 'SOLDE_RECEPTION': return 'Solde de Réception';
      default: return t;
    }
  }

  getMethodLabel(m: string): string {
    switch (m) {
      case 'CHEQUE': return 'Chèque Bancaire';
      case 'VIREMENT_BANCAIRE': return 'Virement Bancaire';
      case 'ESPECES': return 'Espèces (Bon de caisse)';
      case 'BARIDIMOB': return 'BaridiMob';
      default: return m;
    }
  }

  sendReminder(p: BtpPayment): void {
    const phone = p.clientPhone.replace(/\s+/g, '').replace(/^0/, '213');
    const text = encodeURIComponent(
      `Bonjour ${p.clientName},\nVotre règlement de ${p.amount.toLocaleString()} DZD concernant le chantier ${p.projectTitle} (${p.paymentNumber}) est en attente depuis le ${p.dueDate}.\nMerci de régulariser la situation.\nSARL BTP EL-BINAA Algérie.`
    );
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  }

  printReceipt(p: BtpPayment): void {
    alert(`Génération du Reçu d'encaissement BTP pour ${p.clientName} (${p.amount.toLocaleString()} DZD).`);
  }

  savePayment(): void {
    if (!this.newPayment.clientName || !this.newPayment.amount) return;
    const item: BtpPayment = {
      id: 'pay-' + (this.payments.length + 1),
      paymentNumber: 'REG-2024-00' + (this.payments.length + 1),
      clientName: this.newPayment.clientName,
      clientPhone: this.newPayment.clientPhone || '0550 00 00 00',
      projectCode: this.newPayment.projectCode,
      projectTitle: this.newPayment.projectCode === 'CH-2024-001' ? 'Villa R+2 Chéraga' : 'Showroom Numidia',
      amount: this.newPayment.amount,
      type: this.newPayment.type,
      method: this.newPayment.method,
      reference: this.newPayment.reference || 'Reçu caisse',
      date: 'Aujourd’hui',
      dueDate: 'Aujourd’hui',
      status: 'VALIDE',
    };
    this.payments.unshift(item);
    this.showModal.set(false);
  }
}
