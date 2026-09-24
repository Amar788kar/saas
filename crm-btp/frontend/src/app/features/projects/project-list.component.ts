import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

export type ProjectPhase = 'INSTALLATION' | 'GROS_OEUVRE' | 'SECOND_OEUVRE' | 'FINITIONS' | 'RECEPTION' | 'APRES_VENTE';

export interface ProjectTeamMember {
  name: string;
  role: string;
  phone: string;
  dailyRate?: number;
}

export interface ProjectTaskItem {
  id: string;
  title: string;
  trade: string;
  status: 'A_FAIRE' | 'EN_COURS' | 'TERMINE';
  progress: number;
  assignedTo: string;
  dueDate: string;
}

export interface ProjectMaterialItem {
  name: string;
  supplier: string;
  quantity: string;
  deliveredDate: string;
  costDzd: number;
}

export interface ProjectPaymentItem {
  ref: string;
  title: string;
  amount: number;
  date: string;
  status: 'ENCAISSE' | 'EN_ATTENTE';
}

export interface ProjectPhoto {
  category: 'AVANT' | 'PENDANT' | 'APRES';
  title: string;
  date: string;
  thumbnail: string;
}

export interface ProjectItem {
  id: string;
  code: string;
  title: string;
  clientName: string;
  clientPhone: string;
  address: string;
  wilaya: string;
  commune: string;
  manager: string;
  phase: ProjectPhase;
  progressPercent: number;
  budgetTotal: number;
  amountPaid: number;
  startDate: string;
  targetEndDate: string;
  timeline: { title: string; date: string; completed: boolean }[];
  team: ProjectTeamMember[];
  tasks: ProjectTaskItem[];
  materials: ProjectMaterialItem[];
  payments: ProjectPaymentItem[];
  documents: { name: string; type: string; date: string; size: string }[];
  photos: ProjectPhoto[];
}

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="projects-page">
      <!-- HEADER -->
      <div class="page-header">
        <div>
          <h2>Chantiers & Conduite de Travaux BTP</h2>
          <p class="page-subtitle">Suivi technique, physique et financier en temps réel de tous vos chantiers en Algérie</p>
        </div>
        <button class="btn btn-primary" (click)="showModal.set(true)">
          + Ouvrir un Chantier
        </button>
      </div>

      <!-- FILTERS -->
      <div class="filters-card card">
        <div class="filter-group">
          <label>Phase des travaux :</label>
          <select [(ngModel)]="filterPhase">
            <option value="ALL">Toutes les phases</option>
            <option value="INSTALLATION">Installation de chantier</option>
            <option value="GROS_OEUVRE">Gros Œuvre (Fondations/Dalles)</option>
            <option value="SECOND_OEUVRE">Second Œuvre (Réseaux/Plâtrerie)</option>
            <option value="FINITIONS">Finitions & Peinture</option>
            <option value="RECEPTION">Réception & Livraison</option>
            <option value="APRES_VENTE">Garantie & Après-Vente (SAV)</option>
          </select>
        </div>

        <div class="filter-group">
          <label>Wilaya :</label>
          <select [(ngModel)]="filterWilaya">
            <option value="ALL">Toutes les wilayas</option>
            <option value="16 - Alger">16 - Alger</option>
            <option value="31 - Oran">31 - Oran</option>
            <option value="25 - Constantine">25 - Constantine</option>
            <option value="19 - Sétif">19 - Sétif</option>
            <option value="09 - Blida">09 - Blida</option>
          </select>
        </div>

        <div class="summary-info">
          <span>Chantiers actifs : <strong>{{ filteredProjects().length }}</strong></span>
          <span>Budget engagé : <strong class="text-primary">{{ totalBudget() | number }} DZD</strong></span>
        </div>
      </div>

      <!-- PROJECTS GRID CARDS -->
      <div class="projects-grid">
        <div *ngFor="let p of filteredProjects()" class="project-card card" (click)="openProjectDetails(p)">
          <div class="p-card-top">
            <div class="code-and-wilaya">
              <span class="project-code">{{ p.code }}</span>
              <span class="wilaya-tag">{{ p.wilaya }}</span>
            </div>
            <span class="phase-pill" [ngClass]="getPhaseClass(p.phase)">{{ getPhaseLabel(p.phase) }}</span>
          </div>

          <h3 class="p-title">{{ p.title }}</h3>
          <p class="p-client">👤 Client: <strong>{{ p.clientName }}</strong></p>
          <p class="p-location">📍 {{ p.commune }}, {{ p.wilaya }}</p>

          <div class="conductor-box">
            <span>👷 Conducteur : <strong>{{ p.manager }}</strong></span>
            <span>📅 Échéance : <strong>{{ p.targetEndDate }}</strong></span>
          </div>

          <!-- PROGRESS BAR -->
          <div class="progress-section">
            <div class="progress-labels">
              <span>Avancement Physique</span>
              <span class="font-bold">{{ p.progressPercent }}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" [style.width.%]="p.progressPercent"></div>
            </div>
          </div>

          <!-- FINANCIAL STATS -->
          <div class="financial-strip">
            <div class="fin-col">
              <span class="fin-label">Budget Marché</span>
              <span class="fin-val">{{ p.budgetTotal | number }} DZD</span>
            </div>
            <div class="fin-col">
              <span class="fin-label">Encaissé Client</span>
              <span class="fin-val text-success">{{ p.amountPaid | number }} DZD</span>
            </div>
            <div class="fin-col">
              <span class="fin-label">Reste Dû</span>
              <span class="fin-val text-danger">{{ (p.budgetTotal - p.amountPaid) | number }} DZD</span>
            </div>
          </div>

          <!-- ACTIONS -->
          <div class="p-card-footer" (click)="$event.stopPropagation()">
            <button class="btn btn-primary btn-sm" (click)="openProjectDetails(p)">Fiche Chantier Complète →</button>
            <a routerLink="/tasks" class="btn btn-outline btn-sm">Planning</a>
          </div>
        </div>
      </div>

      <!-- MODAL FICHE CHANTIER COMPLETE (14 SECTIONS DU PROMPT) -->
      <div *ngIf="selectedProject()" class="modal-backdrop" (click)="closeProjectDetails()">
        <div class="modal-box project-modal card" (click)="$event.stopPropagation()">
          <div class="p-modal-header">
            <div>
              <div class="code-and-phase">
                <span class="project-code">{{ selectedProject()?.code }}</span>
                <span class="phase-pill" [ngClass]="getPhaseClass(selectedProject()!.phase)">
                  {{ getPhaseLabel(selectedProject()!.phase) }}
                </span>
              </div>
              <h2 class="p-modal-title">{{ selectedProject()?.title }}</h2>
              <p class="p-modal-sub">
                👤 Client: <strong>{{ selectedProject()?.clientName }}</strong> (📞 {{ selectedProject()?.clientPhone }}) • 
                📍 {{ selectedProject()?.address }}, {{ selectedProject()?.commune }} ({{ selectedProject()?.wilaya }})
              </p>
            </div>
            <button class="close-btn" (click)="closeProjectDetails()">✕</button>
          </div>

          <!-- TIMELINE STRIP DU PROJET -->
          <div class="timeline-strip-box">
            <h4>Timeline du Projet :</h4>
            <div class="timeline-nodes">
              <div *ngFor="let node of selectedProject()?.timeline; let i = index" class="timeline-node" [class.done]="node.completed">
                <div class="node-circle">{{ node.completed ? '✓' : (i + 1) }}</div>
                <div class="node-info">
                  <span class="node-title">{{ node.title }}</span>
                  <span class="node-date">{{ node.date }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- ONGLETS FICHE PROJET -->
          <div class="project-tabs">
            <button class="tab-btn" [class.active]="activeTab() === 'general'" (click)="activeTab.set('general')">
              📊 Vue Globale
            </button>
            <button class="tab-btn" [class.active]="activeTab() === 'equipe'" (click)="activeTab.set('equipe')">
              👷 Équipe & Artisans ({{ selectedProject()?.team?.length || 0 }})
            </button>
            <button class="tab-btn" [class.active]="activeTab() === 'taches'" (click)="activeTab.set('taches')">
              📋 Tâches & Pointage ({{ selectedProject()?.tasks?.length || 0 }})
            </button>
            <button class="tab-btn" [class.active]="activeTab() === 'materiaux'" (click)="activeTab.set('materiaux')">
              🧱 Matériaux & Livraisons ({{ selectedProject()?.materials?.length || 0 }})
            </button>
            <button class="tab-btn" [class.active]="activeTab() === 'paiements'" (click)="activeTab.set('paiements')">
              💰 Règlements & Situations
            </button>
            <button class="tab-btn" [class.active]="activeTab() === 'documents'" (click)="activeTab.set('documents')">
              📁 Plans & Documents ({{ selectedProject()?.documents?.length || 0 }})
            </button>
            <button class="tab-btn" [class.active]="activeTab() === 'photos'" (click)="activeTab.set('photos')">
              📸 Galerie Avant / Pendant / Après
            </button>
          </div>

          <!-- CONTENU DES ONGLETS -->
          <div class="tab-body">
            <!-- 1. VUE GLOBALE -->
            <div *ngIf="activeTab() === 'general'" class="tab-pane">
              <div class="general-grid">
                <div class="card g-card">
                  <h4>Informations Générales</h4>
                  <div class="g-row"><span class="lbl">Date Démarrage ODS :</span> <strong>{{ selectedProject()?.startDate }}</strong></div>
                  <div class="g-row"><span class="lbl">Date Fin Prévue :</span> <strong>{{ selectedProject()?.targetEndDate }}</strong></div>
                  <div class="g-row"><span class="lbl">Conducteur de Travaux :</span> <span>{{ selectedProject()?.manager }}</span></div>
                  <div class="g-row"><span class="lbl">Commune / Wilaya :</span> <span>{{ selectedProject()?.commune }}, {{ selectedProject()?.wilaya }}</span></div>
                </div>

                <div class="card g-card">
                  <h4>Bilan Financier du Chantier</h4>
                  <div class="g-row"><span class="lbl">Montant Global Marché :</span> <strong>{{ selectedProject()?.budgetTotal | number }} DZD</strong></div>
                  <div class="g-row"><span class="lbl">Total Encaissé Client :</span> <strong class="text-success">{{ selectedProject()?.amountPaid | number }} DZD</strong></div>
                  <div class="g-row"><span class="lbl">Reste à Recouvrer :</span> <strong class="text-danger">{{ (selectedProject()!.budgetTotal - selectedProject()!.amountPaid) | number }} DZD</strong></div>
                  <div class="g-row"><span class="lbl">Taux de Recouvrement :</span> <span>{{ ((selectedProject()!.amountPaid / selectedProject()!.budgetTotal) * 100).toFixed(1) }}%</span></div>
                </div>
              </div>
            </div>

            <!-- 2. ÉQUIPE & ARTISANS -->
            <div *ngIf="activeTab() === 'equipe'" class="tab-pane">
              <div class="team-grid">
                <div *ngFor="let m of selectedProject()?.team" class="team-card card">
                  <div class="team-avatar">👷</div>
                  <div class="team-info">
                    <h4>{{ m.name }}</h4>
                    <span class="team-role">{{ m.role }}</span>
                    <span class="team-phone">📞 {{ m.phone }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 3. TÂCHES DU CHANTIER -->
            <div *ngIf="activeTab() === 'taches'" class="tab-pane">
              <div class="table-responsive">
                <table class="btp-table">
                  <thead>
                    <tr>
                      <th>Tâche</th>
                      <th>Corps d'État</th>
                      <th>Responsable</th>
                      <th>Échéance</th>
                      <th>Avancement</th>
                      <th>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let t of selectedProject()?.tasks">
                      <td><strong>{{ t.title }}</strong></td>
                      <td><span class="wilaya-tag">{{ t.trade }}</span></td>
                      <td>{{ t.assignedTo }}</td>
                      <td>{{ t.dueDate }}</td>
                      <td>
                        <div class="progress-wrap">
                          <div class="progress-bar"><div class="progress-fill" [style.width.%]="t.progress"></div></div>
                          <span>{{ t.progress }}%</span>
                        </div>
                      </td>
                      <td><span class="badge" [class.badge-active]="t.status === 'TERMINE'" [class.badge-manager]="t.status === 'EN_COURS'">{{ t.status }}</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- 4. MATÉRIAUX & COMMANDES -->
            <div *ngIf="activeTab() === 'materiaux'" class="tab-pane">
              <div class="table-responsive">
                <table class="btp-table">
                  <thead>
                    <tr>
                      <th>Matériau / Désignation</th>
                      <th>Fournisseur Local</th>
                      <th>Quantité Livrée</th>
                      <th>Date Livraison</th>
                      <th>Coût DZD</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let mat of selectedProject()?.materials">
                      <td><strong>{{ mat.name }}</strong></td>
                      <td>{{ mat.supplier }}</td>
                      <td>{{ mat.quantity }}</td>
                      <td>{{ mat.deliveredDate }}</td>
                      <td class="font-bold">{{ mat.costDzd | number }} DZD</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- 5. PAIEMENTS DU CHANTIER -->
            <div *ngIf="activeTab() === 'paiements'" class="tab-pane">
              <div class="table-responsive">
                <table class="btp-table">
                  <thead>
                    <tr>
                      <th>Réf Facture / Situation</th>
                      <th>Objet du Paiement</th>
                      <th>Date</th>
                      <th>Montant</th>
                      <th>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let pay of selectedProject()?.payments">
                      <td><strong>{{ pay.ref }}</strong></td>
                      <td>{{ pay.title }}</td>
                      <td>{{ pay.date }}</td>
                      <td class="font-bold text-success">{{ pay.amount | number }} DZD</td>
                      <td>
                        <span class="badge" [class.badge-active]="pay.status === 'ENCAISSE'" [class.badge-manager]="pay.status === 'EN_ATTENTE'">
                          {{ pay.status === 'ENCAISSE' ? '✓ Encaissé' : '⏳ En attente' }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- 6. DOCUMENTS & PLANS -->
            <div *ngIf="activeTab() === 'documents'" class="tab-pane">
              <div class="docs-grid">
                <div *ngFor="let d of selectedProject()?.documents" class="doc-card card">
                  <div class="doc-icon">📐</div>
                  <div class="doc-info">
                    <h4>{{ d.name }}</h4>
                    <span class="doc-sub">{{ d.type }} • {{ d.size }} • Ajouté le {{ d.date }}</span>
                  </div>
                  <button class="btn btn-outline btn-xs">Télécharger</button>
                </div>
              </div>
            </div>

            <!-- 7. GALERIE PHOTOS AVANT / PENDANT / APRÈS -->
            <div *ngIf="activeTab() === 'photos'" class="tab-pane">
              <div class="photo-filters">
                <button class="p-filter-btn" [class.active]="selectedPhotoFilter() === 'ALL'" (click)="selectedPhotoFilter.set('ALL')">Toutes les photos</button>
                <button class="p-filter-btn" [class.active]="selectedPhotoFilter() === 'AVANT'" (click)="selectedPhotoFilter.set('AVANT')">📸 Avant Travaux</button>
                <button class="p-filter-btn" [class.active]="selectedPhotoFilter() === 'PENDANT'" (click)="selectedPhotoFilter.set('PENDANT')">🏗️ Pendant Travaux</button>
                <button class="p-filter-btn" [class.active]="selectedPhotoFilter() === 'APRES'" (click)="selectedPhotoFilter.set('APRES')">✨ Après Livraison</button>
              </div>

              <div class="photos-grid">
                <div *ngFor="let ph of filteredPhotos()" class="photo-card card">
                  <div class="photo-thumb">{{ ph.thumbnail }}</div>
                  <div class="photo-footer">
                    <span class="ph-badge" [ngClass]="ph.category.toLowerCase()">{{ ph.category }}</span>
                    <p class="ph-title">{{ ph.title }}</p>
                    <span class="ph-date">{{ ph.date }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-primary" (click)="closeProjectDetails()">Fermer la Fiche Chantier</button>
          </div>
        </div>
      </div>

      <!-- MODAL CREATION NOUVEAU CHANTIER -->
      <div *ngIf="showModal()" class="modal-backdrop">
        <div class="modal-box card">
          <div class="modal-header">
            <h3>Ouverture d'un Nouveau Chantier BTP</h3>
            <button class="close-btn" (click)="showModal.set(false)">✕</button>
          </div>

          <div class="modal-body">
            <div class="form-row">
              <div class="form-group flex-1">
                <label>Code Chantier *</label>
                <input type="text" [(ngModel)]="newProject.code" placeholder="CH-2024-005" />
              </div>
              <div class="form-group flex-2">
                <label>Nom du Client *</label>
                <input type="text" [(ngModel)]="newProject.clientName" placeholder="M. Youcef Belhadj" />
              </div>
            </div>

            <div class="form-group">
              <label>Intitulé des travaux / Chantier *</label>
              <input type="text" [(ngModel)]="newProject.title" placeholder="Construction Bâtiment R+3 / Rénovation Résidence" />
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label>Wilaya *</label>
                <select [(ngModel)]="newProject.wilaya">
                  <option value="16 - Alger">16 - Alger</option>
                  <option value="31 - Oran">31 - Oran</option>
                  <option value="25 - Constantine">25 - Constantine</option>
                  <option value="19 - Sétif">19 - Sétif</option>
                  <option value="09 - Blida">09 - Blida</option>
                </select>
              </div>
              <div class="form-group flex-1">
                <label>Commune *</label>
                <input type="text" [(ngModel)]="newProject.commune" placeholder="Chéraga, Hydra, Bir El Djir..." />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label>Budget Global Marché (DZD) *</label>
                <input type="number" [(ngModel)]="newProject.budgetTotal" placeholder="8500000" />
              </div>
              <div class="form-group flex-1">
                <label>Conducteur assigné *</label>
                <select [(ngModel)]="newProject.manager">
                  <option value="Ing. Rafik K.">Ing. Rafik K. (Conducteur)</option>
                  <option value="Chef Mourad T.">Chef Mourad T. (Chef chantier)</option>
                  <option value="Amine B.">Amine B. (Technico-commercial)</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label>Date Démarrage ODS</label>
                <input type="date" [(ngModel)]="newProject.startDate" />
              </div>
              <div class="form-group flex-1">
                <label>Date Fin Estimée</label>
                <input type="date" [(ngModel)]="newProject.targetEndDate" />
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-outline" (click)="showModal.set(false)">Annuler</button>
            <button class="btn btn-primary" (click)="saveProject()">Créer le Chantier</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .projects-page { display: flex; flex-direction: column; gap: 20px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; }
    .page-subtitle { font-size: 0.875rem; color: var(--text-muted); }
    .filters-card { display: flex; align-items: center; gap: 20px; padding: 14px 20px; flex-wrap: wrap; }
    .filter-group {
      display: flex; align-items: center; gap: 10px;
      label { font-size: 0.825rem; font-weight: 600; color: var(--text-muted); }
      select { padding: 6px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-size: 0.85rem; }
    }
    .summary-info { margin-left: auto; display: flex; gap: 20px; font-size: 0.825rem; }
    .projects-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 20px; }
    .project-card {
      padding: 20px; display: flex; flex-direction: column; gap: 12px;
      cursor: pointer; transition: transform 0.15s ease, box-shadow 0.15s ease;
      &:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
    }
    .p-card-top { display: flex; justify-content: space-between; align-items: center; }
    .code-and-wilaya { display: flex; align-items: center; gap: 8px; }
    .project-code { font-weight: 700; font-size: 0.85rem; color: var(--primary); }
    .wilaya-tag { font-size: 0.75rem; background: #f1f5f9; padding: 3px 8px; border-radius: var(--radius-sm); }
    .phase-pill {
      font-size: 0.7rem; font-weight: 700; padding: 4px 8px; border-radius: var(--radius-full);
      &.phase-installation { background: #e0f2fe; color: #0369a1; }
      &.phase-gros_oeuvre { background: #ffedd5; color: #c2410c; }
      &.phase-second_oeuvre { background: #ede9fe; color: #6d28d9; }
      &.phase-finitions { background: #fef3c7; color: #b45309; }
      &.phase-reception { background: #dcfce7; color: #15803d; }
      &.phase-apres_vente { background: #f1f5f9; color: #475569; }
    }
    .p-title { font-size: 1.05rem; font-weight: 700; margin: 0; }
    .p-client, .p-location { font-size: 0.825rem; color: var(--text-muted); }
    .conductor-box {
      display: flex; justify-content: space-between; font-size: 0.8rem;
      background: #f8fafc; padding: 8px 12px; border-radius: var(--radius-md);
    }
    .progress-section { display: flex; flex-direction: column; gap: 6px; }
    .progress-labels { display: flex; justify-content: space-between; font-size: 0.775rem; color: var(--text-muted); }
    .progress-bar { height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; }
    .progress-fill { height: 100%; background: var(--primary); border-radius: 4px; }
    .financial-strip {
      display: flex; justify-content: space-between; padding-top: 10px;
      border-top: 1px dashed var(--border-color); text-align: center;
    }
    .fin-col { display: flex; flex-direction: column; }
    .fin-label { font-size: 0.7rem; color: var(--text-muted); }
    .fin-val { font-size: 0.825rem; font-weight: 700; }
    .p-card-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 4px; }
    .btn-sm { padding: 6px 12px; font-size: 0.8rem; }
    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(15, 23, 42, 0.7);
      display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px;
    }
    .modal-box {
      width: 100%; max-width: 540px; background: #fff;
      &.project-modal { max-width: 1020px; max-height: 90vh; overflow-y: auto; padding: 28px; }
    }
    .p-modal-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      border-bottom: 1px solid var(--border-color); padding-bottom: 16px; margin-bottom: 18px;
    }
    .code-and-phase { display: flex; gap: 10px; align-items: center; margin-bottom: 6px; }
    .p-modal-title { font-size: 1.35rem; margin: 0; }
    .p-modal-sub { font-size: 0.85rem; color: var(--text-muted); margin-top: 4px; }
    .close-btn { background: none; border: none; font-size: 1.3rem; cursor: pointer; }
    .timeline-strip-box {
      background: #f8fafc; border: 1px solid var(--border-color);
      border-radius: var(--radius-md); padding: 16px; margin-bottom: 20px;
      h4 { font-size: 0.85rem; margin-bottom: 12px; }
    }
    .timeline-nodes { display: flex; justify-content: space-between; gap: 12px; overflow-x: auto; }
    .timeline-node {
      display: flex; align-items: center; gap: 8px; min-width: 140px;
      &.done .node-circle { background: var(--success); color: #fff; }
    }
    .node-circle {
      width: 26px; height: 26px; border-radius: 50%; background: #e2e8f0;
      color: #475569; display: flex; align-items: center; justify-content: center;
      font-size: 0.75rem; font-weight: 700;
    }
    .node-info { display: flex; flex-direction: column; }
    .node-title { font-size: 0.75rem; font-weight: 600; }
    .node-date { font-size: 0.675rem; color: var(--text-muted); }
    .project-tabs {
      display: flex; gap: 8px; border-bottom: 1px solid var(--border-color);
      padding-bottom: 8px; margin-bottom: 20px; overflow-x: auto;
    }
    .tab-btn {
      padding: 8px 12px; font-size: 0.8rem; font-weight: 600; border: none;
      background: none; color: var(--text-muted); cursor: pointer; border-bottom: 2px solid transparent;
      white-space: nowrap;
      &.active { color: var(--primary); border-bottom-color: var(--primary); }
    }
    .tab-body { min-height: 240px; }
    .general-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; @media(max-width:768px){grid-template-columns: 1fr;} }
    .g-card {
      padding: 18px;
      h4 { font-size: 0.95rem; margin-bottom: 14px; border-bottom: 1px solid var(--border-color); padding-bottom: 6px; }
    }
    .g-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #f1f5f9; font-size: 0.85rem; }
    .team-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; }
    .team-card {
      display: flex; align-items: center; gap: 12px; padding: 14px;
      .team-avatar { font-size: 1.8rem; }
      h4 { font-size: 0.9rem; margin: 0; }
      .team-role { font-size: 0.75rem; color: var(--primary); font-weight: 600; display: block; }
      .team-phone { font-size: 0.725rem; color: var(--text-muted); }
    }
    .btp-table {
      width: 100%; border-collapse: collapse; font-size: 0.85rem;
      th { text-align: left; padding: 10px 12px; background: #f8fafc; border-bottom: 1px solid var(--border-color); color: var(--text-muted); }
      td { padding: 10px 12px; border-bottom: 1px solid var(--border-color); }
    }
    .docs-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 12px; }
    .doc-card {
      display: flex; align-items: center; gap: 12px; padding: 12px;
      .doc-icon { font-size: 1.5rem; }
      h4 { font-size: 0.85rem; margin: 0; }
      .doc-sub { font-size: 0.7rem; color: var(--text-muted); }
    }
    .photo-filters { display: flex; gap: 10px; margin-bottom: 16px; }
    .p-filter-btn {
      padding: 6px 12px; font-size: 0.775rem; font-weight: 600; border: 1px solid var(--border-color);
      border-radius: var(--radius-md); background: #fff; cursor: pointer;
      &.active { background: var(--primary); color: #fff; border-color: var(--primary); }
    }
    .photos-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }
    .photo-card {
      padding: 0; overflow: hidden;
      .photo-thumb { height: 130px; background: #e2e8f0; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; }
      .photo-footer { padding: 10px 12px; }
      .ph-badge {
        font-size: 0.65rem; font-weight: 700; padding: 2px 6px; border-radius: 4px;
        &.avant { background: #fee2e2; color: #991b1b; }
        &.pendant { background: #fef3c7; color: #b45309; }
        &.apres { background: #dcfce7; color: #15803d; }
      }
      .ph-title { font-size: 0.8rem; font-weight: 600; margin: 4px 0 2px; }
      .ph-date { font-size: 0.7rem; color: var(--text-muted); }
    }
    .modal-footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; border-top: 1px solid var(--border-color); padding-top: 14px; }
    .form-row { display: flex; gap: 12px; }
    .flex-1 { flex: 1; }
    .flex-2 { flex: 2; }
  `],
})
export class ProjectListComponent {
  filterPhase = 'ALL';
  filterWilaya = 'ALL';
  showModal = signal<boolean>(false);
  selectedProject = signal<ProjectItem | null>(null);
  activeTab = signal<'general' | 'equipe' | 'taches' | 'materiaux' | 'paiements' | 'documents' | 'photos'>('general');
  selectedPhotoFilter = signal<'ALL' | 'AVANT' | 'PENDANT' | 'APRES'>('ALL');

  projects: ProjectItem[] = [
    {
      id: 'proj-1',
      code: 'CH-2024-001',
      title: 'Construction Villa R+2 Moderne (Chéraga)',
      clientName: 'M. Belkacem Brahimi',
      clientPhone: '0550 11 22 33',
      address: 'Lotissement Les Pins, Chéraga',
      wilaya: '16 - Alger',
      commune: 'Chéraga',
      manager: 'Ing. Rafik K. (Conducteur)',
      phase: 'GROS_OEUVRE',
      progressPercent: 65,
      budgetTotal: 14200000,
      amountPaid: 9230000,
      startDate: '15 Aoû 2024',
      targetEndDate: '28 Fév 2025',
      timeline: [
        { title: 'ODS & Terrassement', date: '15 Aoû 2024', completed: true },
        { title: 'Fondations & Semelles', date: '02 Sep 2024', completed: true },
        { title: 'Dalle RDC & Poteaux', date: '20 Sep 2024', completed: true },
        { title: 'Dalle 1er & 2ème Étage', date: '15 Oct 2024', completed: false },
        { title: 'Second Œuvre & Réseaux', date: '15 Déc 2024', completed: false },
        { title: 'Finitions & Réception', date: '28 Fév 2025', completed: false },
      ],
      team: [
        { name: 'Ing. Rafik K.', role: 'Conducteur de Travaux Principal', phone: '0550 99 11 22' },
        { name: 'Chef Mourad T.', role: 'Chef de Chantier Gros Œuvre', phone: '0551 22 33 44' },
        { name: 'Slimane (Ferrailleur)', role: 'Artisan Maçonnerie & Ferraillage', phone: '0552 33 44 55' },
        { name: 'Hocine (Plombier)', role: 'Artisan Plomberie Réseaux', phone: '0553 44 55 66' },
      ],
      tasks: [
        { id: 'T-1', title: 'Ferraillage poteaux 1er étage', trade: 'Gros Œuvre', status: 'TERMINE', progress: 100, assignedTo: 'Slimane', dueDate: '18 Sep' },
        { id: 'T-2', title: 'Coffrage poutres et coulage béton B25', trade: 'Gros Œuvre', status: 'EN_COURS', progress: 70, assignedTo: 'Chef Mourad', dueDate: '26 Sep' },
        { id: 'T-3', title: 'Réservations colonnes montantes eaux usées', trade: 'Plomberie', status: 'A_FAIRE', progress: 0, assignedTo: 'Hocine', dueDate: '30 Sep' },
      ],
      materials: [
        { name: 'Ciment GICA CPJ-CEM II 42.5 (800 sacs)', supplier: 'Dépôt Matériaux Chéraga', quantity: '40 tonnes', deliveredDate: '18 Aoû', costDzd: 760000 },
        { name: 'Rond à béton FeE500 Diam 12, 14, 16', supplier: 'Sider El-Hadjar / Grossiste', quantity: '18 tonnes', deliveredDate: '22 Aoû', costDzd: 2160000 },
        { name: 'Béton prêt à l’emploi B25', supplier: 'Centrale Béton Zéralda', quantity: '95 m³', deliveredDate: '05 Sep', costDzd: 1045000 },
      ],
      payments: [
        { ref: 'SIT-01', title: 'Acompte ODS à la signature (30%)', amount: 4260000, date: '16 Aoû 2024', status: 'ENCAISSE' },
        { ref: 'SIT-02', title: 'Situation Travaux n°1 : Fondations', amount: 4970000, date: '10 Sep 2024', status: 'ENCAISSE' },
        { ref: 'SIT-03', title: 'Situation Travaux n°2 : Dalle RDC', amount: 2840000, date: '30 Sep 2024', status: 'EN_ATTENTE' },
      ],
      documents: [
        { name: 'Plan_Architecture_Villa_R+2.pdf', type: 'Plan', date: '10 Aoû', size: '8.4 Mo' },
        { name: 'Etude_Beton_Arme_Semelles.pdf', type: 'Bureau d’Études (CTC)', date: '12 Aoû', size: '4.2 Mo' },
        { name: 'Permis_Construire_Cheraga.pdf', type: 'Administratif', date: '01 Aoû', size: '1.1 Mo' },
      ],
      photos: [
        { category: 'AVANT', title: 'Terrain naturel avant terrassement', date: '14 Aoû 2024', thumbnail: '🏞️' },
        { category: 'PENDANT', title: 'Coulage gros béton et ferraillage semelles', date: '02 Sep 2024', thumbnail: '🏗️' },
        { category: 'PENDANT', title: 'Élévation des poteaux et poutres RDC', date: '20 Sep 2024', thumbnail: '🧱' },
        { category: 'APRES', title: 'Modèle 3D Rendu architectural attendu', date: 'Projet', thumbnail: '🏡' },
      ],
    },
    {
      id: 'proj-2',
      code: 'CH-2024-002',
      title: 'Aménagement Showroom & Bureaux Commerciaux',
      clientName: 'SARL Numidia Import',
      clientPhone: '0661 44 55 66',
      address: 'Zone d’Activité Bir El Djir',
      wilaya: '31 - Oran',
      commune: 'Bir El Djir',
      manager: 'Chef Mourad T.',
      phase: 'SECOND_OEUVRE',
      progressPercent: 42,
      budgetTotal: 6800000,
      amountPaid: 3400000,
      startDate: '20 Aoû 2024',
      targetEndDate: '15 Nov 2024',
      timeline: [
        { title: 'Démolition cloisons', date: '22 Aoû', completed: true },
        { title: 'Réseau Électricité & Data', date: '10 Sep', completed: true },
        { title: 'Faux-plafonds BA13', date: '30 Sep', completed: false },
        { title: 'Carrelage 60x60', date: '15 Oct', completed: false },
        { title: 'Peinture & Livraison', date: '15 Nov', completed: false },
      ],
      team: [
        { name: 'Chef Mourad T.', role: 'Conducteur de Chantier', phone: '0551 22 33 44' },
        { name: 'Hamid B.', role: 'Électricien Tertiaire', phone: '0560 11 22 33' },
      ],
      tasks: [
        { id: 'T-21', title: 'Pose rails et suspentes BA13', trade: 'Peinture/Plâtrerie', status: 'EN_COURS', progress: 50, assignedTo: 'Kamel', dueDate: '28 Sep' },
      ],
      materials: [
        { name: 'Plaques BA13 Knauf Hydrofuge (350 plaques)', supplier: 'Knauf Algérie Distributeur', quantity: '350 u', deliveredDate: '12 Sep', costDzd: 385000 },
      ],
      payments: [
        { ref: 'SIT-01', title: 'Acompte Marché 50%', amount: 3400000, date: '22 Aoû', status: 'ENCAISSE' },
      ],
      documents: [
        { name: 'Plan_Agencement_Showroom.pdf', type: 'Plan', date: '15 Aoû', size: '3.6 Mo' },
      ],
      photos: [
        { category: 'AVANT', title: 'Plateau nu avant aménagements', date: '20 Aoû', thumbnail: '🏢' },
        { category: 'PENDANT', title: 'Cheminement câbles et ossature BA13', date: '18 Sep', thumbnail: '⚡' },
      ],
    },
  ];

  newProject = {
    code: '',
    title: '',
    clientName: '',
    wilaya: '16 - Alger',
    commune: '',
    budgetTotal: 8500000,
    manager: 'Ing. Rafik K.',
    startDate: '',
    targetEndDate: '',
  };

  filteredProjects(): ProjectItem[] {
    return this.projects.filter((p) => {
      const matchPhase = this.filterPhase === 'ALL' || p.phase === this.filterPhase;
      const matchWilaya = this.filterWilaya === 'ALL' || p.wilaya === this.filterWilaya;
      return matchPhase && matchWilaya;
    });
  }

  totalBudget(): number {
    return this.filteredProjects().reduce((acc, curr) => acc + curr.budgetTotal, 0);
  }

  openProjectDetails(p: ProjectItem): void {
    this.selectedProject.set(p);
    this.activeTab.set('general');
    this.selectedPhotoFilter.set('ALL');
  }

  closeProjectDetails(): void {
    this.selectedProject.set(null);
  }

  filteredPhotos(): ProjectPhoto[] {
    if (!this.selectedProject()) return [];
    if (this.selectedPhotoFilter() === 'ALL') return this.selectedProject()!.photos;
    return this.selectedProject()!.photos.filter((ph) => ph.category === this.selectedPhotoFilter());
  }

  saveProject(): void {
    if (!this.newProject.title || !this.newProject.clientName) return;
    const item: ProjectItem = {
      id: 'proj-' + (this.projects.length + 1),
      code: this.newProject.code || 'CH-2024-00' + (this.projects.length + 1),
      title: this.newProject.title,
      clientName: this.newProject.clientName,
      clientPhone: '0550 00 00 00',
      address: 'Algérie',
      wilaya: this.newProject.wilaya,
      commune: this.newProject.commune || 'Centre',
      manager: this.newProject.manager,
      phase: 'INSTALLATION',
      progressPercent: 5,
      budgetTotal: this.newProject.budgetTotal || 0,
      amountPaid: 0,
      startDate: this.newProject.startDate || 'Aujourd’hui',
      targetEndDate: this.newProject.targetEndDate || 'Dans 6 mois',
      timeline: [
        { title: 'Ouverture Chantier & Installation', date: 'Aujourd’hui', completed: true },
        { title: 'Gros Œuvre', date: 'M+2', completed: false },
        { title: 'Second Œuvre', date: 'M+4', completed: false },
        { title: 'Réception', date: 'M+6', completed: false },
      ],
      team: [{ name: this.newProject.manager, role: 'Conducteur de Travaux', phone: '0550 12 34 56' }],
      tasks: [{ id: 'T-NEW', title: 'Pose clôture chantier et panneau d’information', trade: 'Installation', status: 'EN_COURS', progress: 30, assignedTo: 'Équipe Chantier', dueDate: 'Cette semaine' }],
      materials: [],
      payments: [],
      documents: [],
      photos: [{ category: 'AVANT', title: 'Photo état des lieux initial', date: 'Aujourd’hui', thumbnail: '📷' }],
    };
    this.projects.unshift(item);
    this.showModal.set(false);
  }

  getPhaseClass(phase: ProjectPhase): string {
    return 'phase-' + phase.toLowerCase();
  }

  getPhaseLabel(phase: ProjectPhase): string {
    switch (phase) {
      case 'INSTALLATION': return '1. Installation';
      case 'GROS_OEUVRE': return '2. Gros Œuvre';
      case 'SECOND_OEUVRE': return '3. Second Œuvre';
      case 'FINITIONS': return '4. Finitions';
      case 'RECEPTION': return '5. Réception';
      case 'APRES_VENTE': return '6. Garantie SAV';
    }
  }
}
