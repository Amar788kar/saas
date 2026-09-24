import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export type TaskStatus = 'A_FAIRE' | 'EN_COURS' | 'BLOQUE' | 'TERMINE';
export type TaskPriority = 'URGENT' | 'ELEVE' | 'NORMAL' | 'FAIBLE';

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface BtpTask {
  id: string;
  projectCode: string;
  projectTitle: string;
  title: string;
  trade: string;
  assignedWorker: string;
  workerRole: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  progress: number;
  checklist: SubTask[];
}

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="tasks-page">
      <!-- HEADER -->
      <div class="page-header">
        <div>
          <h2>Tâches, Travaux & Planning des Équipes</h2>
          <p class="page-subtitle">Affectation quotidienne par corps d'état, pointage de l'avancement et checklists chantiers</p>
        </div>
        <div class="header-actions">
          <div class="view-toggle">
            <button class="toggle-btn" [class.active]="viewMode() === 'kanban'" (click)="viewMode.set('kanban')">
              📊 Kanban
            </button>
            <button class="toggle-btn" [class.active]="viewMode() === 'calendar'" (click)="viewMode.set('calendar')">
              📅 Calendrier
            </button>
            <button class="toggle-btn" [class.active]="viewMode() === 'table'" (click)="viewMode.set('table')">
              📋 Liste
            </button>
          </div>
          <button class="btn btn-primary" (click)="showModal.set(true)">
            + Assigner une Tâche
          </button>
        </div>
      </div>

      <!-- TASK STATS SUMMARY -->
      <div class="tasks-stats-row">
        <div class="stat-pill card" (click)="filterStatus = 'ALL'">
          <span class="count">{{ tasks.length }}</span>
          <span class="lbl">Toutes les tâches</span>
        </div>
        <div class="stat-pill card" (click)="filterStatus = 'EN_COURS'">
          <span class="count text-warning">{{ getCount('EN_COURS') }}</span>
          <span class="lbl">En cours d'exécution</span>
        </div>
        <div class="stat-pill card" (click)="filterStatus = 'BLOQUE'">
          <span class="count text-danger">{{ getCount('BLOQUE') }}</span>
          <span class="lbl">Bloquées (Matériaux / Météo)</span>
        </div>
        <div class="stat-pill card" (click)="filterStatus = 'TERMINE'">
          <span class="count text-success">{{ getCount('TERMINE') }}</span>
          <span class="lbl">Validées / Terminées</span>
        </div>
      </div>

      <!-- 1. KANBAN VIEW -->
      <div *ngIf="viewMode() === 'kanban'" class="kanban-board">
        <div *ngFor="let col of kanbanCols" class="kanban-column" [class.done-col]="col.status === 'TERMINE'">
          <div class="col-head" [style.border-top-color]="col.color">
            <span class="col-title">{{ col.title }}</span>
            <span class="col-count">{{ getTasksByStatus(col.status).length }}</span>
          </div>

          <div class="col-cards">
            <div *ngFor="let task of getTasksByStatus(col.status)" class="task-card card">
              <div class="task-card-top">
                <span class="priority-tag" [ngClass]="getPriorityClass(task.priority)">{{ task.priority }}</span>
                <span class="trade-tag">{{ task.trade }}</span>
              </div>

              <h4 class="task-title">{{ task.title }}</h4>
              <p class="task-proj">🏗️ {{ task.projectTitle }} ({{ task.projectCode }})</p>

              <!-- CHECKLIST SUMMARY -->
              <div *ngIf="task.checklist.length > 0" class="checklist-summary">
                <span class="chk-label">Checklist : {{ getCompletedSubtasks(task) }}/{{ task.checklist.length }}</span>
                <div class="subtasks-list">
                  <label *ngFor="let sub of task.checklist" class="subtask-checkbox">
                    <input type="checkbox" [(ngModel)]="sub.completed" (change)="updateTaskProgress(task)" />
                    <span [class.struck]="sub.completed">{{ sub.title }}</span>
                  </label>
                </div>
              </div>

              <div class="task-progress-box">
                <div class="progress-bar">
                  <div class="progress-fill" [style.width.%]="task.progress"></div>
                </div>
                <span class="progress-text">{{ task.progress }}%</span>
              </div>

              <div class="task-card-footer">
                <div class="worker-pill">
                  <span>👷 {{ task.assignedWorker }}</span>
                </div>
                <span class="due-date" [class.urgent-date]="task.priority === 'URGENT'">📅 {{ task.dueDate }}</span>
              </div>

              <!-- ACTION ADVANCE -->
              <div class="advance-strip">
                <button *ngIf="col.status !== 'TERMINE'" class="btn-advance" (click)="advanceStatus(task)">
                  Avancer statut →
                </button>
              </div>
            </div>

            <div *ngIf="getTasksByStatus(col.status).length === 0" class="empty-col">
              Aucune tâche
            </div>
          </div>
        </div>
      </div>

      <!-- 2. CALENDAR VIEW -->
      <div *ngIf="viewMode() === 'calendar'" class="card calendar-card">
        <div class="cal-header">
          <h3>Septembre 2024 — Planning Mensuel des Chantiers</h3>
          <div class="cal-nav">
            <button class="cal-nav-btn">‹</button>
            <span>Aujourd'hui</span>
            <button class="cal-nav-btn">›</button>
          </div>
        </div>

        <div class="cal-grid">
          <div class="cal-day-name">Dim</div>
          <div class="cal-day-name">Lun</div>
          <div class="cal-day-name">Mar</div>
          <div class="cal-day-name">Mer</div>
          <div class="cal-day-name">Jeu</div>
          <div class="cal-day-name">Ven</div>
          <div class="cal-day-name">Sam</div>

          <div *ngFor="let day of calendarDays" class="cal-cell" [class.today]="day.isToday">
            <div class="day-number">{{ day.day }}</div>
            <div class="day-tasks">
              <div
                *ngFor="let t of day.tasks"
                class="cal-task-pill"
                [ngClass]="getPriorityClass(t.priority)"
                [title]="t.title + ' (' + t.assignedWorker + ')'"
              >
                {{ t.title }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. TABLE VIEW -->
      <div *ngIf="viewMode() === 'table'" class="card table-card">
        <div class="table-responsive">
          <table class="btp-table">
            <thead>
              <tr>
                <th>Tâche & Chantier</th>
                <th>Corps d'État</th>
                <th>Assigné à</th>
                <th>Priorité</th>
                <th>Checklist & Avancement</th>
                <th>Échéance</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let t of tasks">
                <td>
                  <div class="cell-main">{{ t.title }}</div>
                  <div class="cell-sub">🏗️ {{ t.projectTitle }} • {{ t.projectCode }}</div>
                </td>
                <td><span class="trade-tag">{{ t.trade }}</span></td>
                <td>
                  <div class="cell-main">👷 {{ t.assignedWorker }}</div>
                  <div class="cell-sub">{{ t.workerRole }}</div>
                </td>
                <td><span class="priority-tag" [ngClass]="getPriorityClass(t.priority)">{{ t.priority }}</span></td>
                <td>
                  <div class="chk-prog">
                    <span class="cell-sub">{{ getCompletedSubtasks(t) }}/{{ t.checklist.length }} étapes</span>
                    <div class="progress-wrap">
                      <div class="progress-bar"><div class="progress-fill" [style.width.%]="t.progress"></div></div>
                      <span>{{ t.progress }}%</span>
                    </div>
                  </div>
                </td>
                <td><span class="due-date" [class.urgent-date]="t.priority === 'URGENT'">{{ t.dueDate }}</span></td>
                <td><span class="badge" [class.badge-active]="t.status === 'TERMINE'" [class.badge-manager]="t.status === 'EN_COURS'">{{ t.status }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- MODAL CREATION TÂCHE -->
      <div *ngIf="showModal()" class="modal-backdrop">
        <div class="modal-box card">
          <div class="modal-header">
            <h3>Assigner une Tâche de Chantier</h3>
            <button class="close-btn" (click)="showModal.set(false)">✕</button>
          </div>

          <div class="modal-body">
            <div class="form-group">
              <label>Intitulé de la tâche *</label>
              <input type="text" [(ngModel)]="newTask.title" placeholder="Ex: Coulage poteaux RDC axe A-C" />
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label>Chantier / Projet *</label>
                <select [(ngModel)]="newTask.projectCode">
                  <option value="CH-2024-001">Villa R+2 Chéraga (CH-2024-001)</option>
                  <option value="CH-2024-002">Showroom Numidia Oran (CH-2024-002)</option>
                  <option value="CH-2024-003">Résidence Les Pins Blida (CH-2024-003)</option>
                </select>
              </div>
              <div class="form-group flex-1">
                <label>Corps d'État</label>
                <select [(ngModel)]="newTask.trade">
                  <option value="Gros Œuvre">Gros Œuvre & Maçonnerie</option>
                  <option value="Plomberie">Plomberie & Chauffage</option>
                  <option value="Électricité">Électricité & Câblage</option>
                  <option value="Peinture">Peinture & Plâtrerie (BA13)</option>
                  <option value="Climatisation">Climatisation HVAC</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label>Assigner à l'artisan / ouvrier *</label>
                <select [(ngModel)]="newTask.assignedWorker">
                  <option value="Slimane B. (Maçon)">Slimane B. (Chef Équipe Maçon)</option>
                  <option value="Hamid B. (Électricien)">Hamid B. (Électricien)</option>
                  <option value="Kamel S. (Plâtrier/Peintre)">Kamel S. (Plâtrier BA13)</option>
                  <option value="Hocine M. (Plombier)">Hocine M. (Plombier)</option>
                  <option value="Chef Mourad T.">Chef Mourad T. (Chef Chantier)</option>
                </select>
              </div>
              <div class="form-group flex-1">
                <label>Priorité</label>
                <select [(ngModel)]="newTask.priority">
                  <option value="URGENT">🚨 URGENT (Bloquant)</option>
                  <option value="ELEVE">Élevé</option>
                  <option value="NORMAL">Normal</option>
                  <option value="FAIBLE">Faible</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label>Date Limite / Échéance</label>
              <input type="date" [(ngModel)]="newTask.dueDate" />
            </div>

            <!-- CHECKLIST ITEMS CREATION -->
            <div class="form-group">
              <label>Sous-tâches (Checklist de validation)</label>
              <div class="chk-input-row">
                <input type="text" [(ngModel)]="newChecklistTitle" placeholder="Ex: Vérifier aplomb des coffrages..." />
                <button type="button" class="btn btn-outline btn-xs" (click)="addSubtaskToNewTask()">+ Ajouter</button>
              </div>
              <ul class="added-chk-list">
                <li *ngFor="let st of newTask.checklist; let i = index">
                  ✓ {{ st.title }}
                </li>
              </ul>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-outline" (click)="showModal.set(false)">Annuler</button>
            <button class="btn btn-primary" (click)="saveTask()">Créer et Assigner</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .tasks-page { display: flex; flex-direction: column; gap: 20px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; }
    .page-subtitle { font-size: 0.875rem; color: var(--text-muted); }
    .header-actions { display: flex; gap: 12px; }
    .view-toggle { display: flex; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 3px; }
    .toggle-btn {
      padding: 6px 12px; font-size: 0.8rem; font-weight: 600; border: none; background: transparent; border-radius: 6px; cursor: pointer; color: var(--text-muted);
      &.active { background: var(--bg-main); color: var(--text-main); box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
    }
    .tasks-stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px; }
    .stat-pill {
      padding: 14px; cursor: pointer; display: flex; flex-direction: column; gap: 2px;
      &:hover { transform: translateY(-2px); }
      .count { font-size: 1.5rem; font-weight: 800; font-family: var(--font-display); }
      .lbl { font-size: 0.775rem; color: var(--text-muted); }
    }
    .kanban-board { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; @media(max-width:900px){grid-template-columns: 1fr;} }
    .kanban-column {
      background: var(--bg-main); border: 1px solid var(--border-color); border-radius: var(--radius-lg);
      display: flex; flex-direction: column; min-height: 500px;
      &.done-col { background: #f0fdf4; border-color: #bbf7d0; }
    }
    .col-head {
      padding: 12px 16px; background: var(--bg-surface); border-top: 4px solid #cbd5e1;
      border-bottom: 1px solid var(--border-color); border-radius: var(--radius-lg) var(--radius-lg) 0 0;
      display: flex; justify-content: space-between; align-items: center;
    }
    .col-title { font-size: 0.85rem; font-weight: 700; }
    .col-count { background: #e2e8f0; font-size: 0.725rem; font-weight: 700; padding: 1px 6px; border-radius: var(--radius-full); }
    .col-cards { padding: 12px; display: flex; flex-direction: column; gap: 12px; flex: 1; overflow-y: auto; }
    .task-card {
      padding: 14px; display: flex; flex-direction: column; gap: 8px;
    }
    .task-card-top { display: flex; justify-content: space-between; }
    .priority-tag {
      font-size: 0.675rem; font-weight: 700; padding: 2px 6px; border-radius: 4px;
      &.priority-urgent { background: #fee2e2; color: #991b1b; }
      &.priority-eleve { background: #ffedd5; color: #c2410c; }
      &.priority-normal { background: #e0f2fe; color: #0369a1; }
      &.priority-faible { background: #f1f5f9; color: #64748b; }
    }
    .trade-tag { font-size: 0.7rem; color: #2563eb; background: #eff6ff; padding: 2px 6px; border-radius: 4px; }
    .task-title { font-size: 0.875rem; font-weight: 700; margin: 0; }
    .task-proj { font-size: 0.75rem; color: var(--text-muted); }
    .checklist-summary {
      background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px; font-size: 0.75rem;
    }
    .chk-label { font-weight: 700; color: #475569; display: block; margin-bottom: 4px; }
    .subtasks-list { display: flex; flex-direction: column; gap: 4px; }
    .subtask-checkbox {
      display: flex; align-items: center; gap: 6px; cursor: pointer;
      .struck { text-decoration: line-through; color: var(--text-muted); }
    }
    .task-progress-box { display: flex; align-items: center; gap: 8px; }
    .progress-bar { flex: 1; height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden; }
    .progress-fill { height: 100%; background: var(--primary); }
    .progress-text { font-size: 0.725rem; font-weight: 700; }
    .task-card-footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed var(--border-color); padding-top: 8px; font-size: 0.75rem; }
    .worker-pill { font-weight: 600; color: #334155; }
    .due-date { color: var(--text-muted); font-weight: 600; &.urgent-date { color: #b91c1c; } }
    .btn-advance {
      width: 100%; padding: 4px; font-size: 0.725rem; font-weight: 600; background: #f8fafc;
      border: 1px solid var(--border-color); border-radius: 4px; cursor: pointer;
      &:hover { background: var(--primary); color: #fff; border-color: var(--primary); }
    }
    .empty-col { text-align: center; color: var(--text-light); font-size: 0.75rem; padding: 30px 0; }
    .calendar-card { padding: 20px; }
    .cal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; h3 { font-size: 1rem; margin: 0; } }
    .cal-nav { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; font-weight: 600; }
    .cal-nav-btn { background: #f1f5f9; border: 1px solid var(--border-color); border-radius: 4px; padding: 2px 8px; cursor: pointer; }
    .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
    .cal-day-name { text-align: center; font-size: 0.75rem; font-weight: 700; color: var(--text-muted); padding: 6px; }
    .cal-cell {
      min-height: 90px; border: 1px solid var(--border-color); border-radius: 4px; padding: 6px; background: #ffffff;
      &.today { background: #fff7ed; border-color: var(--primary-border); }
    }
    .day-number { font-size: 0.75rem; font-weight: 700; margin-bottom: 4px; }
    .day-tasks { display: flex; flex-direction: column; gap: 2px; }
    .cal-task-pill {
      font-size: 0.65rem; padding: 2px 4px; border-radius: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .btp-table {
      width: 100%; border-collapse: collapse; font-size: 0.85rem;
      th { text-align: left; padding: 10px 12px; background: #f8fafc; border-bottom: 1px solid var(--border-color); color: var(--text-muted); }
      td { padding: 10px 12px; border-bottom: 1px solid var(--border-color); }
    }
    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(15, 23, 42, 0.7);
      display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px;
    }
    .modal-box { width: 100%; max-width: 520px; background: #fff; padding: 24px; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; border-bottom: 1px solid var(--border-color); padding-bottom: 10px; }
    .close-btn { background: none; border: none; font-size: 1.2rem; cursor: pointer; }
    .chk-input-row { display: flex; gap: 8px; margin-top: 6px; }
    .added-chk-list { list-style: none; margin-top: 8px; font-size: 0.8rem; color: #16a34a; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; border-top: 1px solid var(--border-color); padding-top: 12px; }
    .form-row { display: flex; gap: 12px; }
    .flex-1 { flex: 1; }
  `],
})
export class TasksComponent {
  viewMode = signal<'kanban' | 'calendar' | 'table'>('kanban');
  filterStatus = 'ALL';
  showModal = signal<boolean>(false);
  newChecklistTitle = '';

  kanbanCols: { status: TaskStatus; title: string; color: string }[] = [
    { status: 'A_FAIRE', title: '1. À Faire', color: '#0284c7' },
    { status: 'EN_COURS', title: '2. En Cours', color: '#ea580c' },
    { status: 'BLOQUE', title: '3. Bloqué / Attente', color: '#dc2626' },
    { status: 'TERMINE', title: '4. Validé / Terminé', color: '#16a34a' },
  ];

  tasks: BtpTask[] = [
    {
      id: 'tsk-1',
      projectCode: 'CH-2024-001',
      projectTitle: 'Villa R+2 Chéraga',
      title: 'Ferraillage et coffrage amorces poteaux',
      trade: 'Gros Œuvre',
      assignedWorker: 'Slimane B.',
      workerRole: 'Chef Équipe Ferrailleur',
      dueDate: 'Aujourd’hui',
      priority: 'URGENT',
      status: 'EN_COURS',
      progress: 75,
      checklist: [
        { id: '1', title: 'Vérification diamètre ronds à béton FeE500', completed: true },
        { id: '2', title: 'Contrôle enrobage cales béton 3cm', completed: true },
        { id: '3', title: 'Validation bureau de contrôle CTC', completed: false },
      ],
    },
    {
      id: 'tsk-2',
      projectCode: 'CH-2024-002',
      projectTitle: 'Showroom Numidia Oran',
      title: 'Pose ossature faux-plafond acoustique BA13',
      trade: 'Peinture & BA13',
      assignedWorker: 'Kamel S.',
      workerRole: 'Artisan Plâtrier',
      dueDate: '28 Sep 2024',
      priority: 'ELEVE',
      status: 'A_FAIRE',
      progress: 0,
      checklist: [
        { id: '4', title: 'Tracé niveau laser au cordex', completed: false },
        { id: '5', title: 'Fixation des suspentes et fourrures F530', completed: false },
        { id: '6', title: 'Passage réservations spots LED', completed: false },
      ],
    },
    {
      id: 'tsk-3',
      projectCode: 'CH-2024-003',
      projectTitle: 'Résidence Les Pins Blida',
      title: 'Attente livraison rouleaux étanchéité Paxalu',
      trade: 'Étanchéité',
      assignedWorker: 'Hocine M.',
      workerRole: 'Artisan Étanchéiste',
      dueDate: 'Hier',
      priority: 'URGENT',
      status: 'BLOQUE',
      progress: 20,
      checklist: [
        { id: '7', title: 'Application primaire d’accrochage bitumineux', completed: true },
        { id: '8', title: 'Pose bicouche bitume élastomère', completed: false },
      ],
    },
    {
      id: 'tsk-4',
      projectCode: 'CH-2024-001',
      projectTitle: 'Villa R+2 Chéraga',
      title: 'Coulage gros béton de propreté semelles',
      trade: 'Gros Œuvre',
      assignedWorker: 'Slimane B.',
      workerRole: 'Chef Équipe Maçon',
      dueDate: '15 Sep 2024',
      priority: 'NORMAL',
      status: 'TERMINE',
      progress: 100,
      checklist: [
        { id: '9', title: 'Implantation axes géomètre', completed: true },
        { id: '10', title: 'Coulage épaisseur 10cm béton B15', completed: true },
      ],
    },
  ];

  calendarDays = [
    { day: 22, isToday: false, tasks: [] },
    { day: 23, isToday: false, tasks: [this.tasks[2]] },
    { day: 24, isToday: true, tasks: [this.tasks[0]] },
    { day: 25, isToday: false, tasks: [] },
    { day: 26, isToday: false, tasks: [this.tasks[1]] },
    { day: 27, isToday: false, tasks: [] },
    { day: 28, isToday: false, tasks: [] },
  ];

  newTask = {
    title: '',
    projectCode: 'CH-2024-001',
    trade: 'Gros Œuvre',
    assignedWorker: 'Slimane B. (Maçon)',
    priority: 'ELEVE' as TaskPriority,
    dueDate: '',
    checklist: [] as SubTask[],
  };

  getCount(status: TaskStatus): number {
    return this.tasks.filter((t) => t.status === status).length;
  }

  getTasksByStatus(status: TaskStatus): BtpTask[] {
    return this.tasks.filter((t) => t.status === status);
  }

  getPriorityClass(p: TaskPriority): string {
    return 'priority-' + p.toLowerCase();
  }

  getCompletedSubtasks(task: BtpTask): number {
    return task.checklist.filter((st) => st.completed).length;
  }

  updateTaskProgress(task: BtpTask): void {
    if (task.checklist.length === 0) return;
    const completed = this.getCompletedSubtasks(task);
    task.progress = Math.round((completed / task.checklist.length) * 100);
    if (task.progress === 100) {
      task.status = 'TERMINE';
    } else if (task.progress > 0 && task.status === 'A_FAIRE') {
      task.status = 'EN_COURS';
    }
  }

  advanceStatus(task: BtpTask): void {
    const sequence: TaskStatus[] = ['A_FAIRE', 'EN_COURS', 'TERMINE'];
    const idx = sequence.indexOf(task.status);
    if (idx >= 0 && idx < sequence.length - 1) {
      task.status = sequence[idx + 1];
      if (task.status === 'TERMINE') {
        task.progress = 100;
        task.checklist.forEach((c) => (c.completed = true));
      }
    }
  }

  addSubtaskToNewTask(): void {
    if (!this.newChecklistTitle.trim()) return;
    this.newTask.checklist.push({
      id: 'st-' + Date.now(),
      title: this.newChecklistTitle.trim(),
      completed: false,
    });
    this.newChecklistTitle = '';
  }

  saveTask(): void {
    if (!this.newTask.title) return;
    const item: BtpTask = {
      id: 'tsk-' + (this.tasks.length + 1),
      projectCode: this.newTask.projectCode,
      projectTitle: this.newTask.projectCode === 'CH-2024-001' ? 'Villa R+2 Chéraga' : 'Showroom Numidia',
      title: this.newTask.title,
      trade: this.newTask.trade,
      assignedWorker: this.newTask.assignedWorker.split(' (')[0],
      workerRole: 'Artisan BTP',
      dueDate: this.newTask.dueDate || 'Dans 3 jours',
      priority: this.newTask.priority,
      status: 'A_FAIRE',
      progress: 0,
      checklist: this.newTask.checklist,
    };
    this.tasks.unshift(item);
    this.showModal.set(false);
    this.newTask = {
      title: '',
      projectCode: 'CH-2024-001',
      trade: 'Gros Œuvre',
      assignedWorker: 'Slimane B. (Maçon)',
      priority: 'ELEVE',
      dueDate: '',
      checklist: [],
    };
  }
}
