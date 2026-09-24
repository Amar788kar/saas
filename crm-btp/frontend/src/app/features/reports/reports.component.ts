import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="reports-page">
      <div class="page-header">
        <div>
          <h2>Rapports Financiers & Rentabilité des Chantiers</h2>
          <p class="page-subtitle">Analyse des marges brutes BTP, des coûts réels de revient et de la rentabilité par wilaya</p>
        </div>
      </div>

      <!-- KPI METRICS -->
      <div class="reports-kpi-grid">
        <div class="kpi-card card">
          <span class="label">Chiffre d’Affaires Total</span>
          <span class="val text-primary">32 900 000 DZD</span>
          <span class="sub">+18.5% sur l'exercice</span>
        </div>
        <div class="kpi-card card">
          <span class="label">Marge Brute Moyenne</span>
          <span class="val text-success">28.4%</span>
          <span class="sub">Supérieure à la moyenne BTP (24%)</span>
        </div>
        <div class="kpi-card card">
          <span class="label">Dépenses Matériaux</span>
          <span class="val">14 250 000 DZD</span>
          <span class="sub">43.3% du CA total</span>
        </div>
        <div class="kpi-card card">
          <span class="label">Masse Salariale Chantiers</span>
          <span class="val">9 310 000 DZD</span>
          <span class="sub">Main d’œuvre & sous-traitance</span>
        </div>
      </div>

      <!-- CHANTIER RENTABILITY TABLE -->
      <div class="card table-card">
        <div class="card-header-inner">
          <h3>Rentabilité & Marge Réelle par Chantier</h3>
          <p class="sub-text">Comparaison entre le prix de vente contractuel et les coûts réels constatés</p>
        </div>

        <div class="table-responsive">
          <table class="btp-table">
            <thead>
              <tr>
                <th>Chantier & Client</th>
                <th>Wilaya</th>
                <th>Prix Vente Marché</th>
                <th>Coût Matériaux</th>
                <th>Coût Main d'Œuvre</th>
                <th>Marge Brute Réalisée</th>
                <th>Taux de Marge</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let p of projectProfits">
                <td>
                  <div class="cell-main font-bold">{{ p.title }}</div>
                  <div class="cell-sub">{{ p.client }}</div>
                </td>
                <td><span class="wilaya-tag">{{ p.wilaya }}</span></td>
                <td class="cell-amount">{{ p.revenue | number }} DZD</td>
                <td>{{ p.materialCost | number }} DZD</td>
                <td>{{ p.laborCost | number }} DZD</td>
                <td class="cell-amount text-success">+ {{ (p.revenue - p.materialCost - p.laborCost) | number }} DZD</td>
                <td>
                  <span class="margin-pill" [class.high-margin]="getMarginPercent(p) >= 28">
                    {{ getMarginPercent(p) }}%
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- WILAYA REVENUE BREAKDOWN -->
      <div class="grid-2col">
        <div class="card">
          <h3>Répartition du Chiffre d'Affaires par Wilaya</h3>
          <div class="wilaya-bars">
            <div *ngFor="let w of wilayaStats" class="w-bar-item">
              <div class="w-header">
                <span class="w-name">{{ w.wilaya }}</span>
                <span class="w-amount">{{ w.amount | number }} DZD ({{ w.percent }}%)</span>
              </div>
              <div class="w-progress">
                <div class="w-fill" [style.width.%]="w.percent"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <h3>Indicateurs de Performance Commerciale (KPI)</h3>
          <div class="kpi-stat-list">
            <div class="stat-row">
              <span class="st-label">Délai moyen d'acceptation des devis :</span>
              <span class="st-val">8.4 jours</span>
            </div>
            <div class="stat-row">
              <span class="st-label">Taux de transformation Visite → Devis :</span>
              <span class="st-val text-success">88%</span>
            </div>
            <div class="stat-row">
              <span class="st-label">Taux de transformation Devis → Marché signé :</span>
              <span class="st-val text-success">68%</span>
            </div>
            <div class="stat-row">
              <span class="st-label">Délai moyen d'encaissement des situations :</span>
              <span class="st-val">12 jours</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .reports-page {
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

    .reports-kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
    }

    .kpi-card {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 4px;

      .label {
        font-size: 0.775rem;
        font-weight: 600;
        color: var(--text-muted);
        text-transform: uppercase;
      }

      .val {
        font-size: 1.5rem;
        font-weight: 800;
        font-family: var(--font-display);
      }

      .sub {
        font-size: 0.75rem;
        color: var(--text-muted);
      }
    }

    .table-card {
      padding: 0;
      overflow: hidden;
    }

    .card-header-inner {
      padding: 18px 20px 12px;
      border-bottom: 1px solid var(--border-color);

      h3 { font-size: 1.05rem; }
      .sub-text { font-size: 0.8rem; color: var(--text-muted); }
    }

    .font-bold { font-weight: 700; }

    .margin-pill {
      font-size: 0.8rem;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 4px;
      background: #ecfdf5;
      color: #059669;

      &.high-margin {
        background: #dcfce7;
        color: #15803d;
      }
    }

    .grid-2col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;

      @media (max-width: 900px) {
        grid-template-columns: 1fr;
      }
    }

    .wilaya-bars {
      display: flex;
      flex-direction: column;
      gap: 14px;
      margin-top: 16px;
    }

    .w-bar-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .w-header {
      display: flex;
      justify-content: space-between;
      font-size: 0.825rem;
    }

    .w-name { font-weight: 600; }
    .w-amount { color: var(--text-muted); }

    .w-progress {
      height: 8px;
      background: #e2e8f0;
      border-radius: var(--radius-full);
      overflow: hidden;
    }

    .w-fill {
      height: 100%;
      background: var(--primary);
      border-radius: var(--radius-full);
    }

    .kpi-stat-list {
      display: flex;
      flex-direction: column;
      gap: 14px;
      margin-top: 16px;
    }

    .stat-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 10px;
      border-bottom: 1px solid var(--border-color);
      font-size: 0.85rem;

      &:last-child {
        border-bottom: none;
      }
    }

    .st-label { color: var(--text-muted); }
    .st-val { font-weight: 700; }
  `],
})
export class ReportsComponent {
  projectProfits = [
    {
      title: 'Villa R+2 Moderne (Chéraga)',
      client: 'M. Belkacem Brahimi',
      wilaya: '16 - Alger',
      revenue: 14200000,
      materialCost: 6100000,
      laborCost: 4050000,
    },
    {
      title: 'Aménagement Showroom & Bureaux',
      client: 'SARL Numidia Import',
      wilaya: '31 - Oran',
      revenue: 6800000,
      materialCost: 2850000,
      laborCost: 1980000,
    },
    {
      title: 'Rénovation & Étanchéité Immeuble',
      client: 'Copropriété Les Pins',
      wilaya: '09 - Blida',
      revenue: 3500000,
      materialCost: 1450000,
      laborCost: 950000,
    },
    {
      title: 'Installation Climatisation VRV',
      client: 'Clinique Privée El Chifa',
      wilaya: '19 - Sétif',
      revenue: 8400000,
      materialCost: 3850000,
      laborCost: 2330000,
    },
  ];

  wilayaStats = [
    { wilaya: '16 - Alger', amount: 14200000, percent: 43 },
    { wilaya: '19 - Sétif', amount: 8400000, percent: 26 },
    { wilaya: '31 - Oran', amount: 6800000, percent: 21 },
    { wilaya: '09 - Blida', amount: 3500000, percent: 10 },
  ];

  getMarginPercent(p: { revenue: number; materialCost: number; laborCost: number }): number {
    const margin = p.revenue - p.materialCost - p.laborCost;
    return Math.round((margin / p.revenue) * 100);
  }
}
