import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

export interface QuoteLine {
  designation: string;
  unit: 'm²' | 'ml' | 'm³' | 'kg' | 'u' | 'forfait' | 'j';
  quantity: number;
  unitPrice: number;
}

export type QuoteStatus = 'BROUILLON' | 'ENVOYE' | 'NEGOCIATION' | 'ACCEPTE' | 'REFUSE' | 'EXPIRE';

export interface QuoteData {
  id: string;
  quoteNumber: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  projectTitle: string;
  wilaya: string;
  commune: string;
  date: string;
  validityDays: number;
  status: QuoteStatus;
  items: QuoteLine[];
  discountPercent: number; // Remise %
  tvaRate: number; // 0, 9 or 19%
  depositPercent: number; // Acompte %
  notes: string;
}

@Component({
  selector: 'app-quote-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="quotes-page">
      <!-- HEADER -->
      <div class="page-header">
        <div>
          <h2>Devis Quantitatifs & Estimatifs BTP (DQE)</h2>
          <p class="page-subtitle">Élaborez vos bordereaux de prix unitaires, métrés et offres financières professionnelles</p>
        </div>
        <button class="btn btn-primary" (click)="openNewQuoteModal()">
          + Créer un Devis BTP
        </button>
      </div>

      <!-- KPI METRICS -->
      <div class="quotes-kpi-grid">
        <div class="kpi-card card">
          <span class="kpi-label">Devis émis ce mois</span>
          <span class="kpi-val">{{ quotes.length }}</span>
          <span class="kpi-sub">Total: {{ totalQuotesAmount() | number }} DZD</span>
        </div>
        <div class="kpi-card card">
          <span class="kpi-label">En négociation</span>
          <span class="kpi-val text-warning">{{ getCountByStatus('NEGOCIATION') }}</span>
          <span class="kpi-sub">{{ getAmountByStatus('NEGOCIATION') | number }} DZD</span>
        </div>
        <div class="kpi-card card">
          <span class="kpi-label">Devis Acceptés / Signés</span>
          <span class="kpi-val text-success">{{ getCountByStatus('ACCEPTE') }}</span>
          <span class="kpi-sub">{{ getAmountByStatus('ACCEPTE') | number }} DZD</span>
        </div>
        <div class="kpi-card card">
          <span class="kpi-label">Taux d'acceptation</span>
          <span class="kpi-val text-primary">68.4%</span>
          <span class="kpi-sub">Objectif trimestriel atteint</span>
        </div>
      </div>

      <!-- FILTERS -->
      <div class="filters-card card">
        <div class="search-box">
          <input
            type="text"
            [(ngModel)]="searchQuery"
            placeholder="Rechercher par N° devis, nom client ou projet..."
          />
        </div>
        <div class="filter-group">
          <label>Statut :</label>
          <select [(ngModel)]="filterStatus">
            <option value="ALL">Tous les statuts</option>
            <option value="BROUILLON">Brouillon</option>
            <option value="ENVOYE">Envoyé</option>
            <option value="NEGOCIATION">En Négociation</option>
            <option value="ACCEPTE">Accepté / Gagné</option>
            <option value="REFUSE">Refusé</option>
            <option value="EXPIRE">Expiré</option>
          </select>
        </div>
      </div>

      <!-- QUOTES TABLE -->
      <div class="card table-card">
        <div class="table-responsive">
          <table class="btp-table">
            <thead>
              <tr>
                <th>N° Devis & Date</th>
                <th>Client & Projet</th>
                <th>Wilaya</th>
                <th>Montant Net HT</th>
                <th>Total TTC (DZD)</th>
                <th>Acompte</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let q of filteredQuotes()">
                <td>
                  <div class="cell-main font-bold">{{ q.quoteNumber }}</div>
                  <div class="cell-sub">Date: {{ q.date }} • Validité: {{ q.validityDays }}j</div>
                </td>
                <td>
                  <div class="cell-main">{{ q.projectTitle }}</div>
                  <div class="cell-sub">👤 {{ q.clientName }} • 📞 {{ q.clientPhone }}</div>
                </td>
                <td><span class="wilaya-tag">{{ q.wilaya }}</span></td>
                <td>
                  <div class="cell-main">{{ computeNetHt(q) | number }} DZD</div>
                  <div *ngIf="q.discountPercent > 0" class="cell-sub text-warning">Remise -{{ q.discountPercent }}%</div>
                </td>
                <td>
                  <div class="cell-amount text-primary">{{ computeTotalTTC(q) | number }} DZD</div>
                  <div class="cell-sub">{{ q.tvaRate > 0 ? 'TVA ' + q.tvaRate + '%' : 'Exonéré TVA' }}</div>
                </td>
                <td>
                  <div class="cell-sub font-bold">{{ (computeTotalTTC(q) * (q.depositPercent / 100)) | number }} DZD</div>
                  <div class="cell-sub text-muted">({{ q.depositPercent }}%)</div>
                </td>
                <td>
                  <span class="status-badge" [ngClass]="getStatusBadge(q.status)">
                    {{ getStatusLabel(q.status) }}
                  </span>
                </td>
                <td>
                  <div class="action-buttons">
                    <button class="btn btn-primary btn-xs" (click)="openPdfPreview(q)" title="Générer & Prévisualiser le PDF">
                      📄 PDF
                    </button>
                    <button
                      class="btn btn-success btn-xs"
                      (click)="sendViaWhatsApp(q)"
                      title="Envoyer par WhatsApp direct"
                    >
                      💬 WhatsApp
                    </button>
                    <button class="btn btn-outline btn-xs" (click)="editQuote(q)" title="Modifier">
                      ✏️
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- MODAL PREVIEW PDF OFFICIEL BTP -->
      <div *ngIf="previewQuote()" class="modal-backdrop" (click)="closePdfPreview()">
        <div class="modal-box pdf-modal card" (click)="$event.stopPropagation()">
          <div class="pdf-modal-header">
            <div class="pdf-actions-bar">
              <span class="pdf-tag">Aperçu Devis Officiel PDF</span>
              <div class="pdf-btns">
                <button class="btn btn-outline btn-sm" (click)="printDocument()">🖨️ Imprimer</button>
                <button class="btn btn-success btn-sm" (click)="sendViaWhatsApp(previewQuote()!)">💬 Envoyer sur WhatsApp</button>
                <button class="btn btn-primary btn-sm" (click)="downloadPdfMock()">📥 Télécharger PDF</button>
                <button class="close-btn" (click)="closePdfPreview()">✕</button>
              </div>
            </div>
          </div>

          <!-- FEUILLE DE DEVIS FORMAT A4 -->
          <div class="a4-sheet" id="printable-quote">
            <div class="sheet-header">
              <div class="company-brand-box">
                <div class="company-logo-txt">BTP</div>
                <div>
                  <h2 class="company-name-sheet">SARL BTP EL-BINAA ALGÉRIE</h2>
                  <p class="company-legal">Entreprise Générale de Bâtiment, Travaux Publics & Hydraulique</p>
                  <p class="company-tax-ids">
                    NIF: 001616098765432 • NIS: 160012345 • RC: 16/00-0987654B • Art. Imposition: 16010045678
                  </p>
                  <p class="company-coords">
                    📍 Cité 1200 Logements, Chéraga, Alger • 📞 0550 12 34 56 • ✉️ contact@btp-algerie.dz
                  </p>
                </div>
              </div>
              <div class="quote-header-box">
                <div class="quote-sheet-title">DEVIS ESTIMATIF</div>
                <div class="quote-number-sheet">{{ previewQuote()?.quoteNumber }}</div>
                <div class="quote-date-sheet">Date : <strong>{{ previewQuote()?.date }}</strong></div>
                <div class="quote-validity-sheet">Validité de l'offre : <strong>{{ previewQuote()?.validityDays }} jours</strong></div>
              </div>
            </div>

            <!-- CLIENT BOX -->
            <div class="client-sheet-box">
              <div class="client-label">Maître d'Ouvrage / Client :</div>
              <h3 class="client-name-sheet">{{ previewQuote()?.clientName }}</h3>
              <p>📍 Adresse Chantier : {{ previewQuote()?.commune }}, {{ previewQuote()?.wilaya }}</p>
              <p>📞 Contact Téléphone : {{ previewQuote()?.clientPhone }}</p>
              <p>🏗️ Objet du Marché : <strong>{{ previewQuote()?.projectTitle }}</strong></p>
            </div>

            <!-- DQE TABLE -->
            <table class="sheet-dqe-table">
              <thead>
                <tr>
                  <th style="width: 5%;">N°</th>
                  <th style="width: 48%;">Désignation des Travaux & Matériaux</th>
                  <th style="width: 10%;">Unité</th>
                  <th style="width: 12%;">Quantité</th>
                  <th style="width: 12%;">Prix Unitaire</th>
                  <th style="width: 13%;">Total HT (DZD)</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of previewQuote()?.items; let idx = index">
                  <td class="text-center">{{ idx + 1 }}</td>
                  <td><strong>{{ item.designation }}</strong></td>
                  <td class="text-center">{{ item.unit }}</td>
                  <td class="text-center">{{ item.quantity }}</td>
                  <td class="text-right">{{ item.unitPrice | number }}</td>
                  <td class="text-right font-bold">{{ (item.quantity * item.unitPrice) | number }}</td>
                </tr>
              </tbody>
            </table>

            <!-- TOTALS & TAXES CALCULATION -->
            <div class="sheet-financial-recap">
              <div class="payment-terms-box">
                <h4>Conditions de Règlement :</h4>
                <p>• Acompte exigé à la signature : <strong>{{ previewQuote()?.depositPercent }}%</strong> (soit <strong>{{ (computeTotalTTC(previewQuote()!) * (previewQuote()!.depositPercent / 100)) | number }} DZD</strong>)</p>
                <p>• Règlement du solde : Par situations de travaux mensuelles validées par attachements contradictoires.</p>
                <p>• Mode de règlement : Chèque barré non endossable ou Virement bancaire.</p>
                <p>• Garantie : Garantie décennale BTP selon Code Civil Algérien.</p>
              </div>

              <div class="totals-calculation-box">
                <div class="sheet-calc-row">
                  <span>Montant Brut HT :</span>
                  <span>{{ computeGrossHt(previewQuote()!) | number }} DZD</span>
                </div>
                <div *ngIf="previewQuote()!.discountPercent > 0" class="sheet-calc-row text-warning">
                  <span>Remise Commerciale ({{ previewQuote()?.discountPercent }}%) :</span>
                  <span>-{{ computeDiscountAmount(previewQuote()!) | number }} DZD</span>
                </div>
                <div class="sheet-calc-row font-bold">
                  <span>Montant Net HT :</span>
                  <span>{{ computeNetHt(previewQuote()!) | number }} DZD</span>
                </div>
                <div class="sheet-calc-row">
                  <span>TVA légale ({{ previewQuote()?.tvaRate }}%) :</span>
                  <span>{{ computeTvaAmount(previewQuote()!) | number }} DZD</span>
                </div>
                <div class="sheet-calc-row total-highlight">
                  <span>TOTAL GÉNÉRAL TTC :</span>
                  <span>{{ computeTotalTTC(previewQuote()!) | number }} DZD</span>
                </div>
              </div>
            </div>

            <!-- STAMP & SIGNATURE FOOTER -->
            <div class="sheet-signature-area">
              <div class="sig-col">
                <p><strong>Pour le Client (Bon pour Accord) :</strong></p>
                <span class="sig-note">Date et signature précédées de la mention "Lu et approuvé"</span>
                <div class="sig-box"></div>
              </div>
              <div class="sig-col right">
                <p><strong>Pour l'Entreprise SARL BTP EL-BINAA :</strong></p>
                <span class="sig-note">Le Gérant / Conducteur de Travaux</span>
                <div class="cachet-box">
                  <div class="cachet-stamp">
                    <span>SARL BTP EL-BINAA</span>
                    <span>RC 16/00-0987654B</span>
                    <span>CACHET ET SIGNATURE</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- MODAL CREATE / EDIT QUOTE -->
      <div *ngIf="showModal()" class="modal-backdrop">
        <div class="modal-box card large-modal">
          <div class="modal-header">
            <h3>{{ editingQuote?.id ? 'Modifier Devis ' + editingQuote?.quoteNumber : 'Nouveau Devis BTP (DQE)' }}</h3>
            <button class="close-btn" (click)="showModal.set(false)">✕</button>
          </div>

          <div class="modal-body" *ngIf="currentForm">
            <!-- GENERAL INFO -->
            <div class="form-row">
              <div class="form-group flex-1">
                <label>Nom du Client *</label>
                <input type="text" [(ngModel)]="currentForm.clientName" placeholder="M. Hichem Berrabah" />
              </div>
              <div class="form-group flex-1">
                <label>Téléphone Client *</label>
                <input type="text" [(ngModel)]="currentForm.clientPhone" placeholder="0550 12 34 56" />
              </div>
              <div class="form-group flex-1">
                <label>Wilaya du Chantier *</label>
                <select [(ngModel)]="currentForm.wilaya">
                  <option value="16 - Alger">16 - Alger</option>
                  <option value="31 - Oran">31 - Oran</option>
                  <option value="25 - Constantine">25 - Constantine</option>
                  <option value="19 - Sétif">19 - Sétif</option>
                  <option value="09 - Blida">09 - Blida</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group flex-2">
                <label>Titre / Objet des Travaux *</label>
                <input type="text" [(ngModel)]="currentForm.projectTitle" placeholder="Ex: Travaux de gros œuvre et maçonnerie villa R+2" />
              </div>
              <div class="form-group flex-1">
                <label>Commune</label>
                <input type="text" [(ngModel)]="currentForm.commune" placeholder="Chéraga, Hydra..." />
              </div>
              <div class="form-group flex-1">
                <label>Validité</label>
                <select [(ngModel)]="currentForm.validityDays">
                  <option [ngValue]="30">30 jours</option>
                  <option [ngValue]="60">60 jours</option>
                  <option [ngValue]="90">90 jours</option>
                </select>
              </div>
              <div class="form-group flex-1">
                <label>Statut</label>
                <select [(ngModel)]="currentForm.status">
                  <option value="BROUILLON">Brouillon</option>
                  <option value="ENVOYE">Envoyé au client</option>
                  <option value="NEGOCIATION">En Négociation</option>
                  <option value="ACCEPTE">Accepté / Gagné</option>
                  <option value="REFUSE">Refusé</option>
                  <option value="EXPIRE">Expiré</option>
                </select>
              </div>
            </div>

            <!-- BORDEREAU DE PRIX / ITEMS TABLE -->
            <div class="items-section">
              <div class="section-sub-header">
                <h4>Prestations, Matériaux & Bordereau des Prix Unitaires</h4>
                <button type="button" class="btn btn-outline btn-xs" (click)="addItemLine()">+ Ajouter une Prestation</button>
              </div>

              <table class="items-table">
                <thead>
                  <tr>
                    <th style="width: 45%;">Désignation des Prestations & Matériaux</th>
                    <th style="width: 12%;">Unité</th>
                    <th style="width: 13%;">Quantité</th>
                    <th style="width: 15%;">Prix Unitaire (DZD)</th>
                    <th style="width: 15%;">Total HT</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let item of currentForm.items; let i = index">
                    <td>
                      <input type="text" [(ngModel)]="item.designation" placeholder="Ex: Fourniture et pose béton B25 dosé 350kg/m³" />
                    </td>
                    <td>
                      <select [(ngModel)]="item.unit">
                        <option value="m²">m²</option>
                        <option value="ml">ml</option>
                        <option value="m³">m³</option>
                        <option value="kg">kg</option>
                        <option value="u">u</option>
                        <option value="forfait">forfait</option>
                        <option value="j">j</option>
                      </select>
                    </td>
                    <td>
                      <input type="number" [(ngModel)]="item.quantity" min="1" />
                    </td>
                    <td>
                      <input type="number" [(ngModel)]="item.unitPrice" step="100" />
                    </td>
                    <td class="line-total font-bold">
                      {{ (item.quantity * item.unitPrice) | number }} DZD
                    </td>
                    <td>
                      <button class="remove-btn" (click)="removeItemLine(i)">✕</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- REMISE, TVA & ACOMPTE SETTINGS -->
            <div class="totals-bar">
              <div class="commercial-inputs">
                <div class="c-input-group">
                  <label>Remise Commerciale (%) :</label>
                  <input type="number" [(ngModel)]="currentForm.discountPercent" min="0" max="50" style="width: 80px;" />
                </div>
                <div class="c-input-group">
                  <label>Taux de TVA Algérie :</label>
                  <select [(ngModel)]="currentForm.tvaRate">
                    <option [ngValue]="19">19% (Taux Normal Travaux)</option>
                    <option [ngValue]="9">9% (Taux Réduit Bâtiment)</option>
                    <option [ngValue]="0">0% (Exonéré / Conventionné)</option>
                  </select>
                </div>
                <div class="c-input-group">
                  <label>Acompte Exigé (%) :</label>
                  <input type="number" [(ngModel)]="currentForm.depositPercent" min="0" max="100" style="width: 80px;" />
                </div>
              </div>

              <div class="calculation-summary">
                <div class="calc-row">
                  <span>Total Brut HT :</span>
                  <span>{{ computeFormGrossSubtotal() | number }} DZD</span>
                </div>
                <div class="calc-row" *ngIf="currentForm.discountPercent > 0">
                  <span class="text-warning">Remise ({{ currentForm.discountPercent }}%) :</span>
                  <span class="text-warning">-{{ computeFormDiscount() | number }} DZD</span>
                </div>
                <div class="calc-row font-bold">
                  <span>Net HT :</span>
                  <span>{{ computeFormNetSubtotal() | number }} DZD</span>
                </div>
                <div class="calc-row">
                  <span>TVA ({{ currentForm.tvaRate }}%) :</span>
                  <span>{{ computeFormTva() | number }} DZD</span>
                </div>
                <div class="calc-row total-ttc-row">
                  <span>TOTAL TTC :</span>
                  <span class="grand-total">{{ computeFormTTC() | number }} DZD</span>
                </div>
                <div class="calc-row acompte-row">
                  <span>Acompte à la commande ({{ currentForm.depositPercent }}%) :</span>
                  <span class="text-primary font-bold">{{ (computeFormTTC() * (currentForm.depositPercent / 100)) | number }} DZD</span>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-outline" (click)="showModal.set(false)">Annuler</button>
            <button class="btn btn-primary" (click)="saveQuote()">Enregistrer le Devis</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .quotes-page {
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
    .quotes-kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
    }
    .kpi-card {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .kpi-label {
      font-size: 0.775rem;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
    }
    .kpi-val {
      font-size: 1.5rem;
      font-weight: 800;
      font-family: var(--font-display);
    }
    .kpi-sub {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .filters-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 12px 18px;
    }
    .search-box {
      flex: 1;
      input {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        font-size: 0.85rem;
      }
    }
    .filter-group {
      display: flex;
      align-items: center;
      gap: 8px;
      label { font-size: 0.8rem; font-weight: 600; color: var(--text-muted); }
      select { padding: 6px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-size: 0.825rem; }
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
    .cell-main { font-weight: 600; }
    .cell-sub { font-size: 0.75rem; color: var(--text-muted); margin-top: 2px; }
    .cell-amount { font-weight: 700; }
    .wilaya-tag {
      font-size: 0.75rem;
      background: #f1f5f9;
      padding: 2px 6px;
      border-radius: var(--radius-sm);
    }
    .status-badge {
      font-size: 0.7rem;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: var(--radius-full);
      &.st-brouillon { background: #f1f5f9; color: #475569; }
      &.st-envoye { background: #e0f2fe; color: #0369a1; }
      &.st-negociation { background: #fef3c7; color: #b45309; }
      &.st-accepte { background: #dcfce7; color: #15803d; }
      &.st-refuse { background: #fee2e2; color: #b91c1c; }
      &.st-expire { background: #f3f4f6; color: #9ca3af; }
    }
    .action-buttons {
      display: flex;
      gap: 6px;
    }
    .btn-xs {
      padding: 4px 8px;
      font-size: 0.725rem;
    }
    .btn-success { background: var(--success); color: #fff; border: none; }
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100;
      padding: 20px;
    }
    .large-modal {
      width: 100%;
      max-width: 960px;
      max-height: 90vh;
      overflow-y: auto;
    }
    .pdf-modal {
      width: 100%;
      max-width: 900px;
      max-height: 95vh;
      overflow-y: auto;
      background: #e2e8f0;
      padding: 0;
    }
    .pdf-modal-header {
      background: #1e293b;
      padding: 12px 20px;
      position: sticky;
      top: 0;
      z-index: 20;
    }
    .pdf-actions-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: #fff;
    }
    .pdf-tag { font-size: 0.85rem; font-weight: 700; color: var(--primary); }
    .pdf-btns { display: flex; align-items: center; gap: 10px; }
    .a4-sheet {
      background: #ffffff;
      width: 100%;
      max-width: 800px;
      margin: 20px auto;
      padding: 40px;
      box-shadow: 0 4px 14px rgba(0,0,0,0.15);
      font-family: 'Inter', sans-serif;
      color: #1e293b;
    }
    .sheet-header {
      display: flex;
      justify-content: space-between;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 20px;
      margin-bottom: 24px;
    }
    .company-brand-box {
      display: flex;
      gap: 16px;
    }
    .company-logo-txt {
      width: 54px;
      height: 54px;
      background: #0f172a;
      color: var(--primary);
      font-size: 1.25rem;
      font-weight: 900;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
    }
    .company-name-sheet { font-size: 1.15rem; font-weight: 900; margin: 0; }
    .company-legal { font-size: 0.775rem; color: #64748b; font-weight: 600; }
    .company-tax-ids { font-size: 0.725rem; color: #475569; margin-top: 4px; }
    .company-coords { font-size: 0.725rem; color: #64748b; }
    .quote-header-box { text-align: right; }
    .quote-sheet-title { font-size: 1.2rem; font-weight: 900; color: var(--primary); }
    .quote-number-sheet { font-size: 1.1rem; font-weight: 800; }
    .quote-date-sheet, .quote-validity-sheet { font-size: 0.75rem; color: #475569; margin-top: 2px; }
    .client-sheet-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 16px;
      margin-bottom: 24px;
      font-size: 0.85rem;
    }
    .client-label { font-size: 0.7rem; text-transform: uppercase; font-weight: 700; color: #64748b; }
    .client-name-sheet { font-size: 1.1rem; font-weight: 800; margin: 4px 0 8px; }
    .sheet-dqe-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.825rem;
      margin-bottom: 24px;
      th {
        background: #0f172a;
        color: #fff;
        padding: 8px 10px;
        font-weight: 600;
        text-align: left;
      }
      td {
        border-bottom: 1px solid #e2e8f0;
        padding: 8px 10px;
      }
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .sheet-financial-recap {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 20px;
      margin-bottom: 30px;
    }
    .payment-terms-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 14px;
      border-radius: 6px;
      font-size: 0.775rem;
      h4 { font-size: 0.825rem; margin-bottom: 8px; }
      p { margin-bottom: 4px; }
    }
    .totals-calculation-box {
      display: flex;
      flex-direction: column;
      gap: 6px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 14px;
      border-radius: 6px;
      font-size: 0.85rem;
    }
    .sheet-calc-row {
      display: flex;
      justify-content: space-between;
      &.total-highlight {
        border-top: 2px solid #0f172a;
        padding-top: 8px;
        margin-top: 4px;
        font-size: 1.05rem;
        font-weight: 900;
        color: var(--primary);
      }
    }
    .sheet-signature-area {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      padding-top: 16px;
      border-top: 1px dashed #cbd5e1;
      font-size: 0.8rem;
    }
    .sig-note { font-size: 0.7rem; color: #94a3b8; display: block; margin-top: 2px; }
    .sig-box { height: 90px; border: 1px dashed #cbd5e1; margin-top: 8px; border-radius: 4px; }
    .cachet-box {
      height: 90px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 8px;
    }
    .cachet-stamp {
      border: 2px dashed #2563eb;
      color: #2563eb;
      padding: 10px;
      border-radius: 8px;
      transform: rotate(-4deg);
      text-align: center;
      display: flex;
      flex-direction: column;
      font-size: 0.7rem;
      font-weight: 800;
    }
    .close-btn { background: none; border: none; font-size: 1.2rem; cursor: pointer; color: #fff; }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 12px;
      .close-btn { color: #334155; }
    }
    .items-section { margin: 20px 0; }
    .section-sub-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      h4 { font-size: 0.95rem; }
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      th { text-align: left; font-size: 0.75rem; color: var(--text-muted); padding: 8px; }
      td { padding: 6px; }
      input, select {
        width: 100%;
        padding: 6px 10px;
        border: 1px solid var(--border-color);
        border-radius: 4px;
        font-size: 0.85rem;
      }
    }
    .remove-btn {
      background: none;
      border: none;
      color: var(--danger);
      font-size: 1rem;
      cursor: pointer;
    }
    .totals-bar {
      display: flex;
      justify-content: space-between;
      gap: 20px;
      padding-top: 16px;
      border-top: 1px solid var(--border-color);
      flex-wrap: wrap;
    }
    .commercial-inputs {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .c-input-group {
      display: flex;
      align-items: center;
      gap: 10px;
      label { font-size: 0.8rem; font-weight: 600; color: #334155; }
      input, select { padding: 6px 10px; border: 1px solid var(--border-color); border-radius: 4px; font-size: 0.85rem; }
    }
    .calculation-summary {
      width: 320px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      background: #f8fafc;
      padding: 14px;
      border-radius: 6px;
      font-size: 0.85rem;
    }
    .calc-row {
      display: flex;
      justify-content: space-between;
      &.total-ttc-row {
        border-top: 1px solid #cbd5e1;
        padding-top: 6px;
        font-weight: 800;
        font-size: 1rem;
        color: var(--primary);
      }
      &.acompte-row {
        font-size: 0.8rem;
        margin-top: 2px;
      }
    }
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 20px;
      border-top: 1px solid var(--border-color);
      padding-top: 14px;
    }
    .form-row { display: flex; gap: 12px; }
    .flex-1 { flex: 1; }
    .flex-2 { flex: 2; }
  `],
})
export class QuoteListComponent {
  searchQuery = '';
  filterStatus = 'ALL';
  showModal = signal<boolean>(false);
  previewQuote = signal<QuoteData | null>(null);

  editingQuote: QuoteData | null = null;
  currentForm: QuoteData | null = null;

  quotes: QuoteData[] = [
    {
      id: 'dev-1',
      quoteNumber: 'DEV-2024-001',
      clientName: 'M. Belkacem Brahimi',
      clientPhone: '0550 11 22 33',
      clientEmail: 'b.brahimi@gmail.com',
      projectTitle: 'Construction Villa R+2 Moderne (Chéraga)',
      wilaya: '16 - Alger',
      commune: 'Chéraga',
      date: '08 Aoû 2024',
      validityDays: 60,
      status: 'ACCEPTE',
      discountPercent: 0,
      tvaRate: 19,
      depositPercent: 30,
      notes: 'Terrassement compris. Coulage béton dosé à 350kg/m³.',
      items: [
        { designation: 'Terrassement en pleine masse et évacuation des déblais', unit: 'm³', quantity: 240, unitPrice: 1200 },
        { designation: 'Gros béton de propreté dosé à 150 kg/m³', unit: 'm³', quantity: 25, unitPrice: 9500 },
        { designation: 'Béton armé en fondation (Semelles isolées & filantes)', unit: 'm³', quantity: 65, unitPrice: 22000 },
        { designation: 'Poteaux et poutres en béton armé B25', unit: 'm³', quantity: 48, unitPrice: 28000 },
        { designation: 'Plancher corps creux 16+4 pour 2 dalles', unit: 'm²', quantity: 380, unitPrice: 5500 },
        { designation: 'Maçonnerie briques creuses 10 et 15 trous', unit: 'm²', quantity: 620, unitPrice: 2200 },
      ],
    },
    {
      id: 'dev-2',
      quoteNumber: 'DEV-2024-019',
      clientName: 'SARL Numidia Import',
      clientPhone: '0661 44 55 66',
      clientEmail: 'direction@numidia-dz.com',
      projectTitle: 'Aménagement Showroom & Bureaux Commerciaux',
      wilaya: '31 - Oran',
      commune: 'Bir El Djir',
      date: '12 Aoû 2024',
      validityDays: 30,
      status: 'NEGOCIATION',
      discountPercent: 5,
      tvaRate: 19,
      depositPercent: 40,
      notes: 'Faux-plafonds démontables avec dalles 60x60 et éclairage LED.',
      items: [
        { designation: 'Faux-plafond BA13 plâtre acoustique hydrofuge', unit: 'm²', quantity: 320, unitPrice: 3200 },
        { designation: 'Revêtement sol grès cérame poli 60x60 grand passage', unit: 'm²', quantity: 280, unitPrice: 4800 },
        { designation: 'Cloisons modulaires vitrées avec profilés alu noir mat', unit: 'ml', quantity: 45, unitPrice: 18000 },
        { designation: 'Installation réseau électrique & coffret tertiaire', unit: 'forfait', quantity: 1, unitPrice: 850000 },
      ],
    },
    {
      id: 'dev-3',
      quoteNumber: 'DEV-2024-035',
      clientName: 'Dr. Sid Ahmed Khelil',
      clientPhone: '0770 88 99 00',
      projectTitle: 'Rénovation & Climatisation VRV Cabinet Médical',
      wilaya: '16 - Alger',
      commune: 'Alger Centre',
      date: '20 Sep 2024',
      validityDays: 30,
      status: 'ENVOYE',
      discountPercent: 0,
      tvaRate: 9,
      depositPercent: 30,
      notes: 'TVA 9% selon convention secteur santé.',
      items: [
        { designation: 'Centrale VRV réversible inverter 28 kW', unit: 'u', quantity: 1, unitPrice: 1950000 },
        { designation: 'Unités intérieures gainables basse pression', unit: 'u', quantity: 6, unitPrice: 185000 },
        { designation: 'Réseau aéraulique gaines pré-isolées et diffuseurs', unit: 'ml', quantity: 85, unitPrice: 6500 },
      ],
    },
    {
      id: 'dev-4',
      quoteNumber: 'DEV-2024-041',
      clientName: 'Mme. Nadia Touati',
      clientPhone: '0555 44 33 22',
      projectTitle: 'Peinture & Décoration Appartement F4 140m²',
      wilaya: '16 - Alger',
      commune: 'Dely Ibrahim',
      date: '02 Sep 2024',
      validityDays: 15,
      status: 'EXPIRE',
      discountPercent: 0,
      tvaRate: 0,
      depositPercent: 50,
      notes: 'Peinture satinée lavable écologique et enduit lissage 3 couches.',
      items: [
        { designation: 'Décapage et préparation des subjectiles', unit: 'm²', quantity: 380, unitPrice: 450 },
        { designation: 'Enduisage gros et fin (3 passes croisées)', unit: 'm²', quantity: 380, unitPrice: 950 },
        { designation: 'Peinture vinylique satinée lavable', unit: 'm²', quantity: 380, unitPrice: 1200 },
      ],
    },
  ];

  filteredQuotes(): QuoteData[] {
    return this.quotes.filter((q) => {
      const matchStatus = this.filterStatus === 'ALL' || q.status === this.filterStatus;
      const term = this.searchQuery.toLowerCase().trim();
      const matchSearch =
        !term ||
        q.quoteNumber.toLowerCase().includes(term) ||
        q.clientName.toLowerCase().includes(term) ||
        q.projectTitle.toLowerCase().includes(term) ||
        q.wilaya.toLowerCase().includes(term);
      return matchStatus && matchSearch;
    });
  }

  totalQuotesAmount(): number {
    return this.quotes.reduce((acc, curr) => acc + this.computeTotalTTC(curr), 0);
  }

  getCountByStatus(st: QuoteStatus): number {
    return this.quotes.filter((q) => q.status === st).length;
  }

  getAmountByStatus(st: QuoteStatus): number {
    return this.quotes.filter((q) => q.status === st).reduce((acc, curr) => acc + this.computeTotalTTC(curr), 0);
  }

  computeGrossHt(q: QuoteData): number {
    return q.items.reduce((acc, it) => acc + it.quantity * it.unitPrice, 0);
  }

  computeDiscountAmount(q: QuoteData): number {
    const gross = this.computeGrossHt(q);
    return (gross * (q.discountPercent || 0)) / 100;
  }

  computeNetHt(q: QuoteData): number {
    return this.computeGrossHt(q) - this.computeDiscountAmount(q);
  }

  computeTvaAmount(q: QuoteData): number {
    const net = this.computeNetHt(q);
    return (net * (q.tvaRate || 0)) / 100;
  }

  computeTotalTTC(q: QuoteData): number {
    return this.computeNetHt(q) + this.computeTvaAmount(q);
  }

  computeFormGrossSubtotal(): number {
    if (!this.currentForm) return 0;
    return this.computeGrossHt(this.currentForm);
  }

  computeFormDiscount(): number {
    if (!this.currentForm) return 0;
    return this.computeDiscountAmount(this.currentForm);
  }

  computeFormNetSubtotal(): number {
    if (!this.currentForm) return 0;
    return this.computeNetHt(this.currentForm);
  }

  computeFormTva(): number {
    if (!this.currentForm) return 0;
    return this.computeTvaAmount(this.currentForm);
  }

  computeFormTTC(): number {
    if (!this.currentForm) return 0;
    return this.computeTotalTTC(this.currentForm);
  }

  openNewQuoteModal(): void {
    this.editingQuote = null;
    this.currentForm = {
      id: '',
      quoteNumber: 'DEV-2024-0' + (this.quotes.length + 10),
      clientName: '',
      clientPhone: '',
      projectTitle: '',
      wilaya: '16 - Alger',
      commune: '',
      date: 'Aujourd’hui',
      validityDays: 30,
      status: 'BROUILLON',
      discountPercent: 0,
      tvaRate: 19,
      depositPercent: 30,
      notes: '',
      items: [
        { designation: 'Prestation de travaux / Fourniture matériaux', unit: 'm²', quantity: 10, unitPrice: 2500 },
      ],
    };
    this.showModal.set(true);
  }

  editQuote(q: QuoteData): void {
    this.editingQuote = q;
    this.currentForm = JSON.parse(JSON.stringify(q));
    this.showModal.set(true);
  }

  addItemLine(): void {
    if (this.currentForm) {
      this.currentForm.items.push({
        designation: '',
        unit: 'm²',
        quantity: 1,
        unitPrice: 1000,
      });
    }
  }

  removeItemLine(index: number): void {
    if (this.currentForm && this.currentForm.items.length > 1) {
      this.currentForm.items.splice(index, 1);
    }
  }

  saveQuote(): void {
    if (!this.currentForm) return;
    if (this.editingQuote) {
      const idx = this.quotes.findIndex((q) => q.id === this.editingQuote!.id);
      if (idx !== -1) {
        this.quotes[idx] = { ...this.currentForm };
      }
    } else {
      this.quotes.unshift({
        ...this.currentForm,
        id: 'dev-' + (this.quotes.length + 1),
      });
    }
    this.showModal.set(false);
  }

  openPdfPreview(q: QuoteData): void {
    this.previewQuote.set(q);
  }

  closePdfPreview(): void {
    this.previewQuote.set(null);
  }

  sendViaWhatsApp(q: QuoteData): void {
    const phone = q.clientPhone.replace(/\s+/g, '').replace(/^0/, '213');
    const totalTtc = this.computeTotalTTC(q);
    const text = encodeURIComponent(
      `Bonjour ${q.clientName},\nVoici votre devis BTP ${q.quoteNumber} concernant les travaux "${q.projectTitle}".\nMontant Total: ${totalTtc.toLocaleString()} DZD.\nEntreprise SARL BTP EL-BINAA Algérie.`
    );
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  }

  printDocument(): void {
    window.print();
  }

  downloadPdfMock(): void {
    alert(`Téléchargement du Devis ${this.previewQuote()?.quoteNumber}.pdf généré avec succès !`);
  }

  getStatusBadge(st: QuoteStatus): string {
    return 'st-' + st.toLowerCase();
  }

  getStatusLabel(st: QuoteStatus): string {
    switch (st) {
      case 'BROUILLON': return 'Brouillon';
      case 'ENVOYE': return 'Envoyé au client';
      case 'NEGOCIATION': return 'En Négociation';
      case 'ACCEPTE': return 'Accepté / Signé';
      case 'REFUSE': return 'Refusé';
      case 'EXPIRE': return 'Expiré';
    }
  }
}
