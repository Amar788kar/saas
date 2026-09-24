import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface MaterialStock {
  id: string;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  minStock: number;
  costPriceDzd: number;
  supplier: string;
  location: string;
  status: 'DISPONIBLE' | 'ALERTE_BAS' | 'RUPTURE';
}

@Component({
  selector: 'app-materials',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="materials-page">
      <div class="page-header">
        <div>
          <h2>Matériaux de Construction & Stocks Chantiers</h2>
          <p class="page-subtitle">Suivi des approvisionnements en ciment, acier, agrégats et consommables BTP</p>
        </div>
        <button class="btn btn-primary" (click)="showModal.set(true)">
          + Entrée de Matériaux
        </button>
      </div>

      <!-- METRICS -->
      <div class="stock-kpi-grid">
        <div class="kpi-box card">
          <span class="label">Valeur du Stock Valorisé</span>
          <span class="val text-primary">{{ totalStockValue() | number }} DZD</span>
        </div>
        <div class="kpi-box card">
          <span class="label">Références en stock</span>
          <span class="val">{{ materials.length }} articles</span>
        </div>
        <div class="kpi-box card">
          <span class="label">Alertes Stock Critique</span>
          <span class="val text-danger">{{ getCount('ALERTE_BAS') }} références</span>
        </div>
        <div class="kpi-box card">
          <span class="label">Rotations sur chantiers</span>
          <span class="val text-success">Active</span>
        </div>
      </div>

      <!-- TABLE -->
      <div class="card table-card">
        <div class="table-responsive">
          <table class="btp-table">
            <thead>
              <tr>
                <th>Matériau / Désignation</th>
                <th>Catégorie</th>
                <th>Stock Actuel</th>
                <th>Seuil Min.</th>
                <th>Prix Unitaire Estimé</th>
                <th>Valeur Totale</th>
                <th>Dépôt / Chantier</th>
                <th>Fournisseur</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let m of materials">
                <td>
                  <div class="cell-main font-bold">📦 {{ m.name }}</div>
                  <div class="cell-sub">ID: {{ m.id }}</div>
                </td>
                <td><span class="category-badge">{{ m.category }}</span></td>
                <td>
                  <div class="cell-amount">{{ m.currentStock | number }} {{ m.unit }}</div>
                </td>
                <td>{{ m.minStock }} {{ m.unit }}</td>
                <td>{{ m.costPriceDzd | number }} DZD / {{ m.unit }}</td>
                <td class="font-bold text-primary">
                  {{ (m.currentStock * m.costPriceDzd) | number }} DZD
                </td>
                <td>{{ m.location }}</td>
                <td>{{ m.supplier }}</td>
                <td>
                  <span class="stock-status-tag" [ngClass]="getStatusClass(m.status)">
                    {{ getStatusLabel(m.status) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- MODAL CREATE MATERIAL -->
      <div *ngIf="showModal()" class="modal-backdrop">
        <div class="modal-box card">
          <div class="modal-header">
            <h3>Nouvelle Référence / Approvisionnement</h3>
            <button class="close-btn" (click)="showModal.set(false)">✕</button>
          </div>

          <div class="modal-body">
            <div class="form-group">
              <label>Désignation du Matériau *</label>
              <input type="text" [(ngModel)]="newMat.name" placeholder="Ex: Ciment CPJ-CEM II/A 42.5 (Sacs 50kg)" />
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label>Catégorie *</label>
                <select [(ngModel)]="newMat.category">
                  <option value="Liants & Ciment">Liants & Ciment</option>
                  <option value="Aciers & Armatures">Aciers & Armatures</option>
                  <option value="Agrégats & Béton">Agrégats & Béton</option>
                  <option value="Briques & Blocs">Briques & Blocs</option>
                  <option value="Plâtrerie & BA13">Plâtrerie & BA13</option>
                  <option value="Revêtement & Carrelage">Revêtement & Carrelage</option>
                  <option value="Plomberie & Sanitaire">Plomberie & Sanitaire</option>
                  <option value="Électricité & Câbles">Électricité & Câbles</option>
                </select>
              </div>
              <div class="form-group flex-1">
                <label>Unité *</label>
                <select [(ngModel)]="newMat.unit">
                  <option value="Sacs">Sacs</option>
                  <option value="Tonnes">Tonnes</option>
                  <option value="m³">m³</option>
                  <option value="Barres 12m">Barres 12m</option>
                  <option value="Plaques">Plaques</option>
                  <option value="m²">m²</option>
                  <option value="ml">ml</option>
                  <option value="u">u</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label>Quantité Entrante *</label>
                <input type="number" [(ngModel)]="newMat.currentStock" placeholder="250" />
              </div>
              <div class="form-group flex-1">
                <label>Seuil d'Alerte Minimum *</label>
                <input type="number" [(ngModel)]="newMat.minStock" placeholder="50" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label>Prix Unitaire d'Achat (DZD) *</label>
                <input type="number" [(ngModel)]="newMat.costPriceDzd" placeholder="680" />
              </div>
              <div class="form-group flex-1">
                <label>Fournisseur habituel</label>
                <input type="text" [(ngModel)]="newMat.supplier" placeholder="Cimenterie Chlef / Quincaillerie Pro" />
              </div>
            </div>

            <div class="form-group">
              <label>Lieu de stockage / Destination</label>
              <select [(ngModel)]="newMat.location">
                <option value="Dépôt Central BTP">Dépôt Central BTP</option>
                <option value="Chantier Villa Chéraga">Chantier Villa Chéraga</option>
                <option value="Chantier Showroom Oran">Chantier Showroom Oran</option>
                <option value="Chantier Résidence Blida">Chantier Résidence Blida</option>
              </select>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-outline" (click)="showModal.set(false)">Annuler</button>
            <button class="btn btn-primary" (click)="saveMaterial()">Valider l'Approvisionnement</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .materials-page {
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

    .stock-kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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
        font-size: 1.4rem;
        font-weight: 800;
        font-family: var(--font-display);
      }
    }

    .table-card {
      padding: 0;
      overflow: hidden;
    }

    .font-bold { font-weight: 700; }

    .category-badge {
      font-size: 0.75rem;
      background: #f1f5f9;
      color: #334155;
      padding: 3px 8px;
      border-radius: 4px;
    }

    .stock-status-tag {
      font-size: 0.725rem;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: var(--radius-full);

      &.st-dispo { background: #dcfce7; color: #15803d; }
      &.st-alerte { background: #fef3c7; color: #b45309; }
      &.st-rupture { background: #fee2e2; color: #b91c1c; }
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
export class MaterialsComponent {
  showModal = signal<boolean>(false);

  materials: MaterialStock[] = [
    {
      id: 'MAT-01',
      name: 'Ciment CPJ-CEM II/A 42.5 (Sacs 50kg)',
      category: 'Liants & Ciment',
      unit: 'Sacs',
      currentStock: 480,
      minStock: 100,
      costPriceDzd: 680,
      supplier: 'Groupe GICA / Chlef',
      location: 'Chantier Villa Chéraga',
      status: 'DISPONIBLE',
    },
    {
      id: 'MAT-02',
      name: 'Rond à béton torsadé HA12 FeE400',
      category: 'Aciers & Armatures',
      unit: 'Tonnes',
      currentStock: 3.5,
      minStock: 2.0,
      costPriceDzd: 165000,
      supplier: 'Complexe Sidérurgique Tosyali',
      location: 'Dépôt Central BTP',
      status: 'DISPONIBLE',
    },
    {
      id: 'MAT-03',
      name: 'Sable de carrière concassé 0/4',
      category: 'Agrégats & Béton',
      unit: 'm³',
      currentStock: 15,
      minStock: 25,
      costPriceDzd: 2200,
      supplier: 'Carrière Tipaza',
      location: 'Chantier Villa Chéraga',
      status: 'ALERTE_BAS',
    },
    {
      id: 'MAT-04',
      name: 'Plaques de plâtre hydrofuge BA13 (120x250cm)',
      category: 'Plâtrerie & BA13',
      unit: 'Plaques',
      currentStock: 120,
      minStock: 30,
      costPriceDzd: 1450,
      supplier: 'Knauf Algérie',
      location: 'Chantier Showroom Oran',
      status: 'DISPONIBLE',
    },
    {
      id: 'MAT-05',
      name: 'Câble électrique cuivre U1000 R2V 3x2.5mm²',
      category: 'Électricité & Câbles',
      unit: 'ml',
      currentStock: 80,
      minStock: 150,
      costPriceDzd: 210,
      supplier: 'ENICAB Biskra',
      location: 'Dépôt Central BTP',
      status: 'ALERTE_BAS',
    },
  ];

  newMat = {
    name: '',
    category: 'Liants & Ciment',
    unit: 'Sacs',
    currentStock: 100,
    minStock: 20,
    costPriceDzd: 700,
    supplier: '',
    location: 'Dépôt Central BTP',
  };

  totalStockValue(): number {
    return this.materials.reduce((acc, m) => acc + (m.currentStock * m.costPriceDzd), 0);
  }

  getCount(status: MaterialStock['status']): number {
    return this.materials.filter((m) => m.status === status).length;
  }

  getStatusClass(st: MaterialStock['status']): string {
    switch (st) {
      case 'DISPONIBLE': return 'st-dispo';
      case 'ALERTE_BAS': return 'st-alerte';
      case 'RUPTURE': return 'st-rupture';
    }
  }

  getStatusLabel(st: MaterialStock['status']): string {
    switch (st) {
      case 'DISPONIBLE': return 'En stock';
      case 'ALERTE_BAS': return 'Seuil Bas';
      case 'RUPTURE': return 'Rupture';
    }
  }

  saveMaterial(): void {
    if (!this.newMat.name) return;
    this.materials.unshift({
      id: `MAT-${Date.now()}`,
      name: this.newMat.name,
      category: this.newMat.category,
      unit: this.newMat.unit,
      currentStock: Number(this.newMat.currentStock) || 0,
      minStock: Number(this.newMat.minStock) || 10,
      costPriceDzd: Number(this.newMat.costPriceDzd) || 0,
      supplier: this.newMat.supplier || 'Fournisseur local',
      location: this.newMat.location,
      status: 'DISPONIBLE',
    });
    this.showModal.set(false);
  }
}
