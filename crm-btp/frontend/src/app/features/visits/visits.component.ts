import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

interface TechnicalVisit {
  id: string;
  clientName: string;
  phone: string;
  date: string;
  time: string;
  wilaya: string;
  address: string;
  object: string; // Ex: Prise de métré Gros Œuvre, Audit Électrique, Relevé de cotes Façade
  inspector: string;
  status: 'PLANIFIEE' | 'CONFIRMEE' | 'TERMINEE' | 'RAPPORT_PRET';
  metrageNotes?: string;
}

@Component({
  selector: 'app-visits',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="visits-page">
      <div class="page-header">
        <div>
          <h2>Visites Techniques & Relevés de Métrés</h2>
          <p class="page-subtitle">Planification des déplacements sur site pour les prises de cotes et estimations</p>
        </div>
        <button class="btn btn-primary" (click)="showModal.set(true)">
          + Planifier une Visite
        </button>
      </div>

      <!-- KPI METRICS -->
      <div class="visits-kpi-grid">
        <div class="kpi-mini card">
          <span class="label">Visites cette semaine</span>
          <span class="num text-primary">8</span>
        </div>
        <div class="kpi-mini card">
          <span class="label">En attente de métré</span>
          <span class="num text-warning">3</span>
        </div>
        <div class="kpi-mini card">
          <span class="label">Rapports métrés rédigés</span>
          <span class="num text-success">14</span>
        </div>
        <div class="kpi-mini card">
          <span class="label">Taux conversion devis</span>
          <span class="num">72%</span>
        </div>
      </div>

      <!-- VISITS LIST / CARDS -->
      <div class="card table-card">
        <div class="table-responsive">
          <table class="btp-table">
            <thead>
              <tr>
                <th>Date & Heure</th>
                <th>Client & Contact</th>
                <th>Lieu du Chantier</th>
                <th>Objet de la Visite / Métré</th>
                <th>Conducteur / Métreur</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let v of visits">
                <td>
                  <div class="cell-main">📅 {{ v.date }}</div>
                  <div class="cell-sub font-bold">⏰ {{ v.time }}</div>
                </td>
                <td>
                  <div class="cell-main">{{ v.clientName }}</div>
                  <div class="cell-sub">📞 {{ v.phone }}</div>
                </td>
                <td>
                  <div class="cell-main">📍 {{ v.wilaya }}</div>
                  <div class="cell-sub">{{ v.address }}</div>
                </td>
                <td>
                  <div class="cell-main">{{ v.object }}</div>
                  <div *ngIf="v.metrageNotes" class="metrage-note-snippet">
                    📐 {{ v.metrageNotes }}
                  </div>
                </td>
                <td>
                  <span class="conductor-badge">👷 {{ v.inspector }}</span>
                </td>
                <td>
                  <span class="badge" [ngClass]="getStatusBadge(v.status)">{{ getStatusLabel(v.status) }}</span>
                </td>
                <td>
                  <div class="action-buttons">
                    <a routerLink="/quotes" class="btn btn-outline btn-xs" title="Convertir en Devis BTP">
                      Générer Devis
                    </a>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- MODAL SCHEDULE VISIT -->
      <div *ngIf="showModal()" class="modal-backdrop">
        <div class="modal-box card">
          <div class="modal-header">
            <h3>Planifier une Visite Technique</h3>
            <button class="close-btn" (click)="showModal.set(false)">✕</button>
          </div>

          <div class="modal-body">
            <div class="form-row">
              <div class="form-group flex-1">
                <label>Nom du Client *</label>
                <input type="text" [(ngModel)]="newVisit.clientName" placeholder="M. Youcef Belhadj" />
              </div>
              <div class="form-group flex-1">
                <label>Téléphone *</label>
                <input type="text" [(ngModel)]="newVisit.phone" placeholder="0550 88 99 00" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label>Date de la visite *</label>
                <input type="date" [(ngModel)]="newVisit.date" />
              </div>
              <div class="form-group flex-1">
                <label>Heure *</label>
                <input type="time" [(ngModel)]="newVisit.time" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label>Wilaya *</label>
                <select [(ngModel)]="newVisit.wilaya">
                  <option value="16 - Alger">16 - Alger</option>
                  <option value="31 - Oran">31 - Oran</option>
                  <option value="25 - Constantine">25 - Constantine</option>
                  <option value="19 - Sétif">19 - Sétif</option>
                  <option value="09 - Blida">09 - Blida</option>
                </select>
              </div>
              <div class="form-group flex-1">
                <label>Adresse exacte du chantier *</label>
                <input type="text" [(ngModel)]="newVisit.address" placeholder="Coopérative El-Amel, Villa N°14" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label>Objet du relevé *</label>
                <input type="text" [(ngModel)]="newVisit.object" placeholder="Prise de cotes dalles et poteaux" />
              </div>
              <div class="form-group flex-1">
                <label>Conducteur assigné *</label>
                <select [(ngModel)]="newVisit.inspector">
                  <option value="Ing. Rafik K.">Ing. Rafik K. (Conducteur)</option>
                  <option value="Chef Mourad T.">Chef Mourad T. (Chef chantier)</option>
                  <option value="Amine B.">Amine B. (Technico-commercial)</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label>Notes de métré préliminaires</label>
              <textarea [(ngModel)]="newVisit.metrageNotes" rows="2" placeholder="Accès camion difficile, hauteur sous plafond 3.20m..."></textarea>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-outline" (click)="showModal.set(false)">Annuler</button>
            <button class="btn btn-primary" (click)="saveVisit()">Confirmer la Visite</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .visits-page {
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

    .visits-kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }

    .kpi-mini {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 4px;

      .label {
        font-size: 0.775rem;
        font-weight: 600;
        color: var(--text-muted);
      }

      .num {
        font-size: 1.5rem;
        font-weight: 800;
        font-family: var(--font-display);
      }
    }

    .table-card {
      padding: 0;
      overflow: hidden;
    }

    .font-bold {
      font-weight: 700;
    }

    .conductor-badge {
      font-size: 0.8rem;
      font-weight: 600;
      color: #334155;
      background: #f1f5f9;
      padding: 3px 8px;
      border-radius: 4px;
    }

    .metrage-note-snippet {
      font-size: 0.75rem;
      color: #0369a1;
      background: #e0f2fe;
      padding: 2px 6px;
      border-radius: 4px;
      margin-top: 4px;
    }

    .btn-xs {
      padding: 4px 8px;
      font-size: 0.775rem;
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
      max-width: 580px;
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
export class VisitsComponent {
  showModal = signal<boolean>(false);

  visits: TechnicalVisit[] = [
    {
      id: 'VIS-01',
      clientName: 'Mme. Nadia Touati',
      phone: '0550 11 22 33',
      date: '2024-09-24',
      time: '10:30',
      wilaya: '16 - Alger',
      address: 'Lotissement Les Crêtes, Dely Ibrahim',
      object: 'Métré Rénovation Complète Cuisine & SDB',
      inspector: 'Ing. Rafik K.',
      status: 'CONFIRMEE',
      metrageNotes: 'Surface faïence: ~48m², plomberie multicouche à refaire',
    },
    {
      id: 'VIS-02',
      clientName: 'EURL Maghreb Distribution',
      phone: '0661 44 55 66',
      date: '2024-09-24',
      time: '14:00',
      wilaya: '16 - Alger',
      address: 'Zone Industrielle Oued Smar',
      object: 'Relevé de nivellement dallage béton armé',
      inspector: 'Chef Mourad T.',
      status: 'PLANIFIEE',
    },
    {
      id: 'VIS-03',
      clientName: 'Dr. Sid Ahmed',
      phone: '0770 99 88 77',
      date: '2024-09-25',
      time: '09:00',
      wilaya: '31 - Oran',
      address: 'Route Canastel, Villa N°18',
      object: 'Métré élévation terrasse R+1',
      inspector: 'Ing. Rafik K.',
      status: 'RAPPORT_PRET',
      metrageNotes: 'Dalle pleine 16cm, armature HA12, volume béton 18.5m³',
    },
  ];

  newVisit = {
    clientName: '',
    phone: '',
    date: '2024-09-25',
    time: '10:00',
    wilaya: '16 - Alger',
    address: '',
    object: '',
    inspector: 'Ing. Rafik K.',
    metrageNotes: '',
  };

  getStatusBadge(status: TechnicalVisit['status']): string {
    switch (status) {
      case 'PLANIFIEE': return 'badge-manager';
      case 'CONFIRMEE': return 'badge-commercial';
      case 'TERMINEE': return 'badge-employee';
      case 'RAPPORT_PRET': return 'badge-active';
    }
  }

  getStatusLabel(status: TechnicalVisit['status']): string {
    switch (status) {
      case 'PLANIFIEE': return 'Planifiée';
      case 'CONFIRMEE': return 'Confirmée';
      case 'TERMINEE': return 'Effectuée';
      case 'RAPPORT_PRET': return 'Rapport & Métré Prêt';
    }
  }

  saveVisit(): void {
    if (!this.newVisit.clientName || !this.newVisit.address) return;
    this.visits.unshift({
      id: `VIS-${Date.now()}`,
      clientName: this.newVisit.clientName,
      phone: this.newVisit.phone || '0550 00 00 00',
      date: this.newVisit.date,
      time: this.newVisit.time,
      wilaya: this.newVisit.wilaya,
      address: this.newVisit.address,
      object: this.newVisit.object || 'Métré sur site',
      inspector: this.newVisit.inspector,
      status: 'PLANIFIEE',
      metrageNotes: this.newVisit.metrageNotes,
    });
    this.showModal.set(false);
  }
}
