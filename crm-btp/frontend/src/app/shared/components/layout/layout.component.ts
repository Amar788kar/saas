import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

interface NavItem {
  label: string;
  labelAr: string;
  route: string;
  icon: string;
  badge?: string;
}

interface NavGroup {
  title: string;
  titleAr: string;
  items: NavItem[];
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="app-layout" [class.dark-mode]="isDarkMode()" [class.rtl-mode]="isRtl()">
      <!-- FIXED SIDEBAR -->
      <aside class="sidebar" [class.mobile-open]="mobileMenuOpen()">
        <div class="sidebar-header">
          <div class="brand">
            <div class="brand-logo">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 21h18M3 10h18M3 7l9-4 9 4M4 10v11M20 10v11M8 14v4M12 14v4M16 14v4"/>
              </svg>
            </div>
            <div class="brand-info">
              <span class="brand-name">BTP CRM</span>
              <span class="brand-badge">Algérie B2B</span>
            </div>
          </div>
          <button class="close-mobile-btn" (click)="mobileMenuOpen.set(false)">✕</button>
        </div>

        <div class="company-quick-card">
          <div class="company-avatar">{{ companyInitials() }}</div>
          <div class="company-details">
            <p class="company-name">{{ currentCompany()?.trade_name || currentCompany()?.name || 'Entreprise BTP' }}</p>
            <p class="company-meta">Wilaya: {{ currentCompany()?.wilaya || '16 - Alger' }}</p>
          </div>
        </div>

        <!-- NAVIGATION LINKS -->
        <nav class="sidebar-nav">
          <div *ngFor="let group of navGroups" class="nav-group">
            <div class="nav-group-title">{{ isRtl() ? group.titleAr : group.title }}</div>
            <a
              *ngFor="let item of group.items"
              [routerLink]="item.route"
              routerLinkActive="active"
              (click)="mobileMenuOpen.set(false)"
              class="nav-link"
            >
              <span class="nav-icon" [innerHTML]="item.icon"></span>
              <span class="nav-text">{{ isRtl() ? item.labelAr : item.label }}</span>
              <span *ngIf="item.badge" class="nav-badge">{{ item.badge }}</span>
            </a>
          </div>
        </nav>

        <!-- SIDEBAR FOOTER -->
        <div class="sidebar-footer">
          <div class="user-strip">
            <div class="user-avatar">{{ userInitials() }}</div>
            <div class="user-info">
              <p class="user-name">{{ currentUser()?.first_name }} {{ currentUser()?.last_name }}</p>
              <p class="user-role">{{ currentUser()?.role_name || currentUser()?.role_code || 'Conducteur' }}</p>
            </div>
            <button class="logout-btn" (click)="logout()" title="Déconnexion">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
              </svg>
            </button>
          </div>
        </div>
      </aside>

      <!-- MAIN WRAPPER -->
      <div class="main-wrapper">
        <!-- FIXED TOP HEADER -->
        <header class="top-header">
          <div class="header-left">
            <button class="mobile-toggle-btn" (click)="mobileMenuOpen.set(!mobileMenuOpen())">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>

            <div class="header-search">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input type="text" placeholder="Rechercher chantier, prospect, client, N° devis..." />
            </div>
          </div>

          <div class="header-right">
            <!-- WILAYA QUICK BADGE -->
            <div class="wilaya-pill">
              <span class="wilaya-dot"></span>
              <span>DZD / الدينار الجزائري</span>
            </div>

            <!-- LANG TOGGLE FR / AR -->
            <button class="header-btn" (click)="toggleLanguage()" [title]="isRtl() ? 'Passer en Français' : 'التحويل إلى العربية'">
              <span class="lang-tag">{{ isRtl() ? 'FR' : 'عربي' }}</span>
            </button>

            <!-- DARK / LIGHT TOGGLE -->
            <button class="header-btn" (click)="toggleTheme()" [title]="isDarkMode() ? 'Mode Clair' : 'Mode Sombre'">
              <svg *ngIf="!isDarkMode()" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
              <svg *ngIf="isDarkMode()" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            </button>

            <!-- NOTIFICATIONS LINK -->
            <a routerLink="/notifications" class="header-btn notif-btn" title="Notifications">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              <span class="notification-indicator"></span>
            </a>

            <!-- USER MENU LINK -->
            <a routerLink="/settings" class="user-badge-header">
              <div class="user-header-avatar">{{ userInitials() }}</div>
              <span class="user-header-name">{{ currentUser()?.first_name }}</span>
            </a>
          </div>
        </header>

        <!-- CONTENT OUTLET -->
        <main class="page-content">
          <router-outlet></router-outlet>
        </main>
      </div>

      <!-- BACKDROP FOR MOBILE -->
      <div
        *ngIf="mobileMenuOpen()"
        class="sidebar-backdrop"
        (click)="mobileMenuOpen.set(false)"
      ></div>
    </div>
  `,
  styles: [`
    .app-layout {
      display: flex;
      min-height: 100vh;
      background-color: var(--bg-main);
      color: var(--text-main);

      &.dark-mode {
        --bg-main: #0b1120;
        --bg-surface: #1e293b;
        --text-main: #f1f5f9;
        --text-muted: #94a3b8;
        --border-color: #334155;
      }

      &.rtl-mode {
        direction: rtl;
        .sidebar {
          left: auto;
          right: 0;
          border-right: none;
          border-left: 1px solid var(--border-color);
        }
        .main-wrapper {
          margin-left: 0;
          margin-right: var(--sidebar-width);
        }
      }
    }

    // SIDEBAR
    .sidebar {
      position: fixed;
      top: 0;
      left: 0;
      bottom: 0;
      width: var(--sidebar-width);
      background-color: var(--bg-sidebar);
      color: #cbd5e1;
      display: flex;
      flex-direction: column;
      z-index: 50;
      transition: transform 0.25s ease;
      border-right: 1px solid rgba(255, 255, 255, 0.08);
    }

    .sidebar-header {
      height: var(--header-height);
      padding: 0 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .brand-logo {
      width: 38px;
      height: 38px;
      border-radius: 8px;
      background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 10px rgba(249, 115, 22, 0.35);
    }

    .brand-name {
      font-family: var(--font-display);
      font-weight: 800;
      font-size: 1.15rem;
      color: #ffffff;
      line-height: 1.1;
      display: block;
    }

    .brand-badge {
      font-size: 0.65rem;
      font-weight: 700;
      color: #fb923c;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }

    .close-mobile-btn {
      display: none;
      background: none;
      border: none;
      color: #94a3b8;
      font-size: 1.25rem;
      cursor: pointer;
    }

    .company-quick-card {
      margin: 12px 14px;
      padding: 10px 12px;
      background-color: rgba(255, 255, 255, 0.05);
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      gap: 10px;
      border: 1px solid rgba(255, 255, 255, 0.06);
    }

    .company-avatar {
      width: 32px;
      height: 32px;
      border-radius: 6px;
      background: #334155;
      color: #f8fafc;
      font-weight: 700;
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .company-name {
      font-weight: 600;
      font-size: 0.85rem;
      color: #f8fafc;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 150px;
    }

    .company-meta {
      font-size: 0.725rem;
      color: #94a3b8;
    }

    .sidebar-nav {
      flex: 1;
      overflow-y: auto;
      padding: 8px 12px 20px;
      scrollbar-width: thin;
      scrollbar-color: #334155 transparent;
    }

    .nav-group {
      margin-bottom: 16px;
    }

    .nav-group-title {
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #64748b;
      padding: 6px 10px 4px;
    }

    .nav-link {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      border-radius: var(--radius-md);
      color: #94a3b8;
      font-size: 0.875rem;
      font-weight: 500;
      transition: all 0.15s ease;
      margin-bottom: 2px;

      &:hover {
        background-color: var(--bg-sidebar-hover);
        color: #ffffff;
      }

      &.active {
        background-color: #f97316;
        color: #ffffff;
        font-weight: 600;
        box-shadow: 0 4px 10px rgba(249, 115, 22, 0.25);

        .nav-icon {
          color: #ffffff;
        }
      }
    }

    .nav-icon {
      width: 18px;
      height: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .nav-badge {
      margin-left: auto;
      background-color: rgba(255, 255, 255, 0.2);
      color: #fff;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 1px 6px;
      border-radius: var(--radius-full);
    }

    .sidebar-footer {
      padding: 12px 14px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      background-color: rgba(0, 0, 0, 0.2);
    }

    .user-strip {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .user-avatar {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: #ea580c;
      color: #fff;
      font-weight: 700;
      font-size: 0.825rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .user-info {
      flex: 1;
      overflow: hidden;
    }

    .user-name {
      font-weight: 600;
      font-size: 0.825rem;
      color: #f8fafc;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .user-role {
      font-size: 0.72rem;
      color: #94a3b8;
    }

    .logout-btn {
      background: none;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      padding: 6px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      transition: all 0.15s ease;

      &:hover {
        background-color: #ef4444;
        color: #ffffff;
      }
    }

    // MAIN WRAPPER & TOP HEADER
    .main-wrapper {
      flex: 1;
      margin-left: var(--sidebar-width);
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .top-header {
      height: var(--header-height);
      background-color: var(--bg-surface);
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      position: sticky;
      top: 0;
      z-index: 40;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
      flex: 1;
      max-width: 480px;
    }

    .mobile-toggle-btn {
      display: none;
      background: none;
      border: 1px solid var(--border-color);
      padding: 6px;
      border-radius: var(--radius-md);
      cursor: pointer;
      color: var(--text-main);
    }

    .header-search {
      display: flex;
      align-items: center;
      gap: 10px;
      background-color: var(--bg-main);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 6px 14px;
      width: 100%;

      svg {
        color: var(--text-muted);
      }

      input {
        border: none;
        background: transparent;
        font-size: 0.875rem;
        color: var(--text-main);
        width: 100%;
        &:focus {
          outline: none;
        }
      }
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .wilaya-pill {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.775rem;
      font-weight: 600;
      color: #ea580c;
      background-color: var(--primary-light);
      border: 1px solid var(--primary-border);
      padding: 5px 10px;
      border-radius: var(--radius-full);
    }

    .wilaya-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: #10b981;
    }

    .header-btn {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
      background-color: var(--bg-surface);
      color: var(--text-muted);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover {
        background-color: var(--bg-main);
        color: var(--text-main);
      }
    }

    .lang-tag {
      font-size: 0.75rem;
      font-weight: 700;
    }

    .notif-btn {
      position: relative;
    }

    .notification-indicator {
      position: absolute;
      top: 6px;
      right: 6px;
      width: 8px;
      height: 8px;
      background-color: var(--primary);
      border-radius: 50%;
      border: 2px solid var(--bg-surface);
    }

    .user-badge-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 10px 4px 4px;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-full);
      background-color: var(--bg-surface);
      cursor: pointer;
      color: var(--text-main);
      font-size: 0.85rem;
      font-weight: 600;

      &:hover {
        background-color: var(--bg-main);
      }
    }

    .user-header-avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background-color: var(--primary);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
    }

    .page-content {
      padding: 24px;
      flex: 1;
      max-width: 1400px;
      width: 100%;
      margin: 0 auto;
    }

    .sidebar-backdrop {
      display: none;
    }

    // RESPONSIVE
    @media (max-width: 1024px) {
      .sidebar {
        transform: translateX(-100%);
        &.mobile-open {
          transform: translateX(0);
        }
      }

      .app-layout.rtl-mode .sidebar {
        transform: translateX(100%);
        &.mobile-open {
          transform: translateX(0);
        }
      }

      .main-wrapper {
        margin-left: 0 !important;
        margin-right: 0 !important;
      }

      .mobile-toggle-btn {
        display: flex;
      }

      .close-mobile-btn {
        display: block;
      }

      .sidebar-backdrop {
        display: block;
        position: fixed;
        inset: 0;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 45;
      }

      .wilaya-pill {
        display: none;
      }
    }
  `],
})
export class LayoutComponent {
  private authService = inject(AuthService);

  currentUser = this.authService.currentUser;
  currentCompany = this.authService.currentCompany;

  mobileMenuOpen = signal<boolean>(false);
  isDarkMode = signal<boolean>(false);
  isRtl = signal<boolean>(false);

  navGroups: NavGroup[] = [
    {
      title: 'Vue d’ensemble',
      titleAr: 'نظرة عامة',
      items: [
        {
          label: 'Tableau de bord',
          labelAr: 'لوحة القيادة',
          route: '/dashboard',
          icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>`,
        },
      ],
    },
    {
      title: 'Cycle Commercial BTP',
      titleAr: 'الدورة التجارية والمقاولات',
      items: [
        {
          label: 'Prospects (Leads)',
          labelAr: 'الزبائن المحتملين',
          route: '/prospects',
          icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>`,
          badge: 'Nouveau',
        },
        {
          label: 'Clients & Contacts',
          labelAr: 'العملاء والجهات',
          route: '/clients',
          icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`,
        },
        {
          label: 'Visites & Métrés',
          labelAr: 'معاينات الموقع والقياسات',
          route: '/visits',
          icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`,
        },
        {
          label: 'Devis & Estimations',
          labelAr: 'عروض الأسعار والتقديرات',
          route: '/quotes',
          icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`,
        },
        {
          label: 'Contrats & Marchés',
          labelAr: 'العقود والصفقات',
          route: '/contracts',
          icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M9 15l2 2 4-4"></path></svg>`,
        },
      ],
    },
    {
      title: 'Gestion de Chantiers',
      titleAr: 'إدارة الورشات والأشغال',
      items: [
        {
          label: 'Chantiers (Projets)',
          labelAr: 'المشاريع والورشات',
          route: '/projects',
          icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`,
        },
        {
          label: 'Tâches & Travaux',
          labelAr: 'المهام ومتابعة العمل',
          route: '/tasks',
          icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>`,
        },
        {
          label: 'Équipes & Artisans',
          labelAr: 'الفرق والحرفيين',
          route: '/employees',
          icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg>`,
        },
        {
          label: 'Matériaux & Stocks',
          labelAr: 'المواد والمخزون',
          route: '/materials',
          icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>`,
        },
      ],
    },
    {
      title: 'Finance & Clôture',
      titleAr: 'المالية والتقارير',
      items: [
        {
          label: 'Paiements & Factures',
          labelAr: 'المدفوعات والمستحقات',
          route: '/payments',
          icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>`,
        },
        {
          label: 'Plans & PV de Réception',
          labelAr: 'المخططات ومحاضر التسليم',
          route: '/documents',
          icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>`,
        },
        {
          label: 'Rapports & Rentabilité',
          labelAr: 'التقارير والمردودية',
          route: '/reports',
          icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>`,
        },
        {
          label: 'Paramètres',
          labelAr: 'الإعدادات',
          route: '/settings',
          icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`,
        },
      ],
    },
  ];

  companyInitials(): string {
    const comp = this.currentCompany();
    if (!comp) return 'BT';
    const name = comp.trade_name || comp.name || 'BTP';
    return name.slice(0, 2).toUpperCase();
  }

  userInitials(): string {
    const user = this.currentUser();
    if (!user) return 'AD';
    return `${user.first_name?.[0] || 'A'}${user.last_name?.[0] || 'D'}`.toUpperCase();
  }

  toggleTheme(): void {
    this.isDarkMode.set(!this.isDarkMode());
  }

  toggleLanguage(): void {
    this.isRtl.set(!this.isRtl());
    document.documentElement.setAttribute('dir', this.isRtl() ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', this.isRtl() ? 'ar' : 'fr');
  }

  logout(): void {
    this.authService.logout();
  }
}
