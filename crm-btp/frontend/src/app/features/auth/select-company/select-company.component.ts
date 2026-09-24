import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { RoleCode } from '../../../core/models/user.model';

interface CompanyOption {
  id: string;
  name: string;
  trade_name: string;
  legal_form: string;
  wilaya: string;
  phone: string;
  activeProjects: number;
  role: RoleCode;
  roleLabel: string;
}

@Component({
  selector: 'app-select-company',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="auth-page">
      <div class="select-comp-card card">
        <div class="header">
          <div class="badge-tag">Multi-Entreprises BTP</div>
          <h1>Sélectionnez votre Espace de Travail</h1>
          <p class="subtitle">Choisissez une entreprise de BTP enregistrée ou créez une nouvelle entité juridique.</p>
        </div>

        <!-- LIST OF AVAILABLE ENTERPRISES -->
        <div class="company-list">
          <div
            *ngFor="let comp of companies"
            class="comp-item"
            [class.selected]="selectedCompanyId() === comp.id"
            (click)="selectedCompanyId.set(comp.id)"
          >
            <div class="comp-icon">{{ comp.name.slice(0, 2).toUpperCase() }}</div>
            <div class="comp-details">
              <div class="comp-top">
                <h4>{{ comp.name }}</h4>
                <span class="role-badge" [ngClass]="getRoleClass(comp.role)">{{ comp.roleLabel }}</span>
              </div>
              <p class="comp-meta">
                📍 {{ comp.wilaya }} • 🏗️ {{ comp.activeProjects }} chantiers actifs • 📞 {{ comp.phone }}
              </p>
            </div>
            <div class="comp-radio">
              <input
                type="radio"
                name="company"
                [checked]="selectedCompanyId() === comp.id"
              />
            </div>
          </div>
        </div>

        <!-- ROLE TEST SWITCHER (TO TEST AS DIFFERENT ROLES) -->
        <div class="role-switcher-box">
          <label class="section-lbl">Tester l'application avec un rôle spécifique :</label>
          <div class="roles-grid">
            <button
              type="button"
              *ngFor="let r of availableRoles"
              class="role-pill"
              [class.active]="selectedRole() === r.code"
              (click)="selectedRole.set(r.code)"
            >
              <span class="role-icon">{{ r.icon }}</span>
              <span class="role-txt">{{ r.label }}</span>
            </button>
          </div>
        </div>

        <!-- ACTIONS -->
        <div class="btn-group">
          <button class="btn btn-outline flex-1" (click)="toggleNewCompanyModal()">
            + Nouvelle Entreprise
          </button>
          <button class="btn btn-primary flex-2" (click)="enterWorkspace()" [disabled]="!selectedCompanyId()">
            Accéder à l'espace BTP CRM →
          </button>
        </div>

        <!-- MODAL NOUVELLE ENTREPRISE -->
        <div *ngIf="showNewModal()" class="modal-backdrop">
          <div class="modal-box card">
            <div class="modal-header">
              <h3>Créer une nouvelle entité BTP</h3>
              <button class="close-btn" (click)="showNewModal.set(false)">✕</button>
            </div>

            <div class="modal-body">
              <div class="form-group">
                <label>Nom de l'entreprise *</label>
                <input type="text" [(ngModel)]="newCompany.name" placeholder="Ex: EURL Bâtiment Moderne" />
              </div>

              <div class="form-row">
                <div class="form-group flex-1">
                  <label>Forme Juridique</label>
                  <select [(ngModel)]="newCompany.legal_form">
                    <option value="SARL">SARL</option>
                    <option value="EURL">EURL</option>
                    <option value="SNC">SNC</option>
                    <option value="SPA">SPA</option>
                    <option value="ARTISAN">Artisan BTP (Indépendant)</option>
                  </select>
                </div>
                <div class="form-group flex-1">
                  <label>Wilaya *</label>
                  <select [(ngModel)]="newCompany.wilaya">
                    <option value="16 - Alger">16 - Alger</option>
                    <option value="31 - Oran">31 - Oran</option>
                    <option value="25 - Constantine">25 - Constantine</option>
                    <option value="19 - Sétif">19 - Sétif</option>
                    <option value="09 - Blida">09 - Blida</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label>Téléphone de contact *</label>
                <input type="text" [(ngModel)]="newCompany.phone" placeholder="0550 12 34 56" />
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn btn-outline" (click)="showNewModal.set(false)">Annuler</button>
              <button class="btn btn-primary" (click)="saveNewCompany()">Créer et rejoindre</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: radial-gradient(circle at 10% 20%, #1e293b 0%, #0f172a 90%);
      padding: 24px;
    }
    .select-comp-card {
      width: 100%;
      max-width: 620px;
      padding: 36px 32px;
    }
    .header {
      margin-bottom: 24px;
      text-align: center;
    }
    .badge-tag {
      display: inline-block;
      padding: 4px 12px;
      background: rgba(249, 115, 22, 0.15);
      color: var(--primary);
      border-radius: var(--radius-full);
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 12px;
    }
    h1 {
      font-size: 1.45rem;
      margin-bottom: 8px;
    }
    .subtitle {
      font-size: 0.875rem;
      color: var(--text-muted);
    }
    .company-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 24px;
    }
    .comp-item {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 16px;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all 0.2s ease;
      background: #ffffff;
      &:hover {
        border-color: var(--primary-border);
        background: var(--bg-main);
      }
      &.selected {
        border-color: var(--primary);
        background: #fff7ed;
      }
    }
    .comp-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      background: #0f172a;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 1rem;
    }
    .comp-details {
      flex: 1;
    }
    .comp-top {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 4px;
      h4 {
        font-size: 0.975rem;
        margin: 0;
      }
    }
    .role-badge {
      font-size: 0.7rem;
      padding: 2px 8px;
      border-radius: var(--radius-full);
      font-weight: 700;
      text-transform: uppercase;
      &.owner { background: #fee2e2; color: #991b1b; }
      &.admin { background: #fee2e2; color: #b91c1c; }
      &.manager { background: #e0e7ff; color: #3730a3; }
      &.commercial { background: #fef3c7; color: #92400e; }
      &.chef_projet { background: #dbeafe; color: #1e40af; }
      &.employee { background: #d1fae5; color: #065f46; }
    }
    .comp-meta {
      font-size: 0.8rem;
      color: var(--text-muted);
    }
    .role-switcher-box {
      margin-bottom: 24px;
      padding: 14px;
      background: #f8fafc;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
    }
    .section-lbl {
      display: block;
      font-size: 0.8rem;
      font-weight: 600;
      color: #334155;
      margin-bottom: 10px;
    }
    .roles-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }
    .role-pill {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 10px;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      background: #ffffff;
      cursor: pointer;
      font-size: 0.775rem;
      font-weight: 600;
      transition: all 0.15s ease;
      &.active {
        border-color: var(--primary);
        background: #fff7ed;
        color: var(--primary);
      }
    }
    .btn-group {
      display: flex;
      gap: 12px;
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
      max-width: 480px;
      background: #fff;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 18px;
    }
    .close-btn {
      background: none;
      border: none;
      font-size: 1.2rem;
      cursor: pointer;
    }
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 20px;
    }
  `],
})
export class SelectCompanyComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  selectedCompanyId = signal<string>('comp-1');
  selectedRole = signal<RoleCode>('ADMIN');
  showNewModal = signal(false);

  companies: CompanyOption[] = [
    {
      id: 'comp-1',
      name: 'SARL BTP El-Binaa Algérie',
      trade_name: 'El-Binaa Construction',
      legal_form: 'SARL',
      wilaya: '16 - Alger (Chéraga)',
      phone: '0550 12 34 56',
      activeProjects: 8,
      role: 'ADMIN',
      roleLabel: 'Gérant (Admin)',
    },
    {
      id: 'comp-2',
      name: 'EURL Atlas Travaux & Finitions',
      trade_name: 'Atlas Travaux',
      legal_form: 'EURL',
      wilaya: '31 - Oran',
      phone: '0560 98 76 54',
      activeProjects: 3,
      role: 'CHEF_PROJET',
      roleLabel: 'Chef de Projet',
    },
    {
      id: 'comp-3',
      name: 'Entreprise Artisanale Belkacemi & Fils',
      trade_name: 'Belkacemi Électricité & Climatisation',
      legal_form: 'ARTISAN',
      wilaya: '09 - Blida',
      phone: '0770 11 22 33',
      activeProjects: 2,
      role: 'OWNER',
      roleLabel: 'Propriétaire (Owner)',
    },
  ];

  availableRoles: { code: RoleCode; label: string; icon: string }[] = [
    { code: 'OWNER', label: 'Owner', icon: '👑' },
    { code: 'ADMIN', label: 'Admin', icon: '👔' },
    { code: 'MANAGER', label: 'Manager', icon: '📋' },
    { code: 'COMMERCIAL', label: 'Commercial', icon: '💼' },
    { code: 'CHEF_PROJET', label: 'Chef de projet', icon: '👷' },
    { code: 'EMPLOYEE', label: 'Employé', icon: '🔨' },
  ];

  newCompany = {
    name: '',
    legal_form: 'SARL',
    wilaya: '16 - Alger',
    phone: '',
  };

  getRoleClass(role: RoleCode): string {
    return role.toLowerCase();
  }

  toggleNewCompanyModal(): void {
    this.showNewModal.set(!this.showNewModal());
  }

  saveNewCompany(): void {
    if (!this.newCompany.name) return;
    const now = new Date().toISOString();
    const newComp: CompanyOption = {
      id: 'comp-' + (this.companies.length + 1),
      name: this.newCompany.name,
      trade_name: this.newCompany.name,
      legal_form: this.newCompany.legal_form,
      wilaya: this.newCompany.wilaya,
      phone: this.newCompany.phone || '0550 00 00 00',
      activeProjects: 0,
      role: 'OWNER',
      roleLabel: 'Propriétaire (Owner)',
    };
    this.companies.unshift(newComp);
    this.selectedCompanyId.set(newComp.id);
    this.showNewModal.set(false);
  }

  enterWorkspace(): void {
    const comp = this.companies.find((c) => c.id === this.selectedCompanyId());
    if (!comp) return;

    const now = new Date().toISOString();
    const roleCode = this.selectedRole();
    const roleInfo = this.availableRoles.find((r) => r.code === roleCode);

    const updatedUser = {
      id: 'user-active-1',
      company_id: comp.id,
      first_name: 'Karim',
      last_name: 'Benali',
      email: 'k.benali@btp-algerie.dz',
      role_id: 1,
      role_code: roleCode,
      role_name: roleInfo?.label || 'Gérant',
      status: 'ACTIVE' as const,
      created_at: now,
      updated_at: now,
    };

    const updatedComp = {
      id: comp.id,
      name: comp.name,
      trade_name: comp.trade_name,
      legal_form: comp.legal_form,
      wilaya: comp.wilaya,
      phone: comp.phone,
      email: 'contact@btp-algerie.dz',
      currency: 'DZD',
      plan: 'PRO' as const,
      status: 'ACTIVE' as const,
      created_at: now,
      updated_at: now,
    };

    this.authService.updateCurrentUser(updatedUser);
    this.authService.updateCurrentCompany(updatedComp);
    this.router.navigate(['/dashboard']);
  }
}
