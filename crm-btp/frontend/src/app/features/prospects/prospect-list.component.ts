import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

export type LeadStage = 'NOUVEAU' | 'CONTACTE' | 'VISITE' | 'DEVIS' | 'NEGOCIATION' | 'GAGNE' | 'PERDU';

export interface Interaction {
  date: string;
  type: 'APPEL' | 'WHATSAPP' | 'VISITE' | 'DEVIS';
  note: string;
  author: string;
}

export interface LeadItem {
  id: string;
  clientName: string;
  phone: string;
  whatsapp: string;
  email?: string;
  address: string;
  commune: string;
  wilaya: string;
  title: string;
  projectType: string;
  trade: string;
  estimatedValue: number;
  stage: LeadStage;
  source: string;
  assignedTo: string;
  date: string;
  nextFollowUp: string;
  notes: string;
  interactions: Interaction[];
}

@Component({
  selector: 'app-prospect-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="prospects-container">
      <!-- HEADER -->
      <div class="page-header">
        <div>
          <h2>Gestion des Prospects & Pipeline Commercial (CRM BTP)</h2>
          <p class="page-subtitle">Suivez vos opportunités chantiers de la prospection jusqu'au contrat signé</p>
        </div>
        <div class="header-actions">
          <div class="view-toggle">
            <button class="toggle-btn" [class.active]="viewMode() === 'kanban'" (click)="viewMode.set('kanban')">
              📊 Kanban
            </button>
            <button class="toggle-btn" [class.active]="viewMode() === 'table'" (click)="viewMode.set('table')">
              📋 Tableau
            </button>
          </div>
          <button class="btn btn-primary" (click)="showNewModal.set(true)">
            + Nouveau Prospect
          </button>
        </div>
      </div>

      <!-- FILTERS & SEARCH ROW -->
      <div class="filters-card card">
        <div class="search-box">
          <input
            type="text"
            [(ngModel)]="searchQuery"
            placeholder="Rechercher par nom, téléphone, commune ou projet..."
          />
        </div>

        <div class="filter-group">
          <label>Corps d'État :</label>
          <select [(ngModel)]="selectedTrade">
            <option value="ALL">Tous les corps d'état</option>
            <option value="Gros Œuvre">Gros Œuvre & Bâtiment</option>
            <option value="Plomberie">Plomberie & Chauffage</option>
            <option value="Électricité">Électricité & Solaire</option>
            <option value="Peinture">Peinture & Faux-plafond BA13</option>
            <option value="Climatisation">Climatisation HVAC</option>
            <option value="Revêtement">Revêtement & Carrelage</option>
            <option value="Menuiserie">Menuiserie Alu & PVC</option>
          </select>
        </div>

        <div class="filter-group">
          <label>Wilaya :</label>
          <select [(ngModel)]="selectedWilaya">
            <option value="ALL">Toutes les wilayas</option>
            <option value="16 - Alger">16 - Alger</option>
            <option value="31 - Oran">31 - Oran</option>
            <option value="25 - Constantine">25 - Constantine</option>
            <option value="19 - Sétif">19 - Sétif</option>
            <option value="09 - Blida">09 - Blida</option>
          </select>
        </div>

        <div class="filter-summary">
          <span>Opportunités : <strong>{{ filteredLeads().length }}</strong></span>
          <span>Potentiel : <strong class="text-primary">{{ totalPipelineAmount() | number }} DZD</strong></span>
        </div>
      </div>

      <!-- KANBAN BOARD (7 ÉTAPES DU PROMPT) -->
      <div *ngIf="viewMode() === 'kanban'" class="kanban-board">
        <div *ngFor="let col of kanbanColumns" class="kanban-column" [class.won-col]="col.stage === 'GAGNE'" [class.lost-col]="col.stage === 'PERDU'">
          <div class="column-header" [style.border-top-color]="col.color">
            <div class="col-title-wrap">
              <span class="col-title">{{ col.title }}</span>
              <span class="col-badge">{{ getLeadsForStage(col.stage).length }}</span>
            </div>
            <span class="col-sum">{{ getStageSum(col.stage) | number }} DZD</span>
          </div>

          <div class="column-cards">
            <div
              *ngFor="let lead of getLeadsForStage(col.stage)"
              class="lead-card card"
              (click)="openLeadDetails(lead)"
            >
              <div class="lead-card-header">
                <span class="lead-trade-badge">{{ lead.trade }}</span>
                <span class="lead-wilaya-badge">{{ lead.wilaya }}</span>
              </div>
              <h4 class="lead-title">{{ lead.title }}</h4>
              <p class="lead-client">👤 {{ lead.clientName }}</p>
              
              <div class="quick-contacts" (click)="$event.stopPropagation()">
                <a [href]="'tel:' + lead.phone" class="contact-pill phone" title="Appeler">📞 {{ lead.phone }}</a>
                <a
                  [href]="'https://wa.me/213' + lead.whatsapp.replace(' ', '').replace('0', '')"
                  target="_blank"
                  class="contact-pill wa"
                  title="WhatsApp direct"
                >
                  💬 WA
                </a>
              </div>

              <div class="lead-card-footer">
                <span class="lead-amount">{{ lead.estimatedValue | number }} DZD</span>
                <div class="lead-actions" (click)="$event.stopPropagation()">
                  <button
                    *ngIf="col.stage !== 'GAGNE' && col.stage !== 'PERDU'"
                    class="btn-micro"
                    (click)="advanceStage(lead)"
                    title="Étape suivante"
                  >
                    →
                  </button>
                </div>
              </div>

              <div *ngIf="lead.nextFollowUp" class="follow-up-tag">
                ⏰ Relance : {{ lead.nextFollowUp }}
              </div>
            </div>

            <div *ngIf="getLeadsForStage(col.stage).length === 0" class="empty-column-msg">
              Aucun dossier
            </div>
          </div>
        </div>
      </div>

      <!-- TABLE VIEW -->
      <div *ngIf="viewMode() === 'table'" class="card table-card">
        <div class="table-responsive">
          <table class="btp-table">
            <thead>
              <tr>
                <th>Projet & Client</th>
                <th>Corps d'État</th>
                <th>Wilaya / Commune</th>
                <th>Budget Estimé</th>
                <th>Étape Pipeline</th>
                <th>Contact</th>
                <th>Prochaine Relance</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let lead of filteredLeads()" (click)="openLeadDetails(lead)" class="clickable-row">
                <td>
                  <div class="cell-main">{{ lead.title }}</div>
                  <div class="cell-sub">👤 {{ lead.clientName }} • Source: {{ lead.source }}</div>
                </td>
                <td><span class="lead-trade-badge">{{ lead.trade }}</span></td>
                <td>
                  <div class="cell-main">{{ lead.wilaya }}</div>
                  <div class="cell-sub">{{ lead.commune }}</div>
                </td>
                <td class="cell-amount">{{ lead.estimatedValue | number }} DZD</td>
                <td>
                  <span class="stage-tag" [ngClass]="getStageClass(lead.stage)">{{ getStageLabel(lead.stage) }}</span>
                </td>
                <td (click)="$event.stopPropagation()">
                  <div class="contact-links">
                    <a [href]="'tel:' + lead.phone" class="text-secondary">📞 {{ lead.phone }}</a>
                    <a
                      [href]="'https://wa.me/213' + lead.whatsapp.replace(' ', '').replace('0', '')"
                      target="_blank"
                      class="text-success font-bold"
                    >
                      💬 WhatsApp
                    </a>
                  </div>
                </td>
                <td>
                  <span class="follow-date">{{ lead.nextFollowUp || 'Non définie' }}</span>
                </td>
                <td (click)="$event.stopPropagation()">
                  <div class="action-buttons">
                    <button class="btn btn-outline btn-xs" (click)="openLeadDetails(lead)">Fiche</button>
                    <a routerLink="/quotes" class="btn btn-primary btn-xs">+ Devis</a>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- MODAL FICHE PROSPECT DÉTAILLÉE -->
      <div *ngIf="selectedLead()" class="modal-backdrop" (click)="closeDetails()">
        <div class="modal-box modal-lg card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <span class="lead-trade-badge">{{ selectedLead()?.trade }}</span>
              <h3>{{ selectedLead()?.title }}</h3>
              <p class="modal-sub">Dossier #{{ selectedLead()?.id }} • Créé le {{ selectedLead()?.date }}</p>
            </div>
            <button class="close-btn" (click)="closeDetails()">✕</button>
          </div>

          <div class="modal-body">
            <!-- STAGE PROGRESSOR -->
            <div class="stage-progressor">
              <span class="stage-lbl">Étape actuelle :</span>
              <div class="stage-buttons">
                <button
                  *ngFor="let col of kanbanColumns"
                  class="stage-step-btn"
                  [class.active]="selectedLead()?.stage === col.stage"
                  (click)="changeSelectedLeadStage(col.stage)"
                >
                  {{ col.title }}
                </button>
              </div>
            </div>

            <!-- 2-COL DETAILS -->
            <div class="lead-details-grid">
              <!-- GAUCHE : INFOS CLIENT & PROJET -->
              <div class="details-section card">
                <h4>Informations Prospect</h4>
                <div class="info-row">
                  <span class="lbl">Client / Contact :</span>
                  <strong>{{ selectedLead()?.clientName }}</strong>
                </div>
                <div class="info-row">
                  <span class="lbl">Téléphone :</span>
                  <div class="inline-actions">
                    <span>{{ selectedLead()?.phone }}</span>
                    <a [href]="'tel:' + selectedLead()?.phone" class="btn btn-outline btn-xs">Appeler</a>
                  </div>
                </div>
                <div class="info-row">
                  <span class="lbl">WhatsApp :</span>
                  <div class="inline-actions">
                    <span>{{ selectedLead()?.whatsapp }}</span>
                    <a
                      [href]="'https://wa.me/213' + selectedLead()?.whatsapp?.replace(' ', '')?.replace('0', '')"
                      target="_blank"
                      class="btn btn-success btn-xs"
                    >
                      Envoyer WhatsApp
                    </a>
                  </div>
                </div>
                <div class="info-row">
                  <span class="lbl">Adresse :</span>
                  <span>{{ selectedLead()?.address }}, {{ selectedLead()?.commune }} ({{ selectedLead()?.wilaya }})</span>
                </div>
                <div class="info-row">
                  <span class="lbl">Type de Projet :</span>
                  <span>{{ selectedLead()?.projectType }}</span>
                </div>
                <div class="info-row">
                  <span class="lbl">Budget Estimé :</span>
                  <strong class="text-primary font-lg">{{ selectedLead()?.estimatedValue | number }} DZD</strong>
                </div>
                <div class="info-row">
                  <span class="lbl">Source d'acquisition :</span>
                  <span>{{ selectedLead()?.source }}</span>
                </div>
                <div class="info-row">
                  <span class="lbl">Assigné à :</span>
                  <span>👷 {{ selectedLead()?.assignedTo }}</span>
                </div>
                <div class="info-row">
                  <span class="lbl">Prochaine relance :</span>
                  <strong class="text-danger">⏰ {{ selectedLead()?.nextFollowUp }}</strong>
                </div>
              </div>

              <!-- DROITE : HISTORIQUE INTERACTIONS & ACTIONS -->
              <div class="details-section card">
                <div class="section-title-row">
                  <h4>Historique des Échanges</h4>
                  <button class="btn btn-outline btn-xs" (click)="showAddInteraction.set(true)">+ Noter un échange</button>
                </div>

                <!-- ADD INTERACTION FORM -->
                <div *ngIf="showAddInteraction()" class="add-interaction-box">
                  <div class="form-row">
                    <select [(ngModel)]="newInteractionType" class="flex-1">
                      <option value="APPEL">📞 Appel</option>
                      <option value="WHATSAPP">💬 WhatsApp</option>
                      <option value="VISITE">📐 Visite</option>
                      <option value="DEVIS">📄 Devis</option>
                    </select>
                    <input type="text" [(ngModel)]="newInteractionNote" placeholder="Résumé de la discussion..." class="flex-2" />
                    <button class="btn btn-primary btn-xs" (click)="saveInteraction()">Ajouter</button>
                  </div>
                </div>

                <div class="interactions-timeline">
                  <div *ngFor="let inter of selectedLead()?.interactions" class="interaction-item">
                    <div class="inter-icon" [ngClass]="inter.type.toLowerCase()">
                      <span *ngIf="inter.type === 'APPEL'">📞</span>
                      <span *ngIf="inter.type === 'WHATSAPP'">💬</span>
                      <span *ngIf="inter.type === 'VISITE'">📐</span>
                      <span *ngIf="inter.type === 'DEVIS'">📄</span>
                    </div>
                    <div class="inter-body">
                      <p class="inter-note">{{ inter.note }}</p>
                      <div class="inter-meta">
                        <span>{{ inter.date }}</span> • <span>Par: {{ inter.author }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <a routerLink="/quotes" class="btn btn-primary">Créer un Devis pour ce prospect →</a>
            <button class="btn btn-outline" (click)="closeDetails()">Fermer</button>
          </div>
        </div>
      </div>

      <!-- MODAL NOUVEAU PROSPECT -->
      <div *ngIf="showNewModal()" class="modal-backdrop">
        <div class="modal-box card">
          <div class="modal-header">
            <h3>Ajouter un Nouveau Prospect</h3>
            <button class="close-btn" (click)="showNewModal.set(false)">✕</button>
          </div>

          <div class="modal-body">
            <div class="form-group">
              <label>Nom du Client / Contact *</label>
              <input type="text" [(ngModel)]="newLead.clientName" placeholder="M. Karim Meziane" />
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label>Téléphone *</label>
                <input type="text" [(ngModel)]="newLead.phone" placeholder="0550 12 34 56" />
              </div>
              <div class="form-group flex-1">
                <label>Numéro WhatsApp</label>
                <input type="text" [(ngModel)]="newLead.whatsapp" placeholder="0550 12 34 56" />
              </div>
            </div>

            <div class="form-group">
              <label>Intitulé du Projet *</label>
              <input type="text" [(ngModel)]="newLead.title" placeholder="Ex: Rénovation Appartement F4 ou Villa R+2" />
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label>Corps d'État</label>
                <select [(ngModel)]="newLead.trade">
                  <option value="Gros Œuvre">Gros Œuvre & Bâtiment</option>
                  <option value="Plomberie">Plomberie & Chauffage</option>
                  <option value="Électricité">Électricité & Solaire</option>
                  <option value="Peinture">Peinture & BA13</option>
                  <option value="Climatisation">Climatisation HVAC</option>
                  <option value="Revêtement">Carrelage & Revêtement</option>
                  <option value="Menuiserie">Menuiserie Aluminium</option>
                </select>
              </div>
              <div class="form-group flex-1">
                <label>Budget Estimé (DZD)</label>
                <input type="number" [(ngModel)]="newLead.estimatedValue" placeholder="3500000" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label>Wilaya *</label>
                <select [(ngModel)]="newLead.wilaya">
                  <option value="16 - Alger">16 - Alger</option>
                  <option value="31 - Oran">31 - Oran</option>
                  <option value="25 - Constantine">25 - Constantine</option>
                  <option value="19 - Sétif">19 - Sétif</option>
                  <option value="09 - Blida">09 - Blida</option>
                </select>
              </div>
              <div class="form-group flex-1">
                <label>Commune</label>
                <input type="text" [(ngModel)]="newLead.commune" placeholder="Chéraga, Hydra, Bir El Djir..." />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label>Source du prospect</label>
                <select [(ngModel)]="newLead.source">
                  <option value="Recommandation">Recommandation client</option>
                  <option value="Facebook / Instagram BTP">Facebook / Instagram BTP</option>
                  <option value="Bouche-à-oreille">Bouche-à-oreille</option>
                  <option value="Chantier Voisin">Panneau Chantier Voisin</option>
                  <option value="Ouedkniss">Ouedkniss / Annonce</option>
                  <option value="Appel Direct">Appel entrant direct</option>
                </select>
              </div>
              <div class="form-group flex-1">
                <label>Prochaine relance</label>
                <input type="date" [(ngModel)]="newLead.nextFollowUp" />
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-outline" (click)="showNewModal.set(false)">Annuler</button>
            <button class="btn btn-primary" (click)="saveNewLead()">Enregistrer le Prospect</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .prospects-container {
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
    .header-actions {
      display: flex;
      gap: 12px;
    }
    .view-toggle {
      display: flex;
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 3px;
    }
    .toggle-btn {
      padding: 6px 12px;
      font-size: 0.8rem;
      font-weight: 600;
      border: none;
      background: transparent;
      border-radius: 6px;
      cursor: pointer;
      color: var(--text-muted);
      &.active {
        background: var(--bg-main);
        color: var(--text-main);
        box-shadow: 0 1px 2px rgba(0,0,0,0.05);
      }
    }
    .filters-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 14px 20px;
      flex-wrap: wrap;
    }
    .search-box {
      flex: 1;
      min-width: 220px;
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
    .filter-summary {
      margin-left: auto;
      display: flex;
      gap: 16px;
      font-size: 0.825rem;
    }
    .kanban-board {
      display: grid;
      grid-template-columns: repeat(7, minmax(220px, 1fr));
      gap: 14px;
      overflow-x: auto;
      padding-bottom: 14px;
    }
    .kanban-column {
      background: var(--bg-main);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      display: flex;
      flex-direction: column;
      max-height: 80vh;
      min-width: 220px;
      &.won-col { background: #f0fdf4; border-color: #bbf7d0; }
      &.lost-col { background: #fef2f2; border-color: #fecaca; }
    }
    .column-header {
      padding: 12px 14px;
      border-top: 4px solid #cbd5e1;
      border-bottom: 1px solid var(--border-color);
      background: var(--bg-surface);
      border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    }
    .col-title-wrap {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }
    .col-title {
      font-size: 0.825rem;
      font-weight: 700;
    }
    .col-badge {
      background: #e2e8f0;
      font-size: 0.7rem;
      padding: 1px 6px;
      border-radius: var(--radius-full);
      font-weight: 700;
    }
    .col-sum {
      font-size: 0.725rem;
      color: var(--text-muted);
      font-weight: 600;
    }
    .column-cards {
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      overflow-y: auto;
      flex: 1;
    }
    .lead-card {
      padding: 12px;
      cursor: pointer;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
      &:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
      }
    }
    .lead-card-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
    }
    .lead-trade-badge {
      font-size: 0.675rem;
      font-weight: 700;
      color: #2563eb;
      background: #eff6ff;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .lead-wilaya-badge {
      font-size: 0.675rem;
      color: var(--text-muted);
    }
    .lead-title {
      font-size: 0.85rem;
      font-weight: 600;
      margin-bottom: 4px;
    }
    .lead-client {
      font-size: 0.75rem;
      color: #334155;
      margin-bottom: 6px;
    }
    .quick-contacts {
      display: flex;
      gap: 6px;
      margin-bottom: 8px;
    }
    .contact-pill {
      font-size: 0.7rem;
      padding: 2px 6px;
      border-radius: 4px;
      text-decoration: none;
      font-weight: 600;
      &.phone { background: #f1f5f9; color: #334155; }
      &.wa { background: #dcfce7; color: #15803d; }
    }
    .lead-card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px dashed var(--border-color);
      padding-top: 8px;
      margin-top: 4px;
    }
    .lead-amount {
      font-size: 0.8rem;
      font-weight: 800;
      color: var(--text-main);
    }
    .btn-micro {
      width: 22px;
      height: 22px;
      border-radius: 4px;
      border: 1px solid var(--border-color);
      background: var(--bg-surface);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.75rem;
      &:hover {
        background: var(--primary);
        color: #fff;
        border-color: var(--primary);
      }
    }
    .follow-up-tag {
      font-size: 0.675rem;
      color: #b91c1c;
      margin-top: 6px;
      font-weight: 600;
    }
    .empty-column-msg {
      text-align: center;
      font-size: 0.75rem;
      color: var(--text-light);
      padding: 20px 0;
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
    .clickable-row {
      cursor: pointer;
      &:hover {
        background: #f8fafc;
      }
    }
    .cell-main {
      font-weight: 600;
    }
    .cell-sub {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .cell-amount {
      font-weight: 700;
    }
    .stage-tag {
      display: inline-block;
      padding: 3px 8px;
      border-radius: var(--radius-full);
      font-size: 0.7rem;
      font-weight: 700;
      &.stage-nouveau { background: #e0f2fe; color: #0369a1; }
      &.stage-contacte { background: #ede9fe; color: #6d28d9; }
      &.stage-visite { background: #fef3c7; color: #b45309; }
      &.stage-devis { background: #fce7f3; color: #be185d; }
      &.stage-negociation { background: #ffedd5; color: #c2410c; }
      &.stage-gagne { background: #dcfce7; color: #15803d; }
      &.stage-perdu { background: #fee2e2; color: #b91c1c; }
    }
    .contact-links {
      display: flex;
      flex-direction: column;
      gap: 2px;
      font-size: 0.75rem;
    }
    .follow-date {
      font-size: 0.8rem;
      color: #b91c1c;
      font-weight: 600;
    }
    .action-buttons {
      display: flex;
      gap: 6px;
    }
    .btn-xs {
      padding: 4px 8px;
      font-size: 0.725rem;
    }
    .btn-success {
      background: var(--success);
      color: #fff;
      border: none;
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
      max-width: 540px;
      background: #fff;
      &.modal-lg { max-width: 860px; max-height: 90vh; overflow-y: auto; }
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 12px;
    }
    .modal-sub {
      font-size: 0.8rem;
      color: var(--text-muted);
    }
    .close-btn {
      background: none;
      border: none;
      font-size: 1.25rem;
      cursor: pointer;
    }
    .stage-progressor {
      margin-bottom: 20px;
      padding: 12px;
      background: #f8fafc;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .stage-lbl {
      font-size: 0.8rem;
      font-weight: 700;
    }
    .stage-buttons {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }
    .stage-step-btn {
      font-size: 0.725rem;
      padding: 4px 8px;
      border: 1px solid var(--border-color);
      border-radius: 4px;
      background: #fff;
      cursor: pointer;
      font-weight: 600;
      &.active {
        background: var(--primary);
        color: #fff;
        border-color: var(--primary);
      }
    }
    .lead-details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      @media (max-width: 768px) {
        grid-template-columns: 1fr;
      }
    }
    .details-section {
      padding: 16px;
      h4 {
        font-size: 0.95rem;
        margin-bottom: 12px;
        border-bottom: 1px solid var(--border-color);
        padding-bottom: 6px;
      }
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px dashed #f1f5f9;
      font-size: 0.825rem;
      .lbl { color: var(--text-muted); }
    }
    .inline-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .section-title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .add-interaction-box {
      margin-bottom: 12px;
      padding: 8px;
      background: #f8fafc;
      border-radius: var(--radius-md);
    }
    .interactions-timeline {
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-height: 280px;
      overflow-y: auto;
    }
    .interaction-item {
      display: flex;
      gap: 10px;
      padding: 8px;
      border-radius: 6px;
      background: #f8fafc;
    }
    .inter-icon {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #fff;
      border: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
    }
    .inter-body {
      flex: 1;
    }
    .inter-note {
      font-size: 0.8rem;
      margin-bottom: 2px;
    }
    .inter-meta {
      font-size: 0.7rem;
      color: var(--text-muted);
    }
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 20px;
      border-top: 1px solid var(--border-color);
      padding-top: 12px;
    }
    .form-row {
      display: flex;
      gap: 12px;
    }
    .flex-1 { flex: 1; }
    .flex-2 { flex: 2; }
  `],
})
export class ProspectListComponent {
  viewMode = signal<'kanban' | 'table'>('kanban');
  searchQuery = '';
  selectedTrade = 'ALL';
  selectedWilaya = 'ALL';
  showNewModal = signal(false);
  selectedLead = signal<LeadItem | null>(null);

  showAddInteraction = signal(false);
  newInteractionType: 'APPEL' | 'WHATSAPP' | 'VISITE' | 'DEVIS' = 'APPEL';
  newInteractionNote = '';

  kanbanColumns: { stage: LeadStage; title: string; color: string }[] = [
    { stage: 'NOUVEAU', title: '1. Nouveau', color: '#0284c7' },
    { stage: 'CONTACTE', title: '2. Contacté', color: '#7c3aed' },
    { stage: 'VISITE', title: '3. Visite / Métré', color: '#d97706' },
    { stage: 'DEVIS', title: '4. Devis Émis', color: '#db2777' },
    { stage: 'NEGOCIATION', title: '5. Négociation', color: '#ea580c' },
    { stage: 'GAGNE', title: '6. Gagné (Marché)', color: '#16a34a' },
    { stage: 'PERDU', title: '7. Perdu', color: '#dc2626' },
  ];

  leads: LeadItem[] = [
    {
      id: 'L-2024-001',
      clientName: 'M. Belkacem Brahimi',
      phone: '0550 11 22 33',
      whatsapp: '0550 11 22 33',
      address: 'Lotissement Les Pins, Chéraga',
      commune: 'Chéraga',
      wilaya: '16 - Alger',
      title: 'Construction Villa R+2 Moderne (Gros Œuvre + Finitions)',
      projectType: 'Construction Neuve',
      trade: 'Gros Œuvre',
      estimatedValue: 14200000,
      stage: 'GAGNE',
      source: 'Recommandation client',
      assignedTo: 'Amine B. (Commercial)',
      date: '12 Sep 2024',
      nextFollowUp: 'Signé — Chantier lancé',
      notes: 'Client sérieux, terrain déjà terrassé avec permis de construire valide.',
      interactions: [
        { date: '14 Sep 2024', type: 'DEVIS', note: 'Devis validé et contrat de marché signé avec acompte 30%', author: 'Amine B.' },
        { date: '10 Sep 2024', type: 'VISITE', note: 'Visite sur site avec géomètre et ingénieur béton', author: 'Ing. Rafik' },
        { date: '05 Sep 2024', type: 'APPEL', note: 'Premier contact suite à recommandation de M. Haddad', author: 'Amine B.' },
      ],
    },
    {
      id: 'L-2024-002',
      clientName: 'SARL Numidia Import',
      phone: '0661 44 55 66',
      whatsapp: '0661 44 55 66',
      address: 'Zone d’activité Bir El Djir',
      commune: 'Bir El Djir',
      wilaya: '31 - Oran',
      title: 'Aménagement Showroom & Bureaux Commerciaux',
      projectType: 'Rénovation & Agencement',
      trade: 'Peinture',
      estimatedValue: 6800000,
      stage: 'NEGOCIATION',
      source: 'Facebook / Instagram BTP',
      assignedTo: 'Amine B.',
      date: '15 Sep 2024',
      nextFollowUp: '26 Sep 2024 (Revue offre remise 5%)',
      notes: 'Demande de rabais sur le lot faux plafond BA13 et luminaires LED.',
      interactions: [
        { date: '20 Sep 2024', type: 'APPEL', note: 'Discussion avec le gérant sur l’acompte et le délai de 45 jours', author: 'Amine B.' },
        { date: '16 Sep 2024', type: 'DEVIS', note: 'Envoi du devis DQE par WhatsApp et email (6.8M DZD)', author: 'Amine B.' },
      ],
    },
    {
      id: 'L-2024-003',
      clientName: 'Dr. Sid Ahmed Khelil',
      phone: '0770 88 99 00',
      whatsapp: '0770 88 99 00',
      address: 'Rue Didouche Mourad',
      commune: 'Alger Centre',
      wilaya: '16 - Alger',
      title: 'Rénovation Complète Cabinet Médical (Climatisation + Sanitaire)',
      projectType: 'Rénovation Spécifique',
      trade: 'Climatisation',
      estimatedValue: 4200000,
      stage: 'DEVIS',
      source: 'Bouche-à-oreille',
      assignedTo: 'Kader (Technico-commercial)',
      date: '18 Sep 2024',
      nextFollowUp: '25 Sep 2024 (Présentation devis)',
      notes: 'Nécessite climatisation réversible gainable ultra-silencieuse.',
      interactions: [
        { date: '19 Sep 2024', type: 'VISITE', note: 'Relevé des côtes et tracé des gaines HVAC sur site', author: 'Kader' },
      ],
    },
    {
      id: 'L-2024-004',
      clientName: 'M. Youcef Belhadj',
      phone: '0555 77 88 99',
      whatsapp: '0555 77 88 99',
      address: 'Route Nationale 5, Bordj Bou Arreridj',
      commune: 'BBA',
      wilaya: '19 - Sétif',
      title: 'Installation Système Électrique & Solaire Photovoltaïque',
      projectType: 'Énergie Renouvelable',
      trade: 'Électricité',
      estimatedValue: 5600000,
      stage: 'VISITE',
      source: 'Chantier Voisin',
      assignedTo: 'Ing. Sofiane B.',
      date: '21 Sep 2024',
      nextFollowUp: 'Demain 10:00 (Métré toiture)',
      notes: 'Souhaite 15 kWc pour réduire facture Sonelgaz atelier.',
      interactions: [
        { date: '21 Sep 2024', type: 'WHATSAPP', note: 'Envoi des fiches techniques des onduleurs hybrides', author: 'Sofiane' },
      ],
    },
    {
      id: 'L-2024-005',
      clientName: 'Mme. Fatma Zohra B.',
      phone: '0699 33 22 11',
      whatsapp: '0699 33 22 11',
      address: 'Résidence El Bassatine',
      commune: 'Blida',
      wilaya: '09 - Blida',
      title: 'Revêtement Sol Porcelaine 60x120 & Faïence Cuisine',
      projectType: 'Finitions Résidentielles',
      trade: 'Revêtement',
      estimatedValue: 1850000,
      stage: 'CONTACTE',
      source: 'Ouedkniss',
      assignedTo: 'Amine B.',
      date: '22 Sep 2024',
      nextFollowUp: '26 Sep 2024 (Rappel confirmation rdv)',
      notes: 'Client a déjà acheté le carrelage d’Espagne, pose seule demandée.',
      interactions: [
        { date: '22 Sep 2024', type: 'APPEL', note: 'Appel téléphonique de qualification des besoins', author: 'Amine B.' },
      ],
    },
    {
      id: 'L-2024-006',
      clientName: 'Promotion Immobilière Al-Manar',
      phone: '0560 99 88 77',
      whatsapp: '0560 99 88 77',
      address: 'Zone USTO',
      commune: 'Oran',
      wilaya: '31 - Oran',
      title: 'Lot Menuiserie Aluminium Double Vitrage (32 Appartements)',
      projectType: 'Promotion Immobilière',
      trade: 'Menuiserie',
      estimatedValue: 24000000,
      stage: 'NOUVEAU',
      source: 'Appel Direct',
      assignedTo: 'Directeur Général',
      date: 'Aujourd’hui',
      nextFollowUp: 'Aujourd’hui 16:00 (Prise de contact)',
      notes: 'Cahier des charges envoyé par email. Profilé TPR exigé.',
      interactions: [],
    },
    {
      id: 'L-2024-007',
      clientName: 'M. Salim Mansouri',
      phone: '0552 00 11 22',
      whatsapp: '0552 00 11 22',
      address: 'Bouzaréah',
      commune: 'Bouzaréah',
      wilaya: '16 - Alger',
      title: 'Plomberie Chauffage au Sol Villa 300m²',
      projectType: 'Maison Individuelle',
      trade: 'Plomberie',
      estimatedValue: 2800000,
      stage: 'PERDU',
      source: 'Facebook / Instagram BTP',
      assignedTo: 'Amine B.',
      date: '02 Sep 2024',
      nextFollowUp: 'Classé sans suite',
      notes: 'A choisi un artisan non déclaré avec prix 40% inférieur sans garantie décennale.',
      interactions: [
        { date: '08 Sep 2024', type: 'APPEL', note: 'Retour négatif pour écart tarifaire.', author: 'Amine B.' },
      ],
    },
  ];

  newLead = {
    clientName: '',
    phone: '',
    whatsapp: '',
    title: '',
    trade: 'Gros Œuvre',
    estimatedValue: 2500000,
    wilaya: '16 - Alger',
    commune: '',
    source: 'Recommandation',
    nextFollowUp: '',
  };

  filteredLeads(): LeadItem[] {
    return this.leads.filter((l) => {
      const matchTrade = this.selectedTrade === 'ALL' || l.trade.toLowerCase().includes(this.selectedTrade.toLowerCase());
      const matchWilaya = this.selectedWilaya === 'ALL' || l.wilaya === this.selectedWilaya;
      const q = this.searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        l.clientName.toLowerCase().includes(q) ||
        l.title.toLowerCase().includes(q) ||
        l.phone.includes(q) ||
        l.commune.toLowerCase().includes(q);
      return matchTrade && matchWilaya && matchSearch;
    });
  }

  getLeadsForStage(stage: LeadStage): LeadItem[] {
    return this.filteredLeads().filter((l) => l.stage === stage);
  }

  getStageSum(stage: LeadStage): number {
    return this.getLeadsForStage(stage).reduce((acc, curr) => acc + curr.estimatedValue, 0);
  }

  totalPipelineAmount(): number {
    return this.filteredLeads().reduce((acc, curr) => acc + curr.estimatedValue, 0);
  }

  advanceStage(lead: LeadItem): void {
    const order: LeadStage[] = ['NOUVEAU', 'CONTACTE', 'VISITE', 'DEVIS', 'NEGOCIATION', 'GAGNE'];
    const idx = order.indexOf(lead.stage);
    if (idx >= 0 && idx < order.length - 1) {
      lead.stage = order[idx + 1];
    }
  }

  changeSelectedLeadStage(stage: LeadStage): void {
    if (this.selectedLead()) {
      this.selectedLead()!.stage = stage;
    }
  }

  openLeadDetails(lead: LeadItem): void {
    this.selectedLead.set(lead);
    this.showAddInteraction.set(false);
  }

  closeDetails(): void {
    this.selectedLead.set(null);
  }

  saveInteraction(): void {
    if (!this.newInteractionNote.trim() || !this.selectedLead()) return;
    this.selectedLead()!.interactions.unshift({
      date: 'Aujourd’hui',
      type: this.newInteractionType,
      note: this.newInteractionNote,
      author: 'Amine B. (Vous)',
    });
    this.newInteractionNote = '';
    this.showAddInteraction.set(false);
  }

  saveNewLead(): void {
    if (!this.newLead.clientName || !this.newLead.title) return;
    const item: LeadItem = {
      id: 'L-2024-00' + (this.leads.length + 1),
      clientName: this.newLead.clientName,
      phone: this.newLead.phone,
      whatsapp: this.newLead.whatsapp || this.newLead.phone,
      address: 'Algérie',
      commune: this.newLead.commune || 'Centre',
      wilaya: this.newLead.wilaya,
      title: this.newLead.title,
      projectType: 'Travaux BTP',
      trade: this.newLead.trade,
      estimatedValue: this.newLead.estimatedValue || 0,
      stage: 'NOUVEAU',
      source: this.newLead.source,
      assignedTo: 'Amine B.',
      date: 'Aujourd’hui',
      nextFollowUp: this.newLead.nextFollowUp || 'À planifier',
      notes: '',
      interactions: [
        { date: 'Aujourd’hui', type: 'APPEL', note: 'Création du lead dans le CRM', author: 'Amine B.' },
      ],
    };
    this.leads.unshift(item);
    this.showNewModal.set(false);
    this.newLead = {
      clientName: '',
      phone: '',
      whatsapp: '',
      title: '',
      trade: 'Gros Œuvre',
      estimatedValue: 2500000,
      wilaya: '16 - Alger',
      commune: '',
      source: 'Recommandation',
      nextFollowUp: '',
    };
  }

  getStageLabel(stage: LeadStage): string {
    switch (stage) {
      case 'NOUVEAU': return '1. Nouveau';
      case 'CONTACTE': return '2. Contacté';
      case 'VISITE': return '3. Visite / Métré';
      case 'DEVIS': return '4. Devis Émis';
      case 'NEGOCIATION': return '5. Négociation';
      case 'GAGNE': return '6. Marché Gagné';
      case 'PERDU': return '7. Perdu';
    }
  }

  getStageClass(stage: LeadStage): string {
    return 'stage-' + stage.toLowerCase();
  }
}
