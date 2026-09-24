import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

interface StatKpi {
  label: string;
  value: string;
  unit?: string;
  change: string;
  positive: boolean;
  icon: string;
}

interface MonthlyCa {
  month: string;
  amount: number; // in DZD
  heightPercent: number;
}

interface UrgentTask {
  id: string;
  title: string;
  project: string;
  assignedTo: string;
  deadline: string;
  priority: 'URGENT' | 'HAUTE';
  trade: string;
}

interface RecentActivity {
  id: string;
  user: string;
  action: string;
  target: string;
  time: string;
  type: 'LEAD' | 'QUOTE' | 'PAYMENT' | 'PROJECT' | 'PHOTO';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dashboard-page">
      <!-- WELCOME HERO -->
      <div class="dashboard-hero">
        <div class="hero-text">
          <h1>Tableau de bord — Suivi Général des Chantiers</h1>
          <p>
            Bienvenue, <strong>{{ currentUser()?.first_name }} {{ currentUser()?.last_name }}</strong>. 
            Voici l'activité de vos équipes et chantiers aujourd'hui en Algérie.
          </p>
        </div>
        <div class="hero-actions">
          <a routerLink="/prospects" class="btn btn-outline">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="8.5" cy="7" r="4"></circle>
              <line x1="20" y1="8" x2="20" y2="14"></line>
              <line x1="23" y1="11" x2="17" y2="11"></line>
            </svg>
            Nouveau Prospect
          </a>
          <a routerLink="/quotes" class="btn btn-primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Créer Devis BTP
          </a>
        </div>
      </div>

      <!-- KPI METRIC CARDS -->
      <div class="kpi-grid">
        <div *ngFor="let kpi of kpis" class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-title">{{ kpi.label }}</span>
            <div class="kpi-icon-box" [innerHTML]="kpi.icon"></div>
          </div>
          <div class="kpi-body">
            <span class="kpi-value">{{ kpi.value }}</span>
            <span *ngIf="kpi.unit" class="kpi-unit">{{ kpi.unit }}</span>
          </div>
          <div class="kpi-footer">
            <span class="kpi-trend" [class.positive]="kpi.positive" [class.negative]="!kpi.positive">
              {{ kpi.positive ? '↑' : '↓' }} {{ kpi.change }}
            </span>
            <span class="kpi-subtext">vs mois précédent</span>
          </div>
        </div>
      </div>

      <!-- PIPELINE BTP WORKFLOW STRIP -->
      <div class="pipeline-section card">
        <div class="section-header">
          <div>
            <h3>Cycle de Conversion BTP (En direct)</h3>
            <p class="section-desc">Du premier contact jusqu'à la réception de chantier et SAV</p>
          </div>
          <a routerLink="/prospects" class="view-all-link">Gérer le pipeline →</a>
        </div>

        <div class="pipeline-steps">
          <div class="step-card" *ngFor="let step of pipelineSteps; let i = index">
            <div class="step-badge-num">{{ i + 1 }}</div>
            <div class="step-name">{{ step.name }}</div>
            <div class="step-count">{{ step.count }} dossier{{ step.count > 1 ? 's' : '' }}</div>
            <div class="step-amount">{{ step.totalAmount }}</div>
          </div>
        </div>
      </div>

      <!-- TWO COLUMNS: CHANTIERS EN COURS & ACTIVITES / ALERTES -->
      <div class="grid-2col">
        <!-- CHANTIERS EN COURS -->
        <div class="card projects-card">
          <div class="section-header">
            <div>
              <h3>Chantiers & Travaux en cours</h3>
              <p class="section-desc">Suivi de l'avancement physique et financier</p>
            </div>
            <a routerLink="/projects" class="view-all-link">Tous les chantiers ({{ activeProjects.length }}) →</a>
          </div>

          <div class="table-responsive">
            <table class="btp-table">
              <thead>
                <tr>
                  <th>Projet & Client</th>
                  <th>Wilaya</th>
                  <th>Phase</th>
                  <th>Avancement</th>
                  <th>Budget DZD</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let proj of activeProjects">
                  <td>
                    <div class="cell-main">{{ proj.title }}</div>
                    <div class="cell-sub">{{ proj.client }} • {{ proj.code }}</div>
                  </td>
                  <td>
                    <span class="wilaya-tag">{{ proj.wilaya }}</span>
                  </td>
                  <td>
                    <span class="badge" [ngClass]="proj.phaseBadge">{{ proj.phase }}</span>
                  </td>
                  <td>
                    <div class="progress-wrap">
                      <div class="progress-bar">
                        <div class="progress-fill" [style.width.%]="proj.progress"></div>
                      </div>
                      <span class="progress-label">{{ proj.progress }}%</span>
                    </div>
                  </td>
                  <td>
                    <div class="cell-amount">{{ proj.budget }} DZD</div>
                    <div class="cell-sub text-success">Reçu: {{ proj.paid }} DZD</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- VISITES DU JOUR & ALERTES -->
        <div class="card right-side-card">
          <div class="section-header">
            <div>
              <h3>Visites Techniques & Alertes</h3>
              <p class="section-desc">Métrés, rendez-vous chantiers et approvisionnements</p>
            </div>
            <a routerLink="/visits" class="view-all-link">Agenda →</a>
          </div>

          <!-- UPCOMING VISITS -->
          <div class="visits-list">
            <div *ngFor="let v of upcomingVisits" class="visit-item">
              <div class="visit-time">
                <span class="time">{{ v.time }}</span>
                <span class="date">{{ v.date }}</span>
              </div>
              <div class="visit-details">
                <p class="visit-client">{{ v.client }} ({{ v.type }})</p>
                <p class="visit-address">📍 {{ v.address }}, {{ v.wilaya }}</p>
                <p class="visit-tech">👷 Conducteur : {{ v.conductor }}</p>
              </div>
              <span class="badge badge-active">{{ v.status }}</span>
            </div>
          </div>

          <!-- CRITICAL ALERTS -->
          <div class="alerts-container">
            <div class="alert-box warning">
              <span class="alert-icon">⚠️</span>
              <div class="alert-text">
                <p class="alert-title">Relance Devis #DEV-2024-041</p>
                <p class="alert-desc">Villa Draria (Alger) : Devis de 4 800 000 DZD sans réponse depuis 5 jours.</p>
              </div>
            </div>
            <div class="alert-box info">
              <span class="alert-icon">📦</span>
              <div class="alert-text">
                <p class="alert-title">Livraison Ciment & Granulat</p>
                <p class="alert-desc">Chantier Oran (Promotion Akid Lotfi) prévue demain à 08:00.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-page {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .dashboard-hero {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
      padding-bottom: 8px;
    }

    .hero-text h1 {
      font-size: 1.55rem;
      margin-bottom: 4px;
    }

    .hero-text p {
      color: var(--text-muted);
      font-size: 0.925rem;
    }

    .hero-actions {
      display: flex;
      gap: 12px;
    }

    // KPI GRID
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 20px;
    }

    .kpi-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 20px;
      box-shadow: var(--shadow-sm);
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .kpi-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .kpi-title {
      font-size: 0.825rem;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .kpi-icon-box {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-md);
      background-color: var(--primary-light);
      color: var(--primary);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .kpi-body {
      display: flex;
      align-items: baseline;
      gap: 6px;
      margin: 4px 0;
    }

    .kpi-value {
      font-size: 1.65rem;
      font-weight: 800;
      font-family: var(--font-display);
      color: var(--text-main);
    }

    .kpi-unit {
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--text-muted);
    }

    .kpi-footer {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.775rem;
    }

    .kpi-trend {
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;

      &.positive {
        background-color: #ecfdf5;
        color: #059669;
      }
      &.negative {
        background-color: #fef2f2;
        color: #dc2626;
      }
    }

    .kpi-subtext {
      color: var(--text-muted);
    }

    // PIPELINE SECTION
    .pipeline-section {
      padding: 20px;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 18px;
    }

    .section-desc {
      font-size: 0.825rem;
      color: var(--text-muted);
      margin-top: 2px;
    }

    .view-all-link {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--primary);
      &:hover {
        text-decoration: underline;
      }
    }

    .pipeline-steps {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 12px;
    }

    .step-card {
      background: var(--bg-main);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 14px 12px;
      text-align: center;
      position: relative;
      transition: transform 0.15s ease, border-color 0.15s ease;

      &:hover {
        border-color: var(--primary);
        transform: translateY(-2px);
      }
    }

    .step-badge-num {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #e2e8f0;
      color: #475569;
      font-size: 0.7rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 6px;
    }

    .step-name {
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--text-main);
      margin-bottom: 4px;
    }

    .step-count {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .step-amount {
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--primary);
      margin-top: 4px;
    }

    // 2 COLUMNS
    .grid-2col {
      display: grid;
      grid-template-columns: 1.6fr 1fr;
      gap: 24px;

      @media (max-width: 1024px) {
        grid-template-columns: 1fr;
      }
    }

    .btp-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;

      th {
        text-align: left;
        padding: 10px 12px;
        background-color: var(--bg-main);
        color: var(--text-muted);
        font-weight: 600;
        font-size: 0.775rem;
        text-transform: uppercase;
        border-bottom: 1px solid var(--border-color);
      }

      td {
        padding: 12px;
        border-bottom: 1px solid var(--border-color);
        vertical-align: middle;
      }
    }

    .cell-main {
      font-weight: 600;
      color: var(--text-main);
    }

    .cell-sub {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-top: 2px;
    }

    .cell-amount {
      font-weight: 700;
      color: var(--text-main);
    }

    .text-success {
      color: #059669 !important;
    }

    .wilaya-tag {
      font-size: 0.75rem;
      font-weight: 600;
      color: #334155;
      background: #f1f5f9;
      padding: 3px 8px;
      border-radius: 4px;
    }

    .progress-wrap {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .progress-bar {
      flex: 1;
      height: 7px;
      background: #e2e8f0;
      border-radius: var(--radius-full);
      overflow: hidden;
      min-width: 70px;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #f97316 0%, #ea580c 100%);
      border-radius: var(--radius-full);
    }

    .progress-label {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-main);
      width: 32px;
    }

    // VISITS & ALERT ITEMS
    .visits-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 20px;
    }

    .visit-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      background: var(--bg-main);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
    }

    .visit-time {
      display: flex;
      flex-direction: column;
      align-items: center;
      background: #ffffff;
      padding: 6px 10px;
      border-radius: 6px;
      border: 1px solid var(--border-color);
      min-width: 60px;

      .time {
        font-weight: 800;
        font-size: 0.85rem;
        color: var(--primary);
      }

      .date {
        font-size: 0.675rem;
        color: var(--text-muted);
      }
    }

    .visit-details {
      flex: 1;

      .visit-client {
        font-weight: 600;
        font-size: 0.825rem;
      }

      .visit-address, .visit-tech {
        font-size: 0.725rem;
        color: var(--text-muted);
      }
    }

    .alerts-container {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .alert-box {
      display: flex;
      gap: 10px;
      padding: 10px 12px;
      border-radius: var(--radius-md);

      &.warning {
        background-color: #fffbeb;
        border: 1px solid #fef3c7;
      }
      &.info {
        background-color: #eff6ff;
        border: 1px solid #dbeafe;
      }
    }

    .alert-title {
      font-weight: 700;
      font-size: 0.8rem;
      color: #1e293b;
    }

    .alert-desc {
      font-size: 0.725rem;
      color: #475569;
    }
  `],
})
export class DashboardComponent {
  private authService = inject(AuthService);
  currentUser = this.authService.currentUser;

  kpis: StatKpi[] = [
    {
      label: 'Chiffre d’Affaires Réalisé',
      value: '28 450 000',
      unit: 'DZD',
      change: '+14.2%',
      positive: true,
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>`,
    },
    {
      label: 'Chantiers en Exécution',
      value: '8',
      unit: 'chantiers',
      change: '+2',
      positive: true,
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`,
    },
    {
      label: 'Devis en Négociation',
      value: '9 200 000',
      unit: 'DZD',
      change: '+8.5%',
      positive: true,
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>`,
    },
    {
      label: 'Métrés & Visites du mois',
      value: '19',
      unit: 'visites',
      change: '+4',
      positive: true,
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line></svg>`,
    },
  ];

  pipelineSteps = [
    { name: '1. Prospects', count: 12, totalAmount: '14.5M DZD' },
    { name: '2. Visite & Métré', count: 5, totalAmount: '8.2M DZD' },
    { name: '3. Devis BTP Émis', count: 7, totalAmount: '11.0M DZD' },
    { name: '4. Négociation', count: 3, totalAmount: '5.9M DZD' },
    { name: '5. Marché Signé', count: 4, totalAmount: '18.4M DZD' },
    { name: '6. Travaux en cours', count: 8, totalAmount: '28.4M DZD' },
    { name: '7. Réception & SAV', count: 2, totalAmount: '3.1M DZD' },
  ];

  activeProjects = [
    {
      code: 'CH-2024-001',
      title: 'Construction Villa R+2 Moderne',
      client: 'M. Belkacem Brahimi',
      wilaya: '16 - Alger (Chéraga)',
      phase: 'Gros Œuvre (Dalle)',
      phaseBadge: 'badge-manager',
      progress: 65,
      budget: '14 200 000',
      paid: '9 230 000',
    },
    {
      code: 'CH-2024-002',
      title: 'Aménagement Showroom & Bureaux',
      client: 'SARL Numidia Import',
      wilaya: '31 - Oran (Bir El Djir)',
      phase: 'Second Œuvre (BA13 & Élec)',
      phaseBadge: 'badge-commercial',
      progress: 42,
      budget: '6 800 000',
      paid: '3 400 000',
    },
    {
      code: 'CH-2024-003',
      title: 'Rénovation & Étanchéité Immeuble',
      client: 'Copropriété Les Pins',
      wilaya: '09 - Blida',
      phase: 'Finitions & Peinture',
      phaseBadge: 'badge-employee',
      progress: 88,
      budget: '3 500 000',
      paid: '3 100 000',
    },
    {
      code: 'CH-2024-004',
      title: 'Installation Climatisation VRV Centrale',
      client: 'Clinique El Chifa',
      wilaya: '19 - Sétif',
      phase: 'Essais & Mise en service',
      phaseBadge: 'badge-active',
      progress: 95,
      budget: '8 400 000',
      paid: '7 560 000',
    },
  ];

  upcomingVisits = [
    {
      time: '10:30',
      date: 'Aujourd’hui',
      client: 'Mme. Nadia Touati',
      type: 'Rénovation Cuisine & Faïence',
      address: 'Lotissement Les Crêtes, Dely Ibrahim',
      wilaya: 'Alger',
      conductor: 'Ing. Rafik K.',
      status: 'Confirmée',
    },
    {
      time: '14:00',
      date: 'Aujourd’hui',
      client: 'EURL Maghreb Distribution',
      type: 'Dallage Industriel & Charpente',
      address: 'Zone Industrielle Oued Smar',
      wilaya: 'Alger',
      conductor: 'Chef Mourad T.',
      status: 'Planifiée',
    },
    {
      time: '09:00',
      date: 'Demain',
      client: 'Dr. Sid Ahmed',
      type: 'Métré Gros Œuvre Extension',
      address: 'Route de Canastel',
      wilaya: 'Oran',
      conductor: 'Ing. Sofiane B.',
      status: 'Confirmée',
    },
  ];
}
