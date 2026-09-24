import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

export interface ClientProject {
  code: string;
  title: string;
  phase: string;
  progress: number;
  budget: number;
}

export interface ClientQuote {
  quoteNumber: string;
  date: string;
  amountTtc: number;
  status: 'ACCEPTE' | 'ENVOYE' | 'NEGOCIATION' | 'REFUSE';
}

export interface ClientContract {
  contractNumber: string;
  signedDate: string;
  marketAmount: number;
  status: 'ACTIF' | 'CLOTURE';
}

export interface ClientPayment {
  paymentNumber: string;
  date: string;
  amount: number;
  method: string;
  type: string;
}

export interface ClientDoc {
  name: string;
  type: string;
  date: string;
  size: string;
}

export interface ClientEntry {
  id: string;
  name: string;
  type: 'INDIVIDUAL' | 'COMPANY';
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  wilaya: string;
  commune: string;
  nif?: string;
  nis?: string;
  rc?: string;
  totalProjects: number;
  totalBilled: number;
  totalPaid: number;
  balanceDue: number;
  status: 'ACTIVE' | 'INACTIVE';
  projects: ClientProject[];
  quotes: ClientQuote[];
  contracts: ClientContract[];
  payments: ClientPayment[];
  documents: ClientDoc[];
  history: { date: string; text: string; author: string }[];
}

@Component({
  selector: 'app-client-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="clients-container">
      <!-- HEADER -->
      <div class="page-header">
        <div>
          <h2>Répertoire Clients & Maîtres d'Ouvrage BTP</h2>
          <p class="page-subtitle">Base de données complète : Particuliers, Promoteurs, Entreprises et Organismes</p>
        </div>
        <button class="btn btn-primary" (click)="showModal.set(true)">
          + Ajouter un Client
        </button>
      </div>

      <!-- SEARCH & FILTER -->
      <div class="filters-card card">
        <div class="search-input-box">
          <input
            type="text"
            [(ngModel)]="searchQuery"
            placeholder="Rechercher par nom, téléphone, NIF, wilaya ou commune..."
          />
        </div>

        <div class="filter-group">
          <label>Type de client :</label>
          <select [(ngModel)]="selectedType">
            <option value="ALL">Tous les types</option>
            <option value="INDIVIDUAL">Particuliers (Villas / Logements)</option>
            <option value="COMPANY">Entreprises & Promoteurs</option>
          </select>
        </div>

        <div class="client-kpi-summary">
          <span>Total clients : <strong>{{ filteredClients().length }}</strong></span>
          <span>Créances à recouvrer : <strong class="text-danger">{{ totalPendingBalance() | number }} DZD</strong></span>
        </div>
      </div>

      <!-- CLIENTS TABLE -->
      <div class="card table-card">
        <div class="table-responsive">
          <table class="btp-table">
            <thead>
              <tr>
                <th>Client & Type</th>
                <th>Wilaya / Commune</th>
                <th>Téléphone & WhatsApp</th>
                <th>Chantiers</th>
                <th>Facturé Global</th>
                <th>Solde Restant</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let client of filteredClients()" class="client-row" (click)="openClientProfile(client)">
                <td>
                  <div class="cell-main">{{ client.name }}</div>
                  <div class="cell-sub">
                    <span class="type-pill" [class.company]="client.type === 'COMPANY'">
                      {{ client.type === 'COMPANY' ? '🏢 Promoteur / Sté' : '👤 Particulier' }}
                    </span>
                    <span *ngIf="client.rc" class="rc-tag">RC: {{ client.rc }}</span>
                  </div>
                </td>
                <td>
                  <div class="cell-main">{{ client.wilaya }}</div>
                  <div class="cell-sub">{{ client.commune }}</div>
                </td>
                <td (click)="$event.stopPropagation()">
                  <div class="contact-links">
                    <a [href]="'tel:' + client.phone" class="phone-link">📞 {{ client.phone }}</a>
                    <a
                      [href]="'https://wa.me/213' + client.whatsapp.replace(' ', '').replace('0', '')"
                      target="_blank"
                      class="wa-link"
                    >
                      💬 WhatsApp
                    </a>
                  </div>
                </td>
                <td>
                  <span class="badge badge-manager">{{ client.totalProjects }} chantier{{ client.totalProjects > 1 ? 's' : '' }}</span>
                </td>
                <td>
                  <div class="cell-amount">{{ client.totalBilled | number }} DZD</div>
                  <div class="cell-sub text-success">Payé: {{ client.totalPaid | number }} DZD</div>
                </td>
                <td>
                  <span
                    class="balance-tag"
                    [class.has-debt]="client.balanceDue > 0"
                    [class.cleared]="client.balanceDue === 0"
                  >
                    {{ client.balanceDue === 0 ? 'Réglé ✓' : (client.balanceDue | number) + ' DZD' }}
                  </span>
                </td>
                <td (click)="$event.stopPropagation()">
                  <div class="action-buttons">
                    <button class="btn btn-outline btn-xs" (click)="openClientProfile(client)">Fiche Profil</button>
                    <a routerLink="/quotes" class="btn btn-primary btn-xs">+ Devis</a>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- MODAL PROFIL CLIENT COMPLET (AVEC ONGLETS) -->
      <div *ngIf="selectedClient()" class="modal-backdrop" (click)="closeProfile()">
        <div class="modal-box modal-xl card" (click)="$event.stopPropagation()">
          <div class="profile-header">
            <div class="profile-avatar">
              {{ selectedClient()?.type === 'COMPANY' ? '🏢' : '👤' }}
            </div>
            <div class="profile-title-info">
              <div class="title-row">
                <h3>{{ selectedClient()?.name }}</h3>
                <span class="type-pill" [class.company]="selectedClient()?.type === 'COMPANY'">
                  {{ selectedClient()?.type === 'COMPANY' ? 'Société BTP / Promoteur' : 'Client Particulier' }}
                </span>
              </div>
              <p class="profile-sub">
                📍 {{ selectedClient()?.address }}, {{ selectedClient()?.commune }} ({{ selectedClient()?.wilaya }}) •
                📞 {{ selectedClient()?.phone }} • ✉️ {{ selectedClient()?.email }}
              </p>
            </div>
            <button class="close-btn" (click)="closeProfile()">✕</button>
          </div>

          <!-- TABS NAVIGATION -->
          <div class="profile-tabs">
            <button class="tab-btn" [class.active]="activeTab() === 'infos'" (click)="activeTab.set('infos')">
              📋 Infos & Fiscalité
            </button>
            <button class="tab-btn" [class.active]="activeTab() === 'projets'" (click)="activeTab.set('projets')">
              🏗️ Chantiers ({{ selectedClient()?.projects?.length || 0 }})
            </button>
            <button class="tab-btn" [class.active]="activeTab() === 'devis'" (click)="activeTab.set('devis')">
              📄 Devis ({{ selectedClient()?.quotes?.length || 0 }})
            </button>
            <button class="tab-btn" [class.active]="activeTab() === 'contrats'" (click)="activeTab.set('contrats')">
              📑 Contrats & Marchés ({{ selectedClient()?.contracts?.length || 0 }})
            </button>
            <button class="tab-btn" [class.active]="activeTab() === 'paiements'" (click)="activeTab.set('paiements')">
              💰 Règlements & Situations
            </button>
            <button class="tab-btn" [class.active]="activeTab() === 'documents'" (click)="activeTab.set('documents')">
              📁 Documents & Plans
            </button>
            <button class="tab-btn" [class.active]="activeTab() === 'historique'" (click)="activeTab.set('historique')">
              ⏳ Historique
            </button>
          </div>

          <!-- TAB CONTENT -->
          <div class="tab-body">
            <!-- 1. INFOS PERSONNELLES & FISCALES -->
            <div *ngIf="activeTab() === 'infos'" class="tab-pane">
              <div class="info-grid">
                <div class="info-card card">
                  <h4>Coordonnées de Contact</h4>
                  <div class="field-item"><span class="lbl">Nom complet / Raison :</span> <strong>{{ selectedClient()?.name }}</strong></div>
                  <div class="field-item"><span class="lbl">Téléphone principal :</span> <span>{{ selectedClient()?.phone }}</span></div>
                  <div class="field-item"><span class="lbl">WhatsApp :</span> <span>{{ selectedClient()?.whatsapp }}</span></div>
                  <div class="field-item"><span class="lbl">Email :</span> <span>{{ selectedClient()?.email }}</span></div>
                  <div class="field-item"><span class="lbl">Adresse :</span> <span>{{ selectedClient()?.address }}</span></div>
                  <div class="field-item"><span class="lbl">Wilaya & Commune :</span> <span>{{ selectedClient()?.commune }}, {{ selectedClient()?.wilaya }}</span></div>
                </div>

                <div class="info-card card">
                  <h4>Identifiants Fiscaux Algérie</h4>
                  <div class="field-item"><span class="lbl">NIF (Identifiant Fiscal) :</span> <strong>{{ selectedClient()?.nif || 'Non applicable' }}</strong></div>
                  <div class="field-item"><span class="lbl">NIS (Statistique) :</span> <span>{{ selectedClient()?.nis || 'Non applicable' }}</span></div>
                  <div class="field-item"><span class="lbl">Registre de Commerce (RC) :</span> <span>{{ selectedClient()?.rc || 'Non applicable' }}</span></div>
                  <div class="financial-summary-box">
                    <div class="f-col"><span class="f-lbl">Total Facturé</span><span class="f-val">{{ selectedClient()?.totalBilled | number }} DZD</span></div>
                    <div class="f-col"><span class="f-lbl">Total Encaissé</span><span class="f-val text-success">{{ selectedClient()?.totalPaid | number }} DZD</span></div>
                    <div class="f-col"><span class="f-lbl">Reste Dû</span><span class="f-val text-danger">{{ selectedClient()?.balanceDue | number }} DZD</span></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 2. PROJETS ASSOCIÉS -->
            <div *ngIf="activeTab() === 'projets'" class="tab-pane">
              <div class="table-responsive">
                <table class="btp-table">
                  <thead>
                    <tr>
                      <th>Code Chantier</th>
                      <th>Intitulé des travaux</th>
                      <th>Phase d'exécution</th>
                      <th>Avancement Physique</th>
                      <th>Budget Marché</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let p of selectedClient()?.projects">
                      <td><span class="wilaya-tag">{{ p.code }}</span></td>
                      <td><strong>{{ p.title }}</strong></td>
                      <td><span class="badge badge-manager">{{ p.phase }}</span></td>
                      <td>
                        <div class="progress-wrap">
                          <div class="progress-bar"><div class="progress-fill" [style.width.%]="p.progress"></div></div>
                          <span class="progress-label">{{ p.progress }}%</span>
                        </div>
                      </td>
                      <td class="font-bold">{{ p.budget | number }} DZD</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- 3. DEVIS ASSOCIÉS -->
            <div *ngIf="activeTab() === 'devis'" class="tab-pane">
              <div class="table-responsive">
                <table class="btp-table">
                  <thead>
                    <tr>
                      <th>N° Devis</th>
                      <th>Date d'émission</th>
                      <th>Montant TTC</th>
                      <th>Statut</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let q of selectedClient()?.quotes">
                      <td><strong>{{ q.quoteNumber }}</strong></td>
                      <td>{{ q.date }}</td>
                      <td class="font-bold">{{ q.amountTtc | number }} DZD</td>
                      <td>
                        <span class="stage-tag" [class.stage-gagne]="q.status === 'ACCEPTE'" [class.stage-devis]="q.status === 'ENVOYE'">
                          {{ q.status }}
                        </span>
                      </td>
                      <td><a routerLink="/quotes" class="btn btn-outline btn-xs">Voir DQE</a></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- 4. CONTRATS ASSOCIÉS -->
            <div *ngIf="activeTab() === 'contrats'" class="tab-pane">
              <div class="table-responsive">
                <table class="btp-table">
                  <thead>
                    <tr>
                      <th>N° Contrat / Marché</th>
                      <th>Date de Signature</th>
                      <th>Montant Total Marché</th>
                      <th>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let c of selectedClient()?.contracts">
                      <td><strong>{{ c.contractNumber }}</strong></td>
                      <td>{{ c.signedDate }}</td>
                      <td class="font-bold">{{ c.marketAmount | number }} DZD</td>
                      <td><span class="badge badge-active">{{ c.status }}</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- 5. PAIEMENTS & RÈGLEMENTS -->
            <div *ngIf="activeTab() === 'paiements'" class="tab-pane">
              <div class="table-responsive">
                <table class="btp-table">
                  <thead>
                    <tr>
                      <th>Réf Paiement</th>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Mode de Règlement</th>
                      <th>Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let py of selectedClient()?.payments">
                      <td><strong>{{ py.paymentNumber }}</strong></td>
                      <td>{{ py.date }}</td>
                      <td><span class="badge badge-manager">{{ py.type }}</span></td>
                      <td>{{ py.method }}</td>
                      <td class="font-bold text-success">{{ py.amount | number }} DZD</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- 6. DOCUMENTS & PLANS -->
            <div *ngIf="activeTab() === 'documents'" class="tab-pane">
              <div class="docs-grid">
                <div *ngFor="let doc of selectedClient()?.documents" class="doc-card card">
                  <div class="doc-icon">📄</div>
                  <div class="doc-info">
                    <p class="doc-title">{{ doc.name }}</p>
                    <span class="doc-meta">{{ doc.type }} • {{ doc.size }} • Ajouté le {{ doc.date }}</span>
                  </div>
                  <button class="btn btn-outline btn-xs">Télécharger</button>
                </div>
              </div>
            </div>

            <!-- 7. HISTORIQUE -->
            <div *ngIf="activeTab() === 'historique'" class="tab-pane">
              <div class="timeline-list">
                <div *ngFor="let h of selectedClient()?.history" class="timeline-item">
                  <div class="tl-dot"></div>
                  <div class="tl-content">
                    <p class="tl-text">{{ h.text }}</p>
                    <span class="tl-sub">{{ h.date }} • Par {{ h.author }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <a routerLink="/quotes" class="btn btn-primary">+ Émettre un Devis</a>
            <button class="btn btn-outline" (click)="closeProfile()">Fermer la Fiche</button>
          </div>
        </div>
      </div>

      <!-- MODAL CREATE CLIENT -->
      <div *ngIf="showModal()" class="modal-backdrop">
        <div class="modal-box card">
          <div class="modal-header">
            <h3>Nouveau Client / Maître d'Ouvrage</h3>
            <button class="close-btn" (click)="showModal.set(false)">✕</button>
          </div>

          <div class="modal-body">
            <div class="form-row">
              <div class="form-group flex-1">
                <label>Type de client *</label>
                <select [(ngModel)]="newClient.type">
                  <option value="INDIVIDUAL">Particulier (Villa / Rénovation)</option>
                  <option value="COMPANY">Entreprise / Promoteur Immobilier</option>
                </select>
              </div>
              <div class="form-group flex-1">
                <label>Nom ou Raison Sociale *</label>
                <input type="text" [(ngModel)]="newClient.name" placeholder="M. Hichem Berrabah ou SARL..." />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label>Téléphone *</label>
                <input type="text" [(ngModel)]="newClient.phone" placeholder="0550 12 34 56" />
              </div>
              <div class="form-group flex-1">
                <label>Numéro WhatsApp</label>
                <input type="text" [(ngModel)]="newClient.whatsapp" placeholder="0550 12 34 56" />
              </div>
            </div>

            <div class="form-group">
              <label>Adresse Email</label>
              <input type="email" [(ngModel)]="newClient.email" placeholder="client@domaine.dz" />
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label>Wilaya *</label>
                <select [(ngModel)]="newClient.wilaya">
                  <option value="16 - Alger">16 - Alger</option>
                  <option value="31 - Oran">31 - Oran</option>
                  <option value="25 - Constantine">25 - Constantine</option>
                  <option value="19 - Sétif">19 - Sétif</option>
                  <option value="09 - Blida">09 - Blida</option>
                </select>
              </div>
              <div class="form-group flex-1">
                <label>Commune *</label>
                <input type="text" [(ngModel)]="newClient.commune" placeholder="Chéraga, Hydra, Bir El Djir..." />
              </div>
            </div>

            <div *ngIf="newClient.type === 'COMPANY'" class="form-row">
              <div class="form-group flex-1">
                <label>NIF Entreprise</label>
                <input type="text" [(ngModel)]="newClient.nif" placeholder="00011600..." />
              </div>
              <div class="form-group flex-1">
                <label>RC Entreprise</label>
                <input type="text" [(ngModel)]="newClient.rc" placeholder="16/00-1234567B" />
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-outline" (click)="showModal.set(false)">Annuler</button>
            <button class="btn btn-primary" (click)="saveClient()">Enregistrer le Client</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .clients-container {
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
    .filters-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 14px 20px;
      flex-wrap: wrap;
    }
    .search-input-box {
      flex: 1;
      min-width: 240px;
      input {
        width: 100%;
        padding: 8px 14px;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        font-size: 0.875rem;
      }
    }
    .filter-group {
      display: flex;
      align-items: center;
      gap: 8px;
      label {
        font-size: 0.8rem;
        font-weight: 600;
        color: var(--text-muted);
      }
      select {
        padding: 6px 12px;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        font-size: 0.825rem;
      }
    }
    .client-kpi-summary {
      margin-left: auto;
      display: flex;
      gap: 20px;
      font-size: 0.825rem;
    }
    .client-row {
      cursor: pointer;
      &:hover {
        background: #f8fafc;
      }
    }
    .btp-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;
      th {
        text-align: left;
        padding: 10px 14px;
        background: #f8fafc;
        color: var(--text-muted);
        font-weight: 600;
        border-bottom: 1px solid var(--border-color);
      }
      td {
        padding: 12px 14px;
        border-bottom: 1px solid var(--border-color);
      }
    }
    .cell-main {
      font-weight: 600;
    }
    .cell-sub {
      font-size: 0.75rem;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 3px;
    }
    .type-pill {
      font-size: 0.7rem;
      padding: 2px 6px;
      border-radius: 4px;
      background: #f1f5f9;
      color: #475569;
      font-weight: 600;
      &.company { background: #e0e7ff; color: #3730a3; }
    }
    .rc-tag {
      font-size: 0.675rem;
      color: #64748b;
    }
    .contact-links {
      display: flex;
      flex-direction: column;
      gap: 2px;
      font-size: 0.75rem;
    }
    .phone-link { color: var(--text-main); }
    .wa-link { color: #16a34a; font-weight: 600; }
    .cell-amount { font-weight: 700; }
    .balance-tag {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: var(--radius-sm);
      &.has-debt { background: #fee2e2; color: #991b1b; }
      &.cleared { background: #dcfce7; color: #16a34a; }
    }
    .action-buttons {
      display: flex;
      gap: 6px;
    }
    .btn-xs {
      padding: 4px 8px;
      font-size: 0.725rem;
    }
    .modal-backdrop {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(15, 23, 42, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100;
      padding: 20px;
    }
    .modal-box {
      width: 100%;
      max-width: 520px;
      background: #fff;
      &.modal-xl {
        max-width: 960px;
        max-height: 90vh;
        overflow-y: auto;
      }
    }
    .profile-header {
      display: flex;
      align-items: center;
      gap: 16px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--border-color);
      position: relative;
    }
    .profile-avatar {
      width: 54px;
      height: 54px;
      border-radius: 12px;
      background: #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.6rem;
    }
    .profile-title-info {
      flex: 1;
    }
    .title-row {
      display: flex;
      align-items: center;
      gap: 10px;
      h3 { font-size: 1.25rem; margin: 0; }
    }
    .profile-sub {
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-top: 4px;
    }
    .close-btn {
      background: none;
      border: none;
      font-size: 1.3rem;
      cursor: pointer;
    }
    .profile-tabs {
      display: flex;
      gap: 8px;
      border-bottom: 1px solid var(--border-color);
      padding: 10px 0 0;
      overflow-x: auto;
    }
    .tab-btn {
      padding: 8px 12px;
      font-size: 0.8rem;
      font-weight: 600;
      border: none;
      background: none;
      color: var(--text-muted);
      cursor: pointer;
      border-bottom: 2px solid transparent;
      white-space: nowrap;
      &.active {
        color: var(--primary);
        border-bottom-color: var(--primary);
      }
    }
    .tab-body {
      padding: 20px 0;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      @media (max-width: 768px) { grid-template-columns: 1fr; }
    }
    .info-card {
      padding: 16px;
      h4 {
        font-size: 0.95rem;
        margin-bottom: 12px;
        border-bottom: 1px solid var(--border-color);
        padding-bottom: 6px;
      }
    }
    .field-item {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      border-bottom: 1px dashed #f1f5f9;
      font-size: 0.825rem;
      .lbl { color: var(--text-muted); }
    }
    .financial-summary-box {
      margin-top: 14px;
      display: flex;
      justify-content: space-between;
      background: #f8fafc;
      padding: 10px;
      border-radius: var(--radius-md);
    }
    .f-col {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .f-lbl { font-size: 0.7rem; color: var(--text-muted); }
    .f-val { font-size: 0.9rem; font-weight: 700; }
    .docs-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 12px;
    }
    .doc-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
    }
    .doc-icon { font-size: 1.4rem; }
    .doc-info { flex: 1; }
    .doc-title { font-size: 0.85rem; font-weight: 600; }
    .doc-meta { font-size: 0.7rem; color: var(--text-muted); }
    .timeline-list {
      display: flex;
      flex-direction: column;
      gap: 14px;
      padding-left: 10px;
    }
    .timeline-item {
      display: flex;
      gap: 12px;
    }
    .tl-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--primary);
      margin-top: 4px;
    }
    .tl-content { flex: 1; }
    .tl-text { font-size: 0.85rem; }
    .tl-sub { font-size: 0.725rem; color: var(--text-muted); }
    .progress-wrap {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .progress-bar {
      flex: 1;
      height: 6px;
      background: #e2e8f0;
      border-radius: 3px;
      overflow: hidden;
      min-width: 80px;
    }
    .progress-fill {
      height: 100%;
      background: var(--success);
    }
    .progress-label { font-size: 0.75rem; font-weight: 700; }
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 16px;
      border-top: 1px solid var(--border-color);
      padding-top: 14px;
    }
    .form-row { display: flex; gap: 12px; }
    .flex-1 { flex: 1; }
  `],
})
export class ClientListComponent {
  searchQuery = '';
  selectedType = 'ALL';
  showModal = signal<boolean>(false);
  selectedClient = signal<ClientEntry | null>(null);
  activeTab = signal<'infos' | 'projets' | 'devis' | 'contrats' | 'paiements' | 'documents' | 'historique'>('infos');

  clients: ClientEntry[] = [
    {
      id: 'CLT-001',
      name: 'M. Belkacem Brahimi',
      type: 'INDIVIDUAL',
      phone: '0550 11 22 33',
      whatsapp: '0550 11 22 33',
      email: 'b.brahimi@gmail.com',
      address: 'Lotissement Les Pins, Chéraga',
      wilaya: '16 - Alger',
      commune: 'Chéraga',
      totalProjects: 1,
      totalBilled: 14200000,
      totalPaid: 9230000,
      balanceDue: 4970000,
      status: 'ACTIVE',
      projects: [
        { code: 'CH-2024-001', title: 'Construction Villa R+2 Moderne', phase: 'Gros Œuvre (Dalle)', progress: 65, budget: 14200000 },
      ],
      quotes: [
        { quoteNumber: 'DEV-2024-001', date: '08 Aoû 2024', amountTtc: 14200000, status: 'ACCEPTE' },
      ],
      contracts: [
        { contractNumber: 'CTR-2024-001', signedDate: '15 Aoû 2024', marketAmount: 14200000, status: 'ACTIF' },
      ],
      payments: [
        { paymentNumber: 'PAY-001', date: '16 Aoû 2024', amount: 4260000, method: 'Chèque BNA', type: 'Acompte 30%' },
        { paymentNumber: 'PAY-004', date: '10 Sep 2024', amount: 4970000, method: 'Virement Badr', type: 'Situation 01 (Fondations)' },
      ],
      documents: [
        { name: 'Plan_Architecture_Villa_R+2.pdf', type: 'Plan DWG/PDF', date: '05 Aoû 2024', size: '8.4 Mo' },
        { name: 'Contrat_Marche_Brahimi_Signe.pdf', type: 'Contrat BTP', date: '15 Aoû 2024', size: '1.2 Mo' },
        { name: 'PV_Coulage_Amorces_Poteaux.pdf', type: 'PV Contrôle', date: '02 Sep 2024', size: '640 Ko' },
      ],
      history: [
        { date: '10 Sep 2024', text: 'Encaissement de la situation n°1 (4 970 000 DZD)', author: 'Comptabilité' },
        { date: '15 Aoû 2024', text: 'Signature du contrat et émission de l’Ordre de Service (ODS)', author: 'Amine B.' },
        { date: '08 Aoû 2024', text: 'Validation définitive du devis DQE par le client', author: 'Amine B.' },
      ],
    },
    {
      id: 'CLT-002',
      name: 'SARL Numidia Import Export',
      type: 'COMPANY',
      phone: '0661 44 55 66',
      whatsapp: '0661 44 55 66',
      email: 'direction@numidia-dz.com',
      address: 'Zone d’Activité Bir El Djir',
      wilaya: '31 - Oran',
      commune: 'Bir El Djir',
      nif: '001531098765432',
      nis: '0987654321',
      rc: '31/00-0987654B15',
      totalProjects: 2,
      totalBilled: 12500000,
      totalPaid: 9100000,
      balanceDue: 3400000,
      status: 'ACTIVE',
      projects: [
        { code: 'CH-2024-002', title: 'Aménagement Showroom & Bureaux', phase: 'Second Œuvre (BA13 & Élec)', progress: 42, budget: 6800000 },
        { code: 'CH-2023-018', title: 'Hangar Stockage Frigorifique', phase: 'Garantie SAV', progress: 100, budget: 5700000 },
      ],
      quotes: [
        { quoteNumber: 'DEV-2024-019', date: '12 Aoû 2024', amountTtc: 6800000, status: 'ACCEPTE' },
      ],
      contracts: [
        { contractNumber: 'CTR-2024-008', signedDate: '20 Aoû 2024', marketAmount: 6800000, status: 'ACTIF' },
      ],
      payments: [
        { paymentNumber: 'PAY-003', date: '22 Aoû 2024', amount: 3400000, method: 'Virement CPA', type: 'Acompte Démarrage' },
      ],
      documents: [
        { name: 'Cahier_Charges_Showroom.pdf', type: 'CCTP', date: '10 Aoû 2024', size: '3.1 Mo' },
        { name: 'Attestation_Fiscale_NIF_NIS.pdf', type: 'Fiscalité', date: '12 Aoû 2024', size: '520 Ko' },
      ],
      history: [
        { date: '18 Sep 2024', text: 'Validation des échantillons faux-plafond acoustique BA13', author: 'Chef Mourad' },
        { date: '22 Aoû 2024', text: 'Réception virement CPA acompte de 3 400 000 DZD', author: 'Comptabilité' },
      ],
    },
    {
      id: 'CLT-003',
      name: 'Promotion Immobilière Akid Lotfi',
      type: 'COMPANY',
      phone: '0555 99 88 77',
      whatsapp: '0555 99 88 77',
      email: 'contact@akid-promotion.dz',
      address: 'Boulevard Millenium',
      wilaya: '31 - Oran',
      commune: 'Oran',
      nif: '001231012345678',
      nis: '0123456789',
      rc: '31/00-1122334B19',
      totalProjects: 1,
      totalBilled: 38000000,
      totalPaid: 38000000,
      balanceDue: 0,
      status: 'ACTIVE',
      projects: [
        { code: 'CH-2023-012', title: 'Résidence 48 Logements Haut Standing', phase: 'Livraison & Réception', progress: 100, budget: 38000000 },
      ],
      quotes: [
        { quoteNumber: 'DEV-2023-044', date: '15 Jan 2023', amountTtc: 38000000, status: 'ACCEPTE' },
      ],
      contracts: [
        { contractNumber: 'CTR-2023-005', signedDate: '01 Fév 2023', marketAmount: 38000000, status: 'CLOTURE' },
      ],
      payments: [
        { paymentNumber: 'PAY-099', date: '30 Mai 2024', amount: 3800000, method: 'Chèque BEA', type: 'Solde de retenue de garantie' },
      ],
      documents: [
        { name: 'PV_Reception_Definitive_Travaux.pdf', type: 'PV Réception', date: '01 Juin 2024', size: '1.8 Mo' },
      ],
      history: [
        { date: '01 Juin 2024', text: 'Clôture définitive du marché et levée des réserves', author: 'DG' },
      ],
    },
  ];

  newClient = {
    name: '',
    type: 'INDIVIDUAL' as 'INDIVIDUAL' | 'COMPANY',
    phone: '',
    whatsapp: '',
    email: '',
    wilaya: '16 - Alger',
    commune: '',
    nif: '',
    rc: '',
  };

  filteredClients(): ClientEntry[] {
    return this.clients.filter((c) => {
      const matchType = this.selectedType === 'ALL' || c.type === this.selectedType;
      const q = this.searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.commune.toLowerCase().includes(q) ||
        c.wilaya.toLowerCase().includes(q) ||
        (c.nif && c.nif.includes(q)) ||
        (c.rc && c.rc.includes(q));
      return matchType && matchSearch;
    });
  }

  totalPendingBalance(): number {
    return this.filteredClients().reduce((acc, curr) => acc + curr.balanceDue, 0);
  }

  openClientProfile(client: ClientEntry): void {
    this.selectedClient.set(client);
    this.activeTab.set('infos');
  }

  closeProfile(): void {
    this.selectedClient.set(null);
  }

  saveClient(): void {
    if (!this.newClient.name || !this.newClient.phone) return;
    const item: ClientEntry = {
      id: 'CLT-00' + (this.clients.length + 1),
      name: this.newClient.name,
      type: this.newClient.type,
      phone: this.newClient.phone,
      whatsapp: this.newClient.whatsapp || this.newClient.phone,
      email: this.newClient.email || '',
      address: 'Algérie',
      wilaya: this.newClient.wilaya,
      commune: this.newClient.commune || 'Centre',
      nif: this.newClient.nif,
      rc: this.newClient.rc,
      totalProjects: 0,
      totalBilled: 0,
      totalPaid: 0,
      balanceDue: 0,
      status: 'ACTIVE',
      projects: [],
      quotes: [],
      contracts: [],
      payments: [],
      documents: [],
      history: [{ date: 'Aujourd’hui', text: 'Création du client dans le répertoire BTP', author: 'Vous' }],
    };
    this.clients.unshift(item);
    this.showModal.set(false);
  }
}
