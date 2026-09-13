// ============================================
// BTP CRM — Main Application Script
// Conçu pour PME BTP & Artisans Algérie
// ============================================

import { icons } from './icons.js';
import { translations, initialData } from './data.js';

// ── Application State ──
const state = {
  lang: localStorage.getItem('btp_lang') || 'fr',
  theme: localStorage.getItem('btp_theme') || 'light',
  page: 'dashboard',
  role: 'owner',
  selectedProject: initialData.projects[0],
  selectedClient: initialData.clients[0],
  prospectViewMode: 'kanban', // 'kanban' or 'list'
  prospectFilterStage: 'all',
  prospectFilterWilaya: 'all',
  taskFilterPriority: 'all',
  data: JSON.parse(JSON.stringify(initialData))
};

// ── Number Formatting Helper (DZD Currency) ──
function formatDA(amount) {
  if (amount === undefined || amount === null) return '0 DA';
  const formatted = Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return state.lang === 'ar' ? `${formatted} دج` : `${formatted} DA`;
}

function t(path) {
  const parts = path.split('.');
  let current = translations[state.lang];
  for (const part of parts) {
    if (!current || current[part] === undefined) {
      // fallback to fr
      let fallback = translations['fr'];
      for (const fpart of parts) {
        if (!fallback || fallback[fpart] === undefined) return path;
        fallback = fallback[fpart];
      }
      return fallback;
    }
    current = current[part];
  }
  return current;
}

// ── Toast System ──
export function showToast(title, message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let iconSvg = icons.checkCircle;
  if (type === 'error') iconSvg = icons.alertCircle;
  if (type === 'warning') iconSvg = icons.alertCircle;
  if (type === 'info') iconSvg = icons.fileText;

  toast.innerHTML = `
    <div class="toast-icon">${iconSvg}</div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
    <div class="toast-close">${icons.close}</div>
  `;

  toast.querySelector('.toast-close').onclick = () => toast.remove();
  container.appendChild(toast);

  setTimeout(() => {
    if (toast.parentElement) {
      toast.style.opacity = '0';
      toast.style.transform = state.lang === 'ar' ? 'translateX(-100%)' : 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }
  }, 4000);
}

// ── Modal System ──
export function openModal(title, bodyHtml, footerHtml = '', maxWidth = '560px') {
  const backdrop = document.getElementById('globalModalBackdrop');
  const modal = document.getElementById('globalModal');
  if (!backdrop || !modal) return;

  modal.style.maxWidth = maxWidth;
  modal.innerHTML = `
    <div class="modal-header">
      <h3 class="modal-title">${title}</h3>
      <button class="modal-close" id="modalCloseBtn" aria-label="Fermer">${icons.close}</button>
    </div>
    <div class="modal-body">${bodyHtml}</div>
    ${footerHtml ? `<div class="modal-footer">${footerHtml}</div>` : ''}
  `;

  backdrop.classList.add('show');
  modal.querySelector('#modalCloseBtn').onclick = closeModal;
}

export function closeModal() {
  const backdrop = document.getElementById('globalModalBackdrop');
  if (backdrop) backdrop.classList.remove('show');
}

// ── Initialize App & Listeners ──
document.addEventListener('DOMContentLoaded', () => {
  initDOM();
  applyTheme(state.theme);
  applyLang(state.lang);
  renderApp();
  setupGlobalEvents();
});

function initDOM() {
  // Brand icon
  const brandIconEl = document.getElementById('brandIcon');
  if (brandIconEl) brandIconEl.innerHTML = icons.hardHat;

  // Header icons
  const sidebarToggleEl = document.getElementById('sidebarToggle');
  if (sidebarToggleEl) sidebarToggleEl.innerHTML = icons.menu;

  const searchIconSpan = document.getElementById('searchIconSpan');
  if (searchIconSpan) searchIconSpan.innerHTML = icons.search;

  const bellIconSpan = document.getElementById('bellIconSpan');
  if (bellIconSpan) bellIconSpan.innerHTML = icons.bell;

  const roleChevronSpan = document.getElementById('roleChevronSpan');
  if (roleChevronSpan) roleChevronSpan.innerHTML = icons.chevronDown;

  // Backdrop click
  const backdrop = document.getElementById('globalModalBackdrop');
  if (backdrop) {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeModal();
    });
  }

  // Keyboard shortcut Ctrl+K
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      const input = document.getElementById('globalSearchInput');
      if (input) input.focus();
    }
    if (e.key === 'Escape') {
      closeModal();
      const roleMenu = document.getElementById('roleSwitcherMenu');
      if (roleMenu) roleMenu.classList.remove('show');
    }
  });
}

function applyTheme(theme) {
  state.theme = theme;
  localStorage.setItem('btp_theme', theme);
  document.documentElement.setAttribute('data-theme', theme);

  const themeIcon = document.getElementById('themeToggleIcon');
  if (themeIcon) {
    themeIcon.innerHTML = theme === 'dark' ? icons.sun : icons.moon;
  }
}

function applyLang(lang) {
  state.lang = lang;
  localStorage.setItem('btp_lang', lang);
  document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
  document.documentElement.setAttribute('lang', lang);

  const langText = document.getElementById('langToggleText');
  if (langText) {
    langText.textContent = lang === 'ar' ? 'Français' : 'عربي';
  }

  const searchInput = document.getElementById('globalSearchInput');
  if (searchInput) {
    searchInput.placeholder = t('search_placeholder');
  }

  const brandTagline = document.getElementById('brandTagline');
  if (brandTagline) {
    brandTagline.textContent = lang === 'ar' ? 'الجزائر • ورشات وحرف' : 'Algérie • Chantiers & Artisans';
  }

  updateBreadcrumb();
  renderSidebar();
  renderRoleSwitcher();
  renderMobileNav();
}

function updateBreadcrumb() {
  const currentSpan = document.getElementById('breadcrumbCurrent');
  const sectionSpan = document.getElementById('breadcrumbSection');
  if (currentSpan) {
    currentSpan.textContent = t(`nav.${state.page}`) || state.page;
  }
  if (sectionSpan) {
    const map = {
      dashboard: t('nav.dashboard'),
      prospects: t('sections.sales'),
      clients: t('sections.sales'),
      visits: t('sections.operations'),
      quotes: t('sections.sales'),
      contracts: t('sections.sales'),
      projects: t('sections.operations'),
      tasks: t('sections.operations'),
      employees: t('sections.finance'),
      materials: t('sections.operations'),
      payments: t('sections.finance'),
      documents: t('sections.system'),
      notifications: t('sections.system'),
      reports: t('sections.system'),
      settings: t('sections.system'),
      auth: 'Authentification'
    };
    sectionSpan.textContent = map[state.page] || 'BTP CRM';
  }
}

// ── Sidebar Navigation ──
function renderSidebar() {
  const navContainer = document.getElementById('sidebarNav');
  if (!navContainer) return;

  const items = [
    { section: t('sections.sales'), items: [
      { id: 'dashboard', icon: 'dashboard', label: t('nav.dashboard') },
      { id: 'prospects', icon: 'prospects', label: t('nav.prospects'), badge: state.data.prospects.filter(p => p.stage === 'new').length },
      { id: 'clients', icon: 'clients', label: t('nav.clients') },
      { id: 'visits', icon: 'visits', label: t('nav.visits'), badge: state.data.visits.filter(v => v.status === 'Confirmée').length },
      { id: 'quotes', icon: 'quotes', label: t('nav.quotes') },
      { id: 'contracts', icon: 'contracts', label: t('nav.contracts') }
    ]},
    { section: t('sections.operations'), items: [
      { id: 'projects', icon: 'projects', label: t('nav.projects'), badge: state.data.projects.length },
      { id: 'tasks', icon: 'tasks', label: t('nav.tasks'), badge: state.data.tasks.filter(t => t.priority === 'Urgente').length },
      { id: 'materials', icon: 'materials', label: t('nav.materials') }
    ]},
    { section: t('sections.finance'), items: [
      { id: 'payments', icon: 'payments', label: t('nav.payments'), badge: state.data.payments.filter(p => p.status === 'En retard').length },
      { id: 'employees', icon: 'employees', label: t('nav.employees') }
    ]},
    { section: t('sections.system'), items: [
      { id: 'documents', icon: 'documents', label: t('nav.documents') },
      { id: 'reports', icon: 'reports', label: t('nav.reports') },
      { id: 'notifications', icon: 'notifications', label: t('nav.notifications'), badge: state.data.notifications.filter(n => n.unread).length },
      { id: 'settings', icon: 'settings', label: t('nav.settings') }
    ]}
  ];

  let html = '';
  for (const group of items) {
    html += `
      <div class="sidebar-section">
        <div class="sidebar-section-title">${group.section}</div>
        ${group.items.map(item => `
          <div class="sidebar-item ${state.page === item.id ? 'active' : ''}" data-nav="${item.id}">
            ${icons[item.icon] || ''}
            <span class="sidebar-item-label">${item.label}</span>
            ${item.badge ? `<span class="sidebar-badge">${item.badge}</span>` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  navContainer.innerHTML = html;

  // Bind click handlers
  navContainer.querySelectorAll('.sidebar-item').forEach(el => {
    el.addEventListener('click', () => {
      const page = el.getAttribute('data-nav');
      navigateTo(page);
      // Close mobile sidebar if open
      const sidebar = document.getElementById('sidebar');
      const overlay = document.getElementById('sidebarOverlay');
      if (sidebar) sidebar.classList.remove('open');
      if (overlay) overlay.classList.remove('show');
    });
  });

  // User details in footer
  const userRoleEl = document.getElementById('sidebarUserRole');
  if (userRoleEl) {
    userRoleEl.textContent = t(`roles.${state.role}`) || state.role;
  }
}

// ── Mobile Bottom Navigation ──
function renderMobileNav() {
  const mobileNav = document.getElementById('mobileNav');
  if (!mobileNav) return;

  const quickNav = [
    { id: 'dashboard', icon: 'dashboard', label: t('nav.dashboard') },
    { id: 'prospects', icon: 'prospects', label: 'CRM' },
    { id: 'projects', icon: 'projects', label: t('nav.projects') },
    { id: 'quotes', icon: 'quotes', label: t('nav.quotes') },
    { id: 'tasks', icon: 'tasks', label: t('nav.tasks') }
  ];

  mobileNav.innerHTML = quickNav.map(item => `
    <div class="mobile-nav-item ${state.page === item.id ? 'active' : ''}" data-nav="${item.id}">
      ${icons[item.icon] || ''}
      <span>${item.label}</span>
    </div>
  `).join('');

  mobileNav.querySelectorAll('.mobile-nav-item').forEach(el => {
    el.addEventListener('click', () => {
      navigateTo(el.getAttribute('data-nav'));
    });
  });
}

// ── Role Switcher ──
function renderRoleSwitcher() {
  const roleLabel = document.getElementById('activeRoleLabel');
  if (roleLabel) {
    roleLabel.textContent = t(`roles.${state.role}`);
  }

  const roleMenu = document.getElementById('roleSwitcherMenu');
  if (!roleMenu) return;

  const roles = [
    { id: 'owner', label: t('roles.owner') },
    { id: 'admin', label: t('roles.admin') },
    { id: 'manager', label: t('roles.manager') },
    { id: 'commercial', label: t('roles.commercial') },
    { id: 'project_manager', label: t('roles.project_manager') },
    { id: 'employee', label: t('roles.employee') }
  ];

  roleMenu.innerHTML = `
    <div style="padding: 4px 8px; font-size: 11px; font-weight: 600; color: var(--text-tertiary); text-transform: uppercase;">
      ${t('common.switch_role')}
    </div>
    ${roles.map(r => `
      <div class="dropdown-item ${state.role === r.id ? 'font-bold text-brand' : ''}" data-role="${r.id}">
        ${state.role === r.id ? icons.check : ''}
        <span>${r.label}</span>
      </div>
    `).join('')}
  `;

  roleMenu.querySelectorAll('.dropdown-item').forEach(el => {
    el.onclick = () => {
      const newRole = el.getAttribute('data-role');
      state.role = newRole;
      roleMenu.classList.remove('show');
      renderRoleSwitcher();
      renderSidebar();
      renderApp();
      showToast(
        state.lang === 'ar' ? 'تم تبديل الصفة' : 'Rôle mis à jour',
        `${t('role')}: ${t(`roles.${newRole}`)}`,
        'success'
      );
    };
  });
}

// ── Navigation Function ──
export function navigateTo(page) {
  state.page = page;
  updateBreadcrumb();
  renderSidebar();
  renderMobileNav();
  renderApp();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Setup Global Event Listeners ──
function setupGlobalEvents() {
  // Mobile sidebar toggle
  const toggleBtn = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');

  if (toggleBtn && sidebar && overlay) {
    toggleBtn.onclick = () => {
      sidebar.classList.toggle('open');
      overlay.classList.toggle('show');
    };
    overlay.onclick = () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('show');
    };
  }

  // Theme Toggle
  const themeBtn = document.getElementById('themeToggleBtn');
  if (themeBtn) {
    themeBtn.onclick = () => {
      applyTheme(state.theme === 'dark' ? 'light' : 'dark');
      showToast(
        state.lang === 'ar' ? 'السمة المرئية' : 'Mode d\'affichage',
        state.theme === 'dark' ? (state.lang === 'ar' ? 'تم تفعيل الوضع الليلي' : 'Mode sombre activé') : (state.lang === 'ar' ? 'تم تفعيل الوضع الفاتح' : 'Mode clair activé'),
        'info'
      );
    };
  }

  // Lang Toggle
  const langBtn = document.getElementById('langToggleBtn');
  if (langBtn) {
    langBtn.onclick = () => {
      applyLang(state.lang === 'fr' ? 'ar' : 'fr');
      renderApp();
      showToast(
        state.lang === 'ar' ? 'تغيير اللغة' : 'Langue changée',
        state.lang === 'ar' ? 'تم تفعيل الواجهة باللغة العربية' : 'Interface basculée en Français',
        'success'
      );
    };
  }

  // Role Switcher Dropdown
  const roleBtn = document.getElementById('roleSwitcherBtn');
  const roleMenu = document.getElementById('roleSwitcherMenu');
  if (roleBtn && roleMenu) {
    roleBtn.onclick = (e) => {
      e.stopPropagation();
      roleMenu.classList.toggle('show');
    };
    document.addEventListener('click', () => {
      roleMenu.classList.remove('show');
    });
  }

  // Notifications Header Icon
  const notifBtn = document.getElementById('headerNotificationsBtn');
  if (notifBtn) {
    notifBtn.onclick = () => navigateTo('notifications');
  }

  // Profile Header click -> settings or auth
  const profileBtn = document.getElementById('headerProfileBtn');
  if (profileBtn) {
    profileBtn.onclick = () => navigateTo('settings');
  }

  const sidebarUserBtn = document.getElementById('sidebarUserBtn');
  if (sidebarUserBtn) {
    sidebarUserBtn.onclick = () => navigateTo('settings');
  }

  // Global Search Input
  const searchInput = document.getElementById('globalSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.trim().toLowerCase();
      if (q.length > 2) {
        handleGlobalSearch(q);
      }
    });
  }
}

function handleGlobalSearch(query) {
  // Check prospects, projects, and clients
  const matchProspect = state.data.prospects.find(p => p.name.toLowerCase().includes(query) || p.company.toLowerCase().includes(query));
  const matchProject = state.data.projects.find(p => p.name.toLowerCase().includes(query) || p.client.toLowerCase().includes(query));
  const matchQuote = state.data.quotes.find(q => q.id.toLowerCase().includes(query) || q.client_name.toLowerCase().includes(query));

  if (matchProject) {
    state.selectedProject = matchProject;
    navigateTo('projects');
    showToast('Recherche rapide', `Chantier trouvé : ${matchProject.name}`, 'info');
  } else if (matchProspect) {
    navigateTo('prospects');
    openProspectModal(matchProspect);
  } else if (matchQuote) {
    navigateTo('quotes');
    showToast('Recherche rapide', `Devis trouvé : ${matchQuote.id}`, 'info');
  }
}

// ============================================
// PAGE RENDERERS
// ============================================

function renderApp() {
  const container = document.getElementById('mainContent');
  if (!container) return;

  switch (state.page) {
    case 'dashboard':
      container.innerHTML = renderDashboardPage();
      bindDashboardEvents();
      break;
    case 'prospects':
      container.innerHTML = renderProspectsPage();
      bindProspectsEvents();
      break;
    case 'clients':
      container.innerHTML = renderClientsPage();
      bindClientsEvents();
      break;
    case 'visits':
      container.innerHTML = renderVisitsPage();
      bindVisitsEvents();
      break;
    case 'quotes':
      container.innerHTML = renderQuotesPage();
      bindQuotesEvents();
      break;
    case 'contracts':
      container.innerHTML = renderContractsPage();
      bindContractsEvents();
      break;
    case 'projects':
      container.innerHTML = renderProjectsPage();
      bindProjectsEvents();
      break;
    case 'tasks':
      container.innerHTML = renderTasksPage();
      bindTasksEvents();
      break;
    case 'employees':
      container.innerHTML = renderEmployeesPage();
      bindEmployeesEvents();
      break;
    case 'materials':
      container.innerHTML = renderMaterialsPage();
      bindMaterialsEvents();
      break;
    case 'payments':
      container.innerHTML = renderPaymentsPage();
      bindPaymentsEvents();
      break;
    case 'documents':
      container.innerHTML = renderDocumentsPage();
      bindDocumentsEvents();
      break;
    case 'notifications':
      container.innerHTML = renderNotificationsPage();
      bindNotificationsEvents();
      break;
    case 'reports':
      container.innerHTML = renderReportsPage();
      bindReportsEvents();
      break;
    case 'settings':
      container.innerHTML = renderSettingsPage();
      bindSettingsEvents();
      break;
    case 'auth':
      container.innerHTML = renderAuthScreen();
      bindAuthEvents();
      break;
    default:
      container.innerHTML = `<div class="empty-state">Page non trouvée</div>`;
  }
}

// ────────────────────────────────────────────
// 1. DASHBOARD PAGE
// ────────────────────────────────────────────
function renderDashboardPage() {
  const d = state.data;
  const isAr = state.lang === 'ar';

  return `
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">${t('dashboard.title')}</h1>
        <p class="page-subtitle">${t('dashboard.subtitle')} • <strong>${d.company.name}</strong></p>
      </div>
      <div class="page-header-actions">
        <button class="btn btn-secondary btn-sm" id="dashPlanVisitBtn">
          ${icons.visits} <span>${isAr ? 'برمجة معاينة' : 'Planifier visite'}</span>
        </button>
        <button class="btn btn-primary btn-sm" id="dashNewQuoteBtn">
          ${icons.plus} <span>${isAr ? 'عرض سعر جديد' : 'Nouveau devis'}</span>
        </button>
      </div>
    </div>

    <!-- Stats Row 1 -->
    <div class="dashboard-stats">
      <div class="card stat-card">
        <div>
          <div class="stat-label">${t('dashboard.revenue')}</div>
          <div class="stat-value font-mono">8 450 000 ${t('currency')}</div>
          <div class="stat-change up">
            ${icons.trendingUp} <span>${t('dashboard.revenue_growth')}</span>
          </div>
        </div>
        <div class="stat-icon-wrap green">${icons.dollarSign}</div>
      </div>

      <div class="card stat-card">
        <div>
          <div class="stat-label">${t('dashboard.pending_quotes')}</div>
          <div class="stat-value font-mono">12 850 000 ${t('currency')}</div>
          <div class="stat-change" style="color: var(--brand-600);">
            ${icons.quotes} <span>4 devis actifs</span>
          </div>
        </div>
        <div class="stat-icon-wrap blue">${icons.quotes}</div>
      </div>

      <div class="card stat-card">
        <div>
          <div class="stat-label">${t('dashboard.payments_received')}</div>
          <div class="stat-value font-mono">7 284 175 ${t('currency')}</div>
          <div class="stat-change up">
            ${icons.checkCircle} <span>5 règlements BNA/BaridiMob</span>
          </div>
        </div>
        <div class="stat-icon-wrap purple">${icons.payments}</div>
      </div>

      <div class="card stat-card">
        <div>
          <div class="stat-label">${t('dashboard.overdue_payments')}</div>
          <div class="stat-value font-mono" style="color: var(--danger-600);">1 450 000 ${t('currency')}</div>
          <div class="stat-change down">
            ${icons.alertCircle} <span>1 retard (+12j)</span>
          </div>
        </div>
        <div class="stat-icon-wrap red">${icons.alertCircle}</div>
      </div>
    </div>

    <!-- Stats Row 2 (Operations) -->
    <div class="grid grid-3" style="margin-bottom: var(--space-6);">
      <div class="card" style="padding: var(--space-4) var(--space-5); display: flex; align-items: center; justify-content: space-between;">
        <div>
          <div class="text-dimmed" style="font-size: var(--text-xs); text-transform: uppercase;">${t('dashboard.active_projects')}</div>
          <div style="font-size: var(--text-2xl); font-weight: 700; margin-top: 2px;">4 Chantiers</div>
          <div style="font-size: var(--text-xs); color: var(--success-600); margin-top: 4px;">• 100% dans les délais contractuels</div>
        </div>
        <div class="stat-icon-wrap blue">${icons.hardHat}</div>
      </div>

      <div class="card" style="padding: var(--space-4) var(--space-5); display: flex; align-items: center; justify-content: space-between;">
        <div>
          <div class="text-dimmed" style="font-size: var(--text-xs); text-transform: uppercase;">${t('dashboard.new_prospects')}</div>
          <div style="font-size: var(--text-2xl); font-weight: 700; margin-top: 2px;">7 Prospects</div>
          <div style="font-size: var(--text-xs); color: var(--brand-600); margin-top: 4px;">• 5 Wilayas représentées</div>
        </div>
        <div class="stat-icon-wrap purple">${icons.prospects}</div>
      </div>

      <div class="card" style="padding: var(--space-4) var(--space-5); display: flex; align-items: center; justify-content: space-between;">
        <div>
          <div class="text-dimmed" style="font-size: var(--text-xs); text-transform: uppercase;">${t('dashboard.conversion_rate')}</div>
          <div style="font-size: var(--text-2xl); font-weight: 700; margin-top: 2px;">64.2%</div>
          <div style="font-size: var(--text-xs); color: var(--text-secondary); margin-top: 4px;">${t('dashboard.avg_ticket')}</div>
        </div>
        <div class="stat-icon-wrap green">${icons.target}</div>
      </div>
    </div>

    <!-- Main Dashboard Grid -->
    <div class="dashboard-main">
      
      <!-- Left Column: Interactive Revenue Chart & Recent Projects -->
      <div style="display: flex; flex-direction: column; gap: var(--space-6);">
        
        <!-- Revenue Bar Chart -->
        <div class="card">
          <div class="card-header">
            <div>
              <h3 class="card-title">${t('dashboard.monthly_revenue_chart')}</h3>
              <p class="card-subtitle">Encaissements réels vs objectifs prévisionnels 2026</p>
            </div>
            <div class="chart-legend">
              <div class="chart-legend-item">
                <span class="chart-legend-dot" style="background: var(--brand-500);"></span>
                <span>Réalisé</span>
              </div>
              <div class="chart-legend-item">
                <span class="chart-legend-dot" style="background: var(--brand-200);"></span>
                <span>Objectif</span>
              </div>
            </div>
          </div>
          <div class="card-body">
            <!-- Dynamic SVG Column Chart -->
            ${renderMonthlySvgChart(d.statsData.monthlyRevenue)}
          </div>
        </div>

        <!-- Recent Projects Card -->
        <div class="card">
          <div class="card-header">
            <div>
              <h3 class="card-title">${t('dashboard.recent_projects')}</h3>
              <p class="card-subtitle">Avancement technique et points de contrôle sur site</p>
            </div>
            <button class="btn btn-ghost btn-sm" id="viewAllProjectsBtn">${t('common.view')} ${icons.chevronRight}</button>
          </div>
          <div class="table-container">
            <table class="table">
              <thead>
                <tr>
                  <th>${t('common.project')}</th>
                  <th>${t('common.client')}</th>
                  <th>${t('common.wilaya')}</th>
                  <th>${t('common.progress')}</th>
                  <th>${t('common.budget')}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                ${d.projects.slice(0, 3).map(p => `
                  <tr>
                    <td>
                      <div class="font-semibold" style="cursor: pointer;" onclick="window.viewProjectDetails('${p.id}')">${p.name}</div>
                      <div style="font-size: var(--text-xs); color: var(--text-tertiary);">${p.team_leader}</div>
                    </td>
                    <td>${p.client}</td>
                    <td><span class="badge badge-gray">${p.wilaya}</span></td>
                    <td style="min-width: 140px;">
                      <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 3px;">
                        <span>${p.progress}%</span>
                        <span class="text-dimmed">${p.status}</span>
                      </div>
                      <div class="progress">
                        <div class="progress-bar ${p.progress > 70 ? 'success' : ''}" style="width: ${p.progress}%;"></div>
                      </div>
                    </td>
                    <td class="font-mono font-semibold">${formatDA(p.budget)}</td>
                    <td>
                      <button class="btn btn-secondary btn-sm" onclick="window.viewProjectDetails('${p.id}')">
                        ${icons.eye}
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <!-- Right Column: Sales Pipeline & Urgent Tasks & Activity -->
      <div style="display: flex; flex-direction: column; gap: var(--space-6);">
        
        <!-- Sales Pipeline Mini -->
        <div class="card">
          <div class="card-header">
            <div>
              <h3 class="card-title">${t('dashboard.sales_pipeline')}</h3>
              <p class="card-subtitle">Entonnoir de conversion des devis</p>
            </div>
            <button class="btn btn-ghost btn-sm" onclick="window.navigateToPage('prospects')">${icons.columns}</button>
          </div>
          <div class="card-body">
            <div class="pipeline-mini">
              ${d.prospectStages.map(stage => {
                const count = d.prospects.filter(p => p.stage === stage.id).length;
                const pct = Math.max(12, (count / d.prospects.length) * 100);
                const colorClass = stage.color === 'green' ? 'var(--success-500)' :
                                   stage.color === 'red' ? 'var(--danger-500)' :
                                   stage.color === 'yellow' ? 'var(--warning-500)' :
                                   stage.color === 'purple' ? '#a855f7' : 'var(--brand-500)';
                return `
                  <div class="pipeline-stage">
                    <div class="pipeline-stage-label">${isAr ? stage.name_ar : stage.name}</div>
                    <div class="pipeline-stage-bar">
                      <div class="pipeline-stage-fill" style="width: ${pct}%; background: ${colorClass};">
                        ${count}
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>

        <!-- Urgent Tasks -->
        <div class="card">
          <div class="card-header">
            <div>
              <h3 class="card-title">${t('dashboard.urgent_tasks')}</h3>
              <p class="card-subtitle">À traiter prioritairement sur chantier</p>
            </div>
            <button class="btn btn-ghost btn-sm" onclick="window.navigateToPage('tasks')">${icons.check}</button>
          </div>
          <div class="card-body" style="padding-top: var(--space-2);">
            <div style="display: flex; flex-direction: column; gap: var(--space-3);">
              ${d.tasks.filter(t => t.priority === 'Urgente' || t.priority === 'Haute').slice(0, 3).map(tk => `
                <div style="padding: var(--space-3); border: 1px solid var(--border-secondary); border-radius: var(--radius-md); background: var(--bg-secondary);">
                  <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: var(--space-2);">
                    <div class="font-semibold" style="font-size: var(--text-sm);">${tk.title}</div>
                    <span class="badge ${tk.priority === 'Urgente' ? 'badge-red' : 'badge-yellow'}">${tk.priority}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-top: var(--space-2); font-size: var(--text-xs); color: var(--text-tertiary);">
                    <span>${tk.assignee}</span>
                    <span class="badge badge-gray">${tk.due_date}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Recent Activity Feed -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">${t('dashboard.recent_activity')}</h3>
          </div>
          <div class="card-body">
            <div class="timeline">
              <div class="timeline-item">
                <div class="timeline-dot green"></div>
                <div class="timeline-time">Il y a 15 min</div>
                <div class="timeline-text">Acompte de <strong>1 824 175 DA</strong> encaissé via BNA (Villa Hydra)</div>
              </div>
              <div class="timeline-item">
                <div class="timeline-dot"></div>
                <div class="timeline-time">Il y a 2 heures</div>
                <div class="timeline-text">Devis <strong>DEV-2026-0144</strong> (8.9M DA) envoyé à Dr. Benali</div>
              </div>
              <div class="timeline-item">
                <div class="timeline-dot yellow"></div>
                <div class="timeline-time">Hier à 16:45</div>
                <div class="timeline-text">Visite planifiée pour Mme. Mansouri à Ouled Yaïch, Blida</div>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  `;
}

function renderMonthlySvgChart(data) {
  const maxVal = 9000000;
  const isAr = state.lang === 'ar';

  return `
    <div style="width: 100%; overflow-x: auto;">
      <svg viewBox="0 0 700 240" style="width: 100%; height: 240px; font-family: inherit;">
        <!-- Grid lines -->
        <line x1="40" y1="20" x2="680" y2="20" stroke="var(--border-secondary)" stroke-dasharray="3,3" />
        <line x1="40" y1="80" x2="680" y2="80" stroke="var(--border-secondary)" stroke-dasharray="3,3" />
        <line x1="40" y1="140" x2="680" y2="140" stroke="var(--border-secondary)" stroke-dasharray="3,3" />
        <line x1="40" y1="200" x2="680" y2="200" stroke="var(--border-primary)" />

        <!-- Y Axis Labels in Millions DA -->
        <text x="35" y="24" fill="var(--text-tertiary)" font-size="10" text-anchor="end">8 M</text>
        <text x="35" y="84" fill="var(--text-tertiary)" font-size="10" text-anchor="end">6 M</text>
        <text x="35" y="144" fill="var(--text-tertiary)" font-size="10" text-anchor="end">3 M</text>
        <text x="35" y="204" fill="var(--text-tertiary)" font-size="10" text-anchor="end">0</text>

        <!-- Bars -->
        ${data.map((d, i) => {
          const x = 60 + i * 68;
          const targetH = (d.target / maxVal) * 180;
          const targetY = 200 - targetH;
          const revH = (d.rev / maxVal) * 180;
          const revY = 200 - revH;
          const label = isAr ? d.month_ar : d.month;

          return `
            <g class="chart-col" data-tooltip="${label}: ${(d.rev/1000000).toFixed(2)} M DA">
              <!-- Target background bar -->
              <rect x="${x}" y="${targetY}" width="18" height="${targetH}" rx="3" fill="var(--brand-100)" opacity="0.8"/>
              <!-- Actual revenue bar -->
              <rect x="${x + 18}" y="${revY}" width="18" height="${revH}" rx="3" fill="var(--brand-600)"/>
              <!-- Month label -->
              <text x="${x + 18}" y="220" fill="var(--text-secondary)" font-size="11" text-anchor="middle">${label}</text>
            </g>
          `;
        }).join('')}
      </svg>
    </div>
  `;
}

function bindDashboardEvents() {
  const planBtn = document.getElementById('dashPlanVisitBtn');
  if (planBtn) planBtn.onclick = () => openPlanVisitModal();

  const newQuoteBtn = document.getElementById('dashNewQuoteBtn');
  if (newQuoteBtn) newQuoteBtn.onclick = () => openNewQuoteModal();

  const viewProjectsBtn = document.getElementById('viewAllProjectsBtn');
  if (viewProjectsBtn) viewProjectsBtn.onclick = () => navigateTo('projects');
}

// ────────────────────────────────────────────
// 2. PROSPECTS & CRM PIPELINE
// ────────────────────────────────────────────
function renderProspectsPage() {
  const d = state.data;
  const isAr = state.lang === 'ar';
  const isKanban = state.prospectViewMode === 'kanban';

  // Filter prospects
  let filtered = d.prospects;
  if (state.prospectFilterStage !== 'all') {
    filtered = filtered.filter(p => p.stage === state.prospectFilterStage);
  }
  if (state.prospectFilterWilaya !== 'all') {
    filtered = filtered.filter(p => p.wilaya.includes(state.prospectFilterWilaya));
  }

  return `
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">${t('nav.prospects')}</h1>
        <p class="page-subtitle">Suivi du cycle commercial BTP : Prospect → Visite → Devis → Négociation → Contrat</p>
      </div>
      <div class="page-header-actions">
        <div class="view-toggle">
          <button class="view-toggle-btn ${isKanban ? 'active' : ''}" id="prospectViewKanbanBtn">
            ${icons.columns} <span>Kanban</span>
          </button>
          <button class="view-toggle-btn ${!isKanban ? 'active' : ''}" id="prospectViewListBtn">
            ${icons.list} <span>${isAr ? 'قائمة' : 'Liste'}</span>
          </button>
        </div>
        <button class="btn btn-primary" id="btnNewProspect">
          ${icons.plus} <span>${isAr ? 'إضافة زبون محتمل' : 'Nouveau Prospect'}</span>
        </button>
      </div>
    </div>

    <!-- Filters Bar -->
    <div class="filters-bar">
      <div class="filter-group">
        <span class="filter-label">${t('common.wilaya')}:</span>
        <select class="filter-select" id="prospectWilayaFilter">
          <option value="all">Toutes les wilayas</option>
          <option value="16">16 - Alger</option>
          <option value="31">31 - Oran</option>
          <option value="09">09 - Blida</option>
          <option value="25">25 - Constantine</option>
          <option value="19">19 - Sétif</option>
          <option value="15">15 - Tizi Ouzou</option>
          <option value="42">42 - Tipaza</option>
        </select>
      </div>

      <div class="filter-group">
        <span class="filter-label">${t('common.status')}:</span>
        <select class="filter-select" id="prospectStageFilter">
          <option value="all">Toutes les étapes</option>
          ${d.prospectStages.map(s => `
            <option value="${s.id}" ${state.prospectFilterStage === s.id ? 'selected' : ''}>${isAr ? s.name_ar : s.name}</option>
          `).join('')}
        </select>
      </div>

      <div style="margin-left: auto; font-size: var(--text-sm); color: var(--text-tertiary);">
        <strong>${filtered.length}</strong> prospects trouvés
      </div>
    </div>

    <!-- Content: Kanban or Table -->
    ${isKanban ? renderProspectsKanban(filtered) : renderProspectsTable(filtered)}
  `;
}

function renderProspectsKanban(prospects) {
  const d = state.data;
  const isAr = state.lang === 'ar';

  return `
    <div class="kanban">
      ${d.prospectStages.map(stage => {
        const stageProspects = prospects.filter(p => p.stage === stage.id);
        const totalBudget = stageProspects.reduce((acc, p) => acc + p.budget, 0);

        return `
          <div class="kanban-column" data-stage="${stage.id}">
            <div class="kanban-column-header">
              <div class="kanban-column-title">
                <span>${isAr ? stage.name_ar : stage.name}</span>
                <span class="kanban-count">${stageProspects.length}</span>
              </div>
              <span style="font-size: 10px; color: var(--text-tertiary); font-family: var(--font-mono);">
                ${formatDA(totalBudget)}
              </span>
            </div>

            <div class="kanban-cards">
              ${stageProspects.map(p => `
                <div class="kanban-card" onclick="window.openProspectModalById('${p.id}')">
                  <div class="badge badge-gray" style="margin-bottom: 6px; font-size: 10px;">${p.wilaya}</div>
                  <div class="kanban-card-title">${p.name}</div>
                  <div style="font-size: var(--text-xs); color: var(--text-secondary); margin-bottom: 8px;">
                    ${p.company} • ${p.project_type}
                  </div>

                  <div style="font-size: var(--text-sm); font-weight: 700; color: var(--brand-600); font-family: var(--font-mono); margin-bottom: 8px;">
                    ${formatDA(p.budget)}
                  </div>

                  <div class="kanban-card-meta">
                    <div style="display: flex; gap: 6px;">
                      <a href="tel:${p.phone}" class="btn btn-ghost btn-sm" style="padding: 2px 6px;" title="Appeler" onclick="event.stopPropagation();">
                        ${icons.phone}
                      </a>
                      <a href="https://wa.me/${p.whatsapp.replace(/\+/g, '')}" target="_blank" class="btn btn-ghost btn-sm" style="padding: 2px 6px; color: #22c55e;" title="WhatsApp" onclick="event.stopPropagation();">
                        ${icons.whatsapp}
                      </a>
                    </div>
                    <span style="font-size: 10px;">${p.next_date}</span>
                  </div>
                </div>
              `).join('')}

              ${stageProspects.length === 0 ? `
                <div style="padding: var(--space-6); text-align: center; color: var(--text-tertiary); font-size: var(--text-xs); border: 1px dashed var(--border-primary); border-radius: var(--radius-md);">
                  Aucun prospect
                </div>
              ` : ''}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderProspectsTable(prospects) {
  return `
    <div class="card">
      <div class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>${t('common.client')}</th>
              <th>Entreprise</th>
              <th>${t('common.wilaya')}</th>
              <th>Type de projet</th>
              <th>${t('common.budget')}</th>
              <th>${t('common.status')}</th>
              <th>Prochaine action</th>
              <th>${t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            ${prospects.map(p => `
              <tr>
                <td>
                  <div class="font-semibold" style="cursor: pointer;" onclick="window.openProspectModalById('${p.id}')">${p.name}</div>
                  <div style="font-size: var(--text-xs); color: var(--text-tertiary);">${p.phone}</div>
                </td>
                <td>${p.company}</td>
                <td><span class="badge badge-gray">${p.wilaya}</span></td>
                <td>${p.project_type}</td>
                <td class="font-mono font-semibold">${formatDA(p.budget)}</td>
                <td>
                  <span class="badge badge-blue">${p.stage}</span>
                </td>
                <td>
                  <div style="font-size: var(--text-xs);">${p.next_action}</div>
                  <div style="font-size: 10px; color: var(--text-tertiary);">${p.next_date}</div>
                </td>
                <td>
                  <div style="display: flex; gap: 4px;">
                    <a href="https://wa.me/${p.whatsapp.replace(/\+/g, '')}" target="_blank" class="btn btn-secondary btn-sm" style="color: #22c55e;" title="WhatsApp">
                      ${icons.whatsapp}
                    </a>
                    <button class="btn btn-secondary btn-sm" onclick="window.openProspectModalById('${p.id}')">
                      ${icons.eye}
                    </button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function bindProspectsEvents() {
  const kanbanBtn = document.getElementById('prospectViewKanbanBtn');
  const listBtn = document.getElementById('prospectViewListBtn');
  if (kanbanBtn && listBtn) {
    kanbanBtn.onclick = () => {
      state.prospectViewMode = 'kanban';
      renderApp();
    };
    listBtn.onclick = () => {
      state.prospectViewMode = 'list';
      renderApp();
    };
  }

  const stageFilter = document.getElementById('prospectStageFilter');
  if (stageFilter) {
    stageFilter.onchange = (e) => {
      state.prospectFilterStage = e.target.value;
      renderApp();
    };
  }

  const wilayaFilter = document.getElementById('prospectWilayaFilter');
  if (wilayaFilter) {
    wilayaFilter.onchange = (e) => {
      state.prospectFilterWilaya = e.target.value;
      renderApp();
    };
  }

  const newBtn = document.getElementById('btnNewProspect');
  if (newBtn) {
    newBtn.onclick = openNewProspectModal;
  }
}

// Open Prospect Detail Modal
export function openProspectModal(p) {
  const isAr = state.lang === 'ar';

  const bodyHtml = `
    <div style="display: flex; flex-direction: column; gap: var(--space-4);">
      
      <!-- Top Badges -->
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: var(--space-2);">
        <span class="badge badge-blue" style="font-size: var(--text-sm);">${p.stage.toUpperCase()}</span>
        <span class="font-mono font-bold" style="font-size: var(--text-xl); color: var(--brand-600);">${formatDA(p.budget)}</span>
      </div>

      <div style="background: var(--bg-secondary); padding: var(--space-4); border-radius: var(--radius-md); border: 1px solid var(--border-secondary);">
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-3); font-size: var(--text-sm);">
          <div>
            <span class="text-dimmed">${t('common.phone')}:</span>
            <div class="font-semibold"><a href="tel:${p.phone}">${p.phone}</a></div>
          </div>
          <div>
            <span class="text-dimmed">WhatsApp:</span>
            <div class="font-semibold">
              <a href="https://wa.me/${p.whatsapp.replace(/\+/g, '')}" target="_blank" style="color: #22c55e; display: inline-flex; align-items: center; gap: 4px;">
                ${icons.whatsapp} ${p.whatsapp}
              </a>
            </div>
          </div>
          <div>
            <span class="text-dimmed">${t('common.wilaya')} / ${t('common.commune')}:</span>
            <div class="font-semibold">${p.wilaya} • ${p.commune}</div>
          </div>
          <div>
            <span class="text-dimmed">Source:</span>
            <div><span class="badge badge-gray">${p.source}</span></div>
          </div>
        </div>

        <div style="margin-top: var(--space-3); font-size: var(--text-sm);">
          <span class="text-dimmed">${t('common.address')}:</span>
          <div>${p.address}</div>
        </div>
      </div>

      <!-- Project details & notes -->
      <div>
        <h4 style="font-size: var(--text-sm); font-weight: 600; margin-bottom: 4px;">Cahier des charges / Descriptif</h4>
        <p style="font-size: var(--text-sm); color: var(--text-secondary); line-height: 1.5; background: var(--bg-tertiary); padding: var(--space-3); border-radius: var(--radius-md);">
          ${p.notes || 'Aucune note particulière.'}
        </p>
      </div>

      <!-- Interactions history -->
      <div>
        <h4 style="font-size: var(--text-sm); font-weight: 600; margin-bottom: var(--space-2);">Historique des échanges</h4>
        <div class="timeline" style="margin-top: var(--space-2);">
          ${p.interactions.map(item => `
            <div class="timeline-item">
              <div class="timeline-dot"></div>
              <div class="timeline-time">${item.date} • ${item.user}</div>
              <div class="timeline-text">${item.text}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Add interaction quick form -->
      <div style="border-top: 1px solid var(--border-secondary); padding-top: var(--space-3);">
        <div class="form-group">
          <label class="form-label" style="font-size: 11px;">Ajouter une note de relance / interaction</label>
          <div style="display: flex; gap: var(--space-2);">
            <input type="text" id="newInteractionText" class="form-input" placeholder="Ex: Devis renégocié au téléphone...">
            <button class="btn btn-secondary btn-sm" id="btnAddInteraction">Ajouter</button>
          </div>
        </div>
      </div>

    </div>
  `;

  const footerHtml = `
    <button class="btn btn-secondary" onclick="window.closeCurrentModal()">${t('common.close')}</button>
    <button class="btn btn-success" id="modalConvertToQuoteBtn">
      ${icons.quotes} <span>Convertir en Devis</span>
    </button>
  `;

  openModal(`Fiche Prospect: ${p.name}`, bodyHtml, footerHtml, '620px');

  const addInterBtn = document.getElementById('btnAddInteraction');
  if (addInterBtn) {
    addInterBtn.onclick = () => {
      const txt = document.getElementById('newInteractionText').value.trim();
      if (txt) {
        p.interactions.unshift({
          date: 'Aujourd\'hui',
          user: t(`roles.${state.role}`),
          text: txt
        });
        showToast('Interaction enregistrée', 'L\'échange a été ajouté à l\'historique', 'success');
        openProspectModal(p);
      }
    };
  }

  const convertBtn = document.getElementById('modalConvertToQuoteBtn');
  if (convertBtn) {
    convertBtn.onclick = () => {
      closeModal();
      openNewQuoteModal(p);
    };
  }
}

// New Prospect Modal
function openNewProspectModal() {
  const isAr = state.lang === 'ar';

  const bodyHtml = `
    <form id="formNewProspect" style="display: flex; flex-direction: column; gap: var(--space-3);">
      <div class="form-group">
        <label class="form-label">Nom complet du contact <span class="required">*</span></label>
        <input type="text" id="inpProspectName" class="form-input" placeholder="Ex: Karim Hadj Ali" required>
      </div>

      <div class="grid grid-2">
        <div class="form-group">
          <label class="form-label">Société / Particulier</label>
          <input type="text" id="inpProspectCompany" class="form-input" placeholder="Ex: SARL Promotion El Bahia">
        </div>
        <div class="form-group">
          <label class="form-label">Téléphone (Algérie) <span class="required">*</span></label>
          <input type="tel" id="inpProspectPhone" class="form-input" placeholder="Ex: 0550 12 34 56" required>
        </div>
      </div>

      <div class="grid grid-2">
        <div class="form-group">
          <label class="form-label">Wilaya <span class="required">*</span></label>
          <select id="inpProspectWilaya" class="form-select" required>
            <option value="16 - Alger">16 - Alger</option>
            <option value="31 - Oran">31 - Oran</option>
            <option value="09 - Blida">09 - Blida</option>
            <option value="25 - Constantine">25 - Constantine</option>
            <option value="19 - Sétif">19 - Sétif</option>
            <option value="15 - Tizi Ouzou">15 - Tizi Ouzou</option>
            <option value="35 - Boumerdès">35 - Boumerdès</option>
            <option value="42 - Tipaza">42 - Tipaza</option>
            <option value="06 - Béjaïa">06 - Béjaïa</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Commune</label>
          <input type="text" id="inpProspectCommune" class="form-input" placeholder="Ex: Dely Ibrahim">
        </div>
      </div>

      <div class="grid grid-2">
        <div class="form-group">
          <label class="form-label">Type de travaux BTP</label>
          <select id="inpProspectType" class="form-select">
            <option value="Rénovation & Aménagement">Rénovation & Aménagement Intérieur</option>
            <option value="Gros Œuvre & Maçonnerie">Gros Œuvre & Maçonnerie</option>
            <option value="Peinture & Décoration">Peinture & Décoration</option>
            <option value="Plomberie & Climatisation">Plomberie & Climatisation CVC</option>
            <option value="Électricité & Domotique">Électricité Bâtiment & Domotique</option>
            <option value="Énergie Solaire Photovoltaïque">Énergie Solaire Photovoltaïque</option>
            <option value="Carrelage & Revêtement Sol">Carrelage & Faïence</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Budget estimé (DZD / DA)</label>
          <input type="number" id="inpProspectBudget" class="form-input font-mono" placeholder="Ex: 3500000" step="50000">
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Source du prospect</label>
        <select id="inpProspectSource" class="form-select">
          <option value="Recommandation">Recommandation client</option>
          <option value="Facebook / Instagram Pro">Facebook / Instagram Pro</option>
          <option value="Chantier voisin">Chantier voisin</option>
          <option value="Ouedkniss Pro">Ouedkniss Pro</option>
          <option value="Bouche à oreille">Bouche à oreille</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Notes & Spécifications</label>
        <textarea id="inpProspectNotes" class="form-textarea" rows="2" placeholder="Détails du projet, contraintes de délais..."></textarea>
      </div>
    </form>
  `;

  const footerHtml = `
    <button class="btn btn-secondary" onclick="window.closeCurrentModal()">${t('common.cancel')}</button>
    <button class="btn btn-primary" id="btnSaveProspect">${t('common.save')}</button>
  `;

  openModal('Nouveau Prospect BTP', bodyHtml, footerHtml, '580px');

  document.getElementById('btnSaveProspect').onclick = () => {
    const name = document.getElementById('inpProspectName').value.trim();
    const phone = document.getElementById('inpProspectPhone').value.trim();
    if (!name || !phone) {
      showToast('Champs requis', 'Veuillez renseigner au moins le nom et le téléphone.', 'warning');
      return;
    }

    const newP = {
      id: `PR-2026-00${state.data.prospects.length + 1}`,
      name,
      company: document.getElementById('inpProspectCompany').value.trim() || 'Particulier',
      phone,
      whatsapp: `+213${phone.replace(/[^0-9]/g, '').slice(-9)}`,
      email: '',
      wilaya: document.getElementById('inpProspectWilaya').value,
      commune: document.getElementById('inpProspectCommune').value.trim() || 'Centre',
      address: document.getElementById('inpProspectCommune').value.trim(),
      project_type: document.getElementById('inpProspectType').value,
      budget: parseFloat(document.getElementById('inpProspectBudget').value) || 1500000,
      source: document.getElementById('inpProspectSource').value,
      stage: 'new',
      next_action: 'Premier appel de découverte',
      next_date: 'Demain',
      notes: document.getElementById('inpProspectNotes').value.trim(),
      interactions: [
        { date: 'Aujourd\'hui', user: t(`roles.${state.role}`), text: 'Fiche prospect créée manuellement.' }
      ]
    };

    state.data.prospects.unshift(newP);
    closeModal();
    renderApp();
    showToast('Prospect ajouté', `${newP.name} a été enregistré avec succès`, 'success');
  };
}

// ────────────────────────────────────────────
// 3. CLIENTS DIRECTORY & PROFILES
// ────────────────────────────────────────────
function renderClientsPage() {
  const d = state.data;
  const isAr = state.lang === 'ar';

  return `
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">${t('nav.clients')}</h1>
        <p class="page-subtitle">Annuaire des maîtres d'ouvrage, promoteurs et particuliers en Algérie</p>
      </div>
      <div class="page-header-actions">
        <button class="btn btn-primary" id="btnNewClient">
          ${icons.plus} <span>${isAr ? 'إضافة عميل' : 'Nouveau Client'}</span>
        </button>
      </div>
    </div>

    <!-- Clients Grid -->
    <div class="grid grid-2" style="margin-bottom: var(--space-6);">
      ${d.clients.map(c => `
        <div class="card" style="padding: var(--space-5); cursor: pointer; transition: all var(--transition-fast);" onclick="window.viewClientProfile('${c.id}')">
          <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: var(--space-3);">
            <div style="display: flex; gap: var(--space-3); align-items: center;">
              <div class="avatar avatar-md" style="background: var(--brand-600);">
                ${c.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 class="font-semibold" style="font-size: var(--text-md);">${c.name}</h3>
                <div style="font-size: var(--text-xs); color: var(--text-secondary);">${c.contact_person} • ${c.wilaya}</div>
              </div>
            </div>
            <span class="badge badge-green">${c.rating}</span>
          </div>

          <div style="margin-top: var(--space-4); padding-top: var(--space-3); border-top: 1px solid var(--border-secondary); display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-2); text-align: center;">
            <div>
              <div class="text-dimmed" style="font-size: 10px; text-transform: uppercase;">Total Chantiers</div>
              <div class="font-mono font-bold" style="font-size: var(--text-sm); margin-top: 2px;">${formatDA(c.total_spent)}</div>
            </div>
            <div>
              <div class="text-dimmed" style="font-size: 10px; text-transform: uppercase;">Projets Actifs</div>
              <div class="font-bold" style="font-size: var(--text-sm); margin-top: 2px;">${c.active_projects_count}</div>
            </div>
            <div>
              <div class="text-dimmed" style="font-size: 10px; text-transform: uppercase;">Devis</div>
              <div class="font-bold" style="font-size: var(--text-sm); margin-top: 2px;">${c.quotes_count}</div>
            </div>
          </div>

          <div style="margin-top: var(--space-3); display: flex; justify-content: space-between; align-items: center; font-size: var(--text-xs); color: var(--text-tertiary);">
            <span>Tél: ${c.phone}</span>
            <span class="text-brand font-semibold" style="display: flex; align-items: center; gap: 2px;">
              Voir profil ${icons.chevronRight}
            </span>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function bindClientsEvents() {
  const newBtn = document.getElementById('btnNewClient');
  if (newBtn) {
    newBtn.onclick = () => {
      showToast('Nouveau Client', 'Formulaire d\'enregistrement client disponible', 'info');
    };
  }
}

export function viewClientProfile(clientId) {
  const client = state.data.clients.find(c => c.id === clientId) || state.data.clients[0];
  state.selectedClient = client;

  const bodyHtml = `
    <div style="display: flex; flex-direction: column; gap: var(--space-4);">
      
      <div style="display: flex; gap: var(--space-4); align-items: center; padding: var(--space-4); background: var(--bg-secondary); border-radius: var(--radius-lg);">
        <div class="avatar avatar-lg" style="background: var(--brand-700);">${client.name.substring(0, 2)}</div>
        <div>
          <h2 style="font-size: var(--text-lg); font-weight: 700;">${client.name}</h2>
          <div style="font-size: var(--text-sm); color: var(--text-secondary);">${client.contact_person} • ${client.commune}, ${client.wilaya}</div>
          <div style="display: flex; gap: var(--space-2); margin-top: var(--space-1);">
            <span class="badge badge-blue">RC: ${client.rc}</span>
            ${client.nif !== '—' ? `<span class="badge badge-gray">NIF: ${client.nif}</span>` : ''}
          </div>
        </div>
      </div>

      <div class="grid grid-2" style="font-size: var(--text-sm);">
        <div>
          <span class="text-dimmed">Coordonnées Téléphoniques:</span>
          <div class="font-semibold">${client.phone}</div>
        </div>
        <div>
          <span class="text-dimmed">Email officiel:</span>
          <div class="font-semibold">${client.email}</div>
        </div>
        <div style="grid-column: 1 / -1;">
          <span class="text-dimmed">Adresse légale:</span>
          <div class="font-semibold">${client.address}</div>
        </div>
      </div>

      <div style="border-top: 1px solid var(--border-secondary); padding-top: var(--space-3);">
        <h4 style="font-size: var(--text-sm); font-weight: 600; margin-bottom: var(--space-2);">Historique des Devis & Factures</h4>
        <div style="display: flex; flex-direction: column; gap: var(--space-2);">
          ${state.data.quotes.filter(q => q.client_name.includes(client.contact_person) || q.client_name.includes(client.name)).map(q => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: var(--space-2) var(--space-3); background: var(--bg-tertiary); border-radius: var(--radius-sm); font-size: var(--text-xs);">
              <div>
                <strong>${q.id}</strong> — ${q.project_title}
              </div>
              <div class="font-mono font-bold">${formatDA(q.total_ttc)}</div>
            </div>
          `).join('') || '<div class="text-dimmed" style="font-size: var(--text-xs);">Aucun devis direct</div>'}
        </div>
      </div>

    </div>
  `;

  openModal(`Profil Client: ${client.name}`, bodyHtml, `<button class="btn btn-secondary" onclick="window.closeCurrentModal()">${t('common.close')}</button>`, '620px');
}

// ────────────────────────────────────────────
// 4. VISITES DE CHANTIER
// ────────────────────────────────────────────
function renderVisitsPage() {
  const d = state.data;
  const isAr = state.lang === 'ar';

  return `
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">${t('nav.visits')}</h1>
        <p class="page-subtitle">Prises de cotes, visites techniques préalables et états des lieux</p>
      </div>
      <div class="page-header-actions">
        <button class="btn btn-primary" id="btnPlanNewVisit">
          ${icons.plus} <span>${isAr ? 'برمجة معاينة جديدة' : 'Planifier une Visite'}</span>
        </button>
      </div>
    </div>

    <div class="grid grid-2">
      ${d.visits.map(v => `
        <div class="card" style="padding: var(--space-5);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-3);">
            <div>
              <span class="badge ${v.status === 'Terminée' ? 'badge-green' : v.status === 'Confirmée' ? 'badge-blue' : 'badge-yellow'}">
                ${v.status}
              </span>
              <h3 class="font-semibold" style="font-size: var(--text-md); margin-top: var(--space-2);">${v.client_name}</h3>
              <div style="font-size: var(--text-xs); color: var(--text-tertiary); display: flex; align-items: center; gap: 4px; margin-top: 2px;">
                ${icons.mapPin} ${v.address}
              </div>
            </div>
            <div style="text-align: right;">
              <div class="font-bold" style="font-size: var(--text-md); color: var(--brand-600);">${v.date}</div>
              <div style="font-size: var(--text-xs); color: var(--text-tertiary);">${v.time}</div>
            </div>
          </div>

          <div style="background: var(--bg-secondary); padding: var(--space-3); border-radius: var(--radius-md); font-size: var(--text-xs); line-height: 1.5; margin-bottom: var(--space-3);">
            <strong>Objet:</strong> ${v.purpose}
          </div>

          <div style="font-size: var(--text-xs); color: var(--text-secondary); border-top: 1px solid var(--border-secondary); padding-top: var(--space-3); display: flex; justify-content: space-between; align-items: center;">
            <span>Technicien: <strong>${v.technician}</strong></span>
            <button class="btn btn-secondary btn-sm" onclick="window.showToast('Rapport de visite', '${v.report}', 'info')">
              ${icons.fileText} Voir rapport
            </button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function bindVisitsEvents() {
  const planBtn = document.getElementById('btnPlanNewVisit');
  if (planBtn) planBtn.onclick = openPlanVisitModal;
}

function openPlanVisitModal() {
  const bodyHtml = `
    <form id="formPlanVisit" style="display: flex; flex-direction: column; gap: var(--space-3);">
      <div class="form-group">
        <label class="form-label">Client / Prospect <span class="required">*</span></label>
        <input type="text" id="inpVisitClient" class="form-input" placeholder="Ex: M. Karim Belhadj" required>
      </div>
      <div class="grid grid-2">
        <div class="form-group">
          <label class="form-label">Date <span class="required">*</span></label>
          <input type="date" id="inpVisitDate" class="form-input" required value="2026-09-16">
        </div>
        <div class="form-group">
          <label class="form-label">Heure <span class="required">*</span></label>
          <input type="time" id="inpVisitTime" class="form-input" required value="10:00">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Adresse / Chantier <span class="required">*</span></label>
        <input type="text" id="inpVisitAddress" class="form-input" placeholder="Ex: Chemin Doudou Mokhtar, Hydra" required>
      </div>
      <div class="form-group">
        <label class="form-label">Technicien / Chef de chantier assigné</label>
        <select id="inpVisitTech" class="form-select">
          ${state.data.employees.map(e => `<option value="${e.name}">${e.name} (${e.role})</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Objectif de la visite</label>
        <textarea id="inpVisitPurpose" class="form-textarea" rows="2" placeholder="Prise de cotes, audit technique étanchéité..."></textarea>
      </div>
    </form>
  `;

  const footerHtml = `
    <button class="btn btn-secondary" onclick="window.closeCurrentModal()">${t('common.cancel')}</button>
    <button class="btn btn-primary" id="btnSaveVisit">Confirmer le rendez-vous</button>
  `;

  openModal('Planifier une Visite de Chantier', bodyHtml, footerHtml);

  document.getElementById('btnSaveVisit').onclick = () => {
    const client = document.getElementById('inpVisitClient').value.trim();
    const address = document.getElementById('inpVisitAddress').value.trim();
    if (!client || !address) {
      showToast('Attention', 'Veuillez remplir les champs obligatoires.', 'warning');
      return;
    }

    state.data.visits.unshift({
      id: `VIS-2026-0${state.data.visits.length + 90}`,
      client_name: client,
      address: address,
      date: document.getElementById('inpVisitDate').value,
      time: document.getElementById('inpVisitTime').value,
      technician: document.getElementById('inpVisitTech').value,
      purpose: document.getElementById('inpVisitPurpose').value || 'Visite technique préalable',
      status: 'Confirmée',
      report: 'En attente de réalisation sur place.'
    });

    closeModal();
    renderApp();
    showToast('Visite programmée', 'Le rendez-vous technique a été enregistré.', 'success');
  };
}

// ────────────────────────────────────────────
// 5. DEVIS & CHIFFRAGE (QUOTE BUILDER)
// ────────────────────────────────────────────
function renderQuotesPage() {
  const d = state.data;
  const isAr = state.lang === 'ar';

  return `
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">${t('nav.quotes')}</h1>
        <p class="page-subtitle">Élaboration de devis BTP détaillés avec TVA algérienne, acomptes et export PDF officiel</p>
      </div>
      <div class="page-header-actions">
        <button class="btn btn-primary" id="btnCreateQuote">
          ${icons.plus} <span>${isAr ? 'إنشاء عرض سعر' : 'Créer un Devis'}</span>
        </button>
      </div>
    </div>

    <!-- Quotes Table -->
    <div class="card">
      <div class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>Réf. Devis</th>
              <th>Date</th>
              <th>${t('common.client')}</th>
              <th>Intitulé du Projet</th>
              <th>Total HT</th>
              <th>Total TTC</th>
              <th>Acompte</th>
              <th>${t('common.status')}</th>
              <th>${t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            ${d.quotes.map(q => `
              <tr>
                <td class="font-mono font-semibold" style="color: var(--brand-600);">${q.id}</td>
                <td>${q.date}</td>
                <td>${q.client_name}</td>
                <td style="max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                  ${q.project_title}
                </td>
                <td class="font-mono">${formatDA(q.total_ht)}</td>
                <td class="font-mono font-bold" style="color: var(--text-primary);">${formatDA(q.total_ttc)}</td>
                <td class="font-mono text-dimmed">${formatDA(q.deposit_amount)} (${q.deposit_percent}%)</td>
                <td>
                  <span class="badge ${q.status === 'Accepté' ? 'badge-green' : q.status === 'Envoyé' ? 'badge-blue' : q.status === 'Négociation' ? 'badge-purple' : 'badge-yellow'}">
                    ${q.status}
                  </span>
                </td>
                <td>
                  <div style="display: flex; gap: 4px;">
                    <button class="btn btn-secondary btn-sm" onclick="window.previewQuotePdf('${q.id}')" title="Aperçu / Télécharger PDF">
                      ${icons.fileText} PDF
                    </button>
                    <button class="btn btn-ghost btn-sm" onclick="window.sendQuoteWhatsApp('${q.id}')" style="color: #22c55e;" title="Envoyer sur WhatsApp">
                      ${icons.whatsapp}
                    </button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function bindQuotesEvents() {
  const createBtn = document.getElementById('btnCreateQuote');
  if (createBtn) createBtn.onclick = () => openNewQuoteModal();
}

// Interactive Quote Builder Modal
function openNewQuoteModal(prefillProspect = null) {
  const isAr = state.lang === 'ar';

  let items = [
    { desc: 'Démolition cloisons briques & évacuation gravats', unit: 'Forfait', qty: 1, price: 150000 },
    { desc: 'Fourniture & pose faux plafonds BA13 hydrofuge', unit: 'm²', qty: 180, price: 2400 },
    { desc: 'Fourniture & pose carrelage grès cérame 60x60', unit: 'm²', qty: 160, price: 3500 }
  ];

  function calculateTotals() {
    let ht = 0;
    items.forEach(it => { ht += (it.qty * it.price); });
    const discount = parseFloat(document.getElementById('qbDiscount')?.value) || 0;
    const discountedHt = ht * (1 - discount / 100);
    const tvaRate = parseFloat(document.getElementById('qbTva')?.value) || 19;
    const tva = discountedHt * (tvaRate / 100);
    const ttc = discountedHt + tva;
    const depositPct = parseFloat(document.getElementById('qbDeposit')?.value) || 30;
    const deposit = ttc * (depositPct / 100);

    const htEl = document.getElementById('qbTotalHt');
    const ttcEl = document.getElementById('qbTotalTtc');
    const depEl = document.getElementById('qbTotalDeposit');

    if (htEl) htEl.textContent = formatDA(discountedHt);
    if (ttcEl) ttcEl.textContent = formatDA(ttc);
    if (depEl) depEl.textContent = formatDA(deposit);
  }

  function renderRows() {
    const tbody = document.getElementById('qbTableBody');
    if (!tbody) return;

    tbody.innerHTML = items.map((item, idx) => `
      <div class="quote-item-row" data-idx="${idx}">
        <input type="text" class="form-input item-desc" value="${item.desc}" placeholder="Désignation de l'ouvrage ou fourniture">
        <select class="form-select item-unit">
          <option value="m²" ${item.unit === 'm²' ? 'selected' : ''}>m²</option>
          <option value="ml" ${item.unit === 'ml' ? 'selected' : ''}>ml</option>
          <option value="Forfait" ${item.unit === 'Forfait' ? 'selected' : ''}>Forfait</option>
          <option value="U" ${item.unit === 'U' ? 'selected' : ''}>U</option>
          <option value="Tonne" ${item.unit === 'Tonne' ? 'selected' : ''}>Tonne</option>
          <option value="Jour" ${item.unit === 'Jour' ? 'selected' : ''}>Jour</option>
        </select>
        <input type="number" class="form-input item-qty font-mono" value="${item.qty}" min="1">
        <input type="number" class="form-input item-price font-mono" value="${item.price}" step="100">
        <div class="font-mono font-semibold" style="font-size: var(--text-sm); text-align: right;">
          ${formatDA(item.qty * item.price)}
        </div>
        <button class="remove-btn" onclick="window.removeQuoteRow(${idx})" title="Supprimer la ligne">
          ${icons.trash}
        </button>
      </div>
    `).join('');

    tbody.querySelectorAll('.item-desc').forEach(el => {
      el.oninput = (e) => {
        const rowIdx = e.target.closest('.quote-item-row').getAttribute('data-idx');
        items[rowIdx].desc = e.target.value;
      };
    });
    tbody.querySelectorAll('.item-unit').forEach(el => {
      el.onchange = (e) => {
        const rowIdx = e.target.closest('.quote-item-row').getAttribute('data-idx');
        items[rowIdx].unit = e.target.value;
      };
    });
    tbody.querySelectorAll('.item-qty').forEach(el => {
      el.oninput = (e) => {
        const rowIdx = e.target.closest('.quote-item-row').getAttribute('data-idx');
        items[rowIdx].qty = parseFloat(e.target.value) || 0;
        calculateTotals();
      };
    });
    tbody.querySelectorAll('.item-price').forEach(el => {
      el.oninput = (e) => {
        const rowIdx = e.target.closest('.quote-item-row').getAttribute('data-idx');
        items[rowIdx].price = parseFloat(e.target.value) || 0;
        calculateTotals();
      };
    });

    calculateTotals();
  }

  window.removeQuoteRow = (idx) => {
    if (items.length <= 1) {
      showToast('Action impossible', 'Le devis doit comporter au moins un article', 'warning');
      return;
    }
    items.splice(idx, 1);
    renderRows();
  };

  const clientNamePrefill = prefillProspect ? prefillProspect.name : 'M. Karim Belhadj';
  const projectTitlePrefill = prefillProspect ? prefillProspect.project_type : 'Travaux d\'aménagement et de finition';

  const bodyHtml = `
    <div style="display: flex; flex-direction: column; gap: var(--space-4);">
      
      <div class="grid grid-2">
        <div class="form-group">
          <label class="form-label">Client destinataire <span class="required">*</span></label>
          <input type="text" id="qbClientName" class="form-input" value="${clientNamePrefill}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Intitulé du Chantier / Projet <span class="required">*</span></label>
          <input type="text" id="qbProjectTitle" class="form-input" value="${projectTitlePrefill}" required>
        </div>
      </div>

      <!-- Item rows header -->
      <div style="border-top: 1px solid var(--border-secondary); padding-top: var(--space-3);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-2);">
          <span style="font-size: var(--text-sm); font-weight: 600;">Articles et Prestations BTP</span>
          <button class="btn btn-secondary btn-sm" id="qbAddRowBtn">
            ${icons.plus} Ajouter un ouvrage
          </button>
        </div>

        <div id="qbTableBody" style="display: flex; flex-direction: column; gap: var(--space-2); max-height: 240px; overflow-y: auto;">
          <!-- Dynamically populated rows -->
        </div>
      </div>

      <!-- Financial Calculation Parameters -->
      <div style="background: var(--bg-secondary); padding: var(--space-4); border-radius: var(--radius-md); border: 1px solid var(--border-secondary);">
        <div class="grid grid-3" style="margin-bottom: var(--space-3);">
          <div class="form-group">
            <label class="form-label" style="font-size: 11px;">Remise commerciale (%)</label>
            <input type="number" id="qbDiscount" class="form-input font-mono" value="0" min="0" max="50">
          </div>
          <div class="form-group">
            <label class="form-label" style="font-size: 11px;">TVA Algérie</label>
            <select id="qbTva" class="form-select font-mono">
              <option value="19" selected>19% (Taux Normal BTP)</option>
              <option value="9">9% (Taux Réduit Logement)</option>
              <option value="0">0% (Exonération / Achat en franchise)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" style="font-size: 11px;">Acompte requis (%)</label>
            <select id="qbDeposit" class="form-select font-mono">
              <option value="30">30% à la signature</option>
              <option value="40" selected>40% approvisionnement</option>
              <option value="50">50%</option>
            </select>
          </div>
        </div>

        <!-- Calculated Summary Lines -->
        <div style="display: flex; justify-content: space-between; font-size: var(--text-sm); padding: 4px 0;">
          <span class="text-dimmed">Total Hors Taxes (HT):</span>
          <span class="font-mono font-semibold" id="qbTotalHt">0 DA</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: var(--text-sm); padding: 4px 0;">
          <span class="text-dimmed">Montant de l'acompte de démarrage:</span>
          <span class="font-mono" style="color: var(--brand-600);" id="qbTotalDeposit">0 DA</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: var(--text-lg); font-weight: 700; border-top: 1px solid var(--border-primary); padding-top: var(--space-2); margin-top: var(--space-2);">
          <span>Total TTC (DZD):</span>
          <span class="font-mono" style="color: var(--success-600);" id="qbTotalTtc">0 DA</span>
        </div>
      </div>

    </div>
  `;

  const footerHtml = `
    <button class="btn btn-secondary" onclick="window.closeCurrentModal()">${t('common.cancel')}</button>
    <button class="btn btn-primary" id="qbSaveQuoteBtn">
      ${icons.check} Enregistrer le Devis
    </button>
  `;

  openModal('Générateur de Devis BTP (Chiffrage)', bodyHtml, footerHtml, '740px');

  renderRows();

  document.getElementById('qbAddRowBtn').onclick = () => {
    items.push({ desc: 'Nouvelle prestation ou matériau', unit: 'U', qty: 1, price: 10000 });
    renderRows();
  };

  document.getElementById('qbDiscount').oninput = calculateTotals;
  document.getElementById('qbTva').onchange = calculateTotals;
  document.getElementById('qbDeposit').onchange = calculateTotals;

  document.getElementById('qbSaveQuoteBtn').onclick = () => {
    const clientName = document.getElementById('qbClientName').value.trim();
    const projectTitle = document.getElementById('qbProjectTitle').value.trim();

    if (!clientName || !projectTitle) {
      showToast('Champs requis', 'Veuillez renseigner le client et l\'intitulé.', 'warning');
      return;
    }

    let ht = 0;
    items.forEach(it => { ht += (it.qty * it.price); });
    const disc = parseFloat(document.getElementById('qbDiscount').value) || 0;
    const discountedHt = ht * (1 - disc / 100);
    const tvaVal = parseFloat(document.getElementById('qbTva').value) || 19;
    const tvaAmount = discountedHt * (tvaVal / 100);
    const ttc = discountedHt + tvaAmount;
    const depPct = parseFloat(document.getElementById('qbDeposit').value) || 40;

    const newQuote = {
      id: `DEV-2026-0${state.data.quotes.length + 145}`,
      date: new Date().toLocaleDateString('fr-DZ'),
      valid_until: '30 jours',
      client_id: 'CL-NEW',
      client_name: clientName,
      project_title: projectTitle,
      wilaya: '16 - Alger',
      status: 'Envoyé',
      items: items.map(it => ({ ...it, total: it.qty * it.price })),
      discount_percent: disc,
      tva_percent: tvaVal,
      deposit_percent: depPct,
      total_ht: discountedHt,
      tva_amount: tvaAmount,
      total_ttc: ttc,
      deposit_amount: ttc * (depPct / 100),
      created_by: t(`roles.${state.role}`)
    };

    state.data.quotes.unshift(newQuote);
    closeModal();
    renderApp();
    showToast('Devis généré', `Le devis ${newQuote.id} a été créé avec succès`, 'success');
  };
}

// Quote PDF Preview Modal
export function previewQuotePdf(quoteId) {
  const q = state.data.quotes.find(item => item.id === quoteId) || state.data.quotes[0];
  const comp = state.data.company;

  const bodyHtml = `
    <div style="background: #fff; color: #1e293b; padding: var(--space-6); border: 1px solid var(--border-primary); border-radius: var(--radius-md); font-family: var(--font-sans); max-height: 70vh; overflow-y: auto;">
      
      <!-- Official Header -->
      <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #2563eb; padding-bottom: var(--space-4); margin-bottom: var(--space-4);">
        <div>
          <h2 style="font-size: var(--text-xl); font-weight: 800; color: #1e3a8a;">${comp.name}</h2>
          <div style="font-size: 11px; color: #64748b;">${comp.slogan}</div>
          <div style="font-size: 11px; color: #334155; margin-top: 4px;">
            RC: <strong>${comp.rc}</strong> • NIF: <strong>${comp.nif}</strong> • NIS: <strong>${comp.nis}</strong>
          </div>
          <div style="font-size: 11px; color: #334155;">
            ${comp.address} • Tél: ${comp.phone}
          </div>
        </div>

        <div style="text-align: right;">
          <div style="font-size: var(--text-2xl); font-weight: 800; color: #2563eb;">DEVIS PROFORMA</div>
          <div style="font-size: var(--text-sm); font-weight: 700; color: #0f172a;">N° ${q.id}</div>
          <div style="font-size: 11px; color: #64748b;">Date: ${q.date}</div>
          <div style="font-size: 11px; color: #64748b;">Validité: 30 jours</div>
        </div>
      </div>

      <!-- Client Box -->
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: var(--space-3); margin-bottom: var(--space-4);">
        <div style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600;">Client destinataire:</div>
        <div style="font-size: var(--text-md); font-weight: 700; color: #0f172a;">${q.client_name}</div>
        <div style="font-size: var(--text-sm); color: #334155;">Projet: <strong>${q.project_title}</strong></div>
      </div>

      <!-- Items Table -->
      <table style="width: 100%; font-size: 11px; border-collapse: collapse; margin-bottom: var(--space-4);">
        <thead>
          <tr style="background: #f1f5f9; border-bottom: 1px solid #cbd5e1; text-align: left;">
            <th style="padding: 6px 8px;">Désignation des travaux</th>
            <th style="padding: 6px 8px; text-align: center;">Unité</th>
            <th style="padding: 6px 8px; text-align: right;">Qté</th>
            <th style="padding: 6px 8px; text-align: right;">P.U (DA)</th>
            <th style="padding: 6px 8px; text-align: right;">Total HT (DA)</th>
          </tr>
        </thead>
        <tbody>
          ${q.items.map(it => `
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 6px 8px; font-weight: 500;">${it.desc}</td>
              <td style="padding: 6px 8px; text-align: center;">${it.unit}</td>
              <td style="padding: 6px 8px; text-align: right; font-family: monospace;">${it.qty}</td>
              <td style="padding: 6px 8px; text-align: right; font-family: monospace;">${Math.round(it.price).toLocaleString()}</td>
              <td style="padding: 6px 8px; text-align: right; font-family: monospace; font-weight: 600;">${Math.round(it.qty * it.price).toLocaleString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- Totals & Bank Details -->
      <div style="display: grid; grid-template-columns: 1fr 260px; gap: var(--space-4); margin-top: var(--space-4);">
        <div style="font-size: 11px; color: #475569; border-right: 1px solid #e2e8f0; padding-right: var(--space-3);">
          <div style="font-weight: 700; margin-bottom: 2px;">Coordonnées Bancaires de règlement:</div>
          <div>${comp.rib}</div>
          <div style="margin-top: 6px; font-style: italic;">
            Arrêté le présent devis à la somme en toutes taxes comprises de :<br>
            <strong>${Math.round(q.total_ttc).toLocaleString()} Dinars Algériens.</strong>
          </div>
        </div>

        <div style="font-size: 11px;">
          <div style="display: flex; justify-content: space-between; padding: 2px 0;">
            <span>Total Hors Taxes:</span>
            <span style="font-family: monospace; font-weight: 600;">${Math.round(q.total_ht).toLocaleString()} DA</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 2px 0;">
            <span>TVA (${q.tva_percent}%):</span>
            <span style="font-family: monospace;">${Math.round(q.tva_amount).toLocaleString()} DA</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 6px 0; border-top: 1.5px solid #0f172a; margin-top: 4px; font-size: 13px; font-weight: 800; color: #1e3a8a;">
            <span>Total TTC:</span>
            <span style="font-family: monospace;">${Math.round(q.total_ttc).toLocaleString()} DA</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 4px 0; color: #2563eb; font-weight: 700;">
            <span>Acompte requis (${q.deposit_percent}%):</span>
            <span style="font-family: monospace;">${Math.round(q.deposit_amount).toLocaleString()} DA</span>
          </div>
        </div>
      </div>

      <!-- Stamp & Signature Box -->
      <div style="display: flex; justify-content: space-between; margin-top: var(--space-6); padding-top: var(--space-4); border-top: 1px dashed #cbd5e1; font-size: 11px;">
        <div style="text-align: center; width: 180px;">
          <div>Bon pour accord et commande</div>
          <div style="color: #94a3b8; margin-top: 2px;">Date et signature du client:</div>
          <div style="height: 48px;"></div>
        </div>
        <div style="text-align: center; width: 200px;">
          <div>Cachet et Signature de l'Entreprise</div>
          <div style="color: #2563eb; font-weight: 700; margin-top: 10px;">SARL Atlas BTP Algérie</div>
          <div style="font-size: 9px; color: #64748b;">(Garantie Décennale CAAT n° 89201)</div>
        </div>
      </div>

    </div>
  `;

  const footerHtml = `
    <button class="btn btn-secondary" onclick="window.closeCurrentModal()">${t('common.close')}</button>
    <button class="btn btn-primary" onclick="window.printQuote()">
      ${icons.download} Imprimer / Télécharger PDF
    </button>
  `;

  openModal(`Devis Officiel BTP : ${q.id}`, bodyHtml, footerHtml, '760px');
}

export function sendQuoteWhatsApp(quoteId) {
  const q = state.data.quotes.find(item => item.id === quoteId) || state.data.quotes[0];
  const msg = encodeURIComponent(`Bonjour ${q.client_name}, veuillez trouver ci-joint l'offre de prix N° ${q.id} d'un montant de ${formatDA(q.total_ttc)} pour votre projet : "${q.project_title}". SARL Atlas BTP Algérie.`);
  window.open(`https://wa.me/?text=${msg}`, '_blank');
  showToast('WhatsApp', 'Lien de partage du devis ouvert', 'success');
}

window.printQuote = () => {
  window.print();
};

// ────────────────────────────────────────────
// 6. CONTRATS
// ────────────────────────────────────────────
function renderContractsPage() {
  const d = state.data;
  const isAr = state.lang === 'ar';

  return `
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">${t('nav.contracts')}</h1>
        <p class="page-subtitle">Contrats de travaux, clauses décennales, conditions de paiement et délais d'exécution</p>
      </div>
      <div class="page-header-actions">
        <button class="btn btn-primary" onclick="window.showToast('Nouveau contrat', 'Sélectionnez un devis accepté pour générer le contrat légal', 'info')">
          ${icons.plus} <span>${isAr ? 'إنشاء عقد' : 'Rédiger un Contrat'}</span>
        </button>
      </div>
    </div>

    <div class="grid grid-2">
      ${d.contracts.map(c => `
        <div class="card" style="padding: var(--space-5);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-3);">
            <div>
              <span class="badge badge-green">${c.status}</span>
              <h3 class="font-semibold" style="font-size: var(--text-md); margin-top: var(--space-2);">${c.project_name}</h3>
              <div style="font-size: var(--text-xs); color: var(--text-tertiary);">Réf. Contrat: <strong>${c.id}</strong></div>
            </div>
            <div class="font-mono font-bold" style="font-size: var(--text-lg); color: var(--brand-600);">
              ${formatDA(c.amount_ttc)}
            </div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-2); font-size: var(--text-xs); background: var(--bg-secondary); padding: var(--space-3); border-radius: var(--radius-md); margin-bottom: var(--space-3);">
            <div>Client: <strong>${c.client_name}</strong></div>
            <div>Signé le: <strong>${c.signed_date}</strong></div>
            <div>Démarrage: <strong>${c.start_date}</strong></div>
            <div>Livraison: <strong>${c.end_date}</strong></div>
          </div>

          <div style="font-size: var(--text-xs); color: var(--text-secondary); margin-bottom: var(--space-3);">
            • <strong>Assurance:</strong> ${c.guarantee}<br>
            • <strong>Pénalité:</strong> ${c.penalty_per_day}
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-secondary); padding-top: var(--space-3);">
            <span class="badge badge-blue">${c.deposit_status}</span>
            <button class="btn btn-secondary btn-sm" onclick="window.showToast('Contrat ${c.id}', 'Téléchargement du contrat signé en cours...', 'info')">
              ${icons.download} Télécharger
            </button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function bindContractsEvents() {}

// ────────────────────────────────────────────
// 7. PROJETS & CHANTIERS
// ────────────────────────────────────────────
function renderProjectsPage() {
  const p = state.selectedProject || state.data.projects[0];
  const d = state.data;
  const isAr = state.lang === 'ar';

  return `
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">${t('nav.projects')}</h1>
        <p class="page-subtitle">Suivi d'exécution chantier : planning, équipes ouvriers, matériaux et photos</p>
      </div>
      <div class="page-header-actions">
        <!-- Project Selector Dropdown -->
        <select class="form-select" id="selectActiveProject" style="max-width: 280px;">
          ${d.projects.map(proj => `
            <option value="${proj.id}" ${proj.id === p.id ? 'selected' : ''}>${proj.name}</option>
          `).join('')}
        </select>
        <button class="btn btn-primary" id="btnNewProject">
          ${icons.plus} <span>${isAr ? 'مشروع جديد' : 'Nouveau Chantier'}</span>
        </button>
      </div>
    </div>

    <!-- Active Project Master Card -->
    <div class="card" style="margin-bottom: var(--space-6);">
      <div class="project-header-card">
        <div>
          <div style="display: flex; align-items: center; gap: var(--space-2); margin-bottom: var(--space-2);">
            <span class="badge badge-green">${p.status}</span>
            <span class="badge badge-gray">${p.wilaya} • ${p.commune}</span>
            <span class="badge badge-blue">${p.id}</span>
          </div>
          <h2 style="font-size: var(--text-2xl); font-weight: 700;">${p.name}</h2>
          <p style="font-size: var(--text-sm); color: var(--text-secondary); margin-top: 4px;">
            Client: <strong>${p.client}</strong> • Adresse: ${p.address}
          </p>

          <!-- Budget & Team Quick Stats -->
          <div style="display: flex; gap: var(--space-6); margin-top: var(--space-4); flex-wrap: wrap;">
            <div>
              <div class="text-dimmed" style="font-size: 11px; text-transform: uppercase;">Budget Contractuel</div>
              <div class="font-mono font-bold" style="font-size: var(--text-lg);">${formatDA(p.budget)}</div>
            </div>
            <div>
              <div class="text-dimmed" style="font-size: 11px; text-transform: uppercase;">Dépenses Engagées</div>
              <div class="font-mono font-bold" style="font-size: var(--text-lg); color: var(--brand-600);">${formatDA(p.spent)}</div>
            </div>
            <div>
              <div class="text-dimmed" style="font-size: 11px; text-transform: uppercase;">Chef de Chantier</div>
              <div class="font-semibold" style="font-size: var(--text-sm); margin-top: 2px;">${p.team_leader}</div>
            </div>
            <div>
              <div class="text-dimmed" style="font-size: 11px; text-transform: uppercase;">Effectif sur site</div>
              <div class="font-semibold" style="font-size: var(--text-sm); margin-top: 2px;">${p.workers_count} ouvriers actifs</div>
            </div>
          </div>
        </div>

        <!-- Progress Ring -->
        <div class="project-progress-ring">
          <svg viewBox="0 0 36 36">
            <path class="bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            <path class="fill" stroke-dasharray="${p.progress}, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
          </svg>
          <div class="project-progress-text">${p.progress}%</div>
        </div>
      </div>
    </div>

    <!-- Project Tabs & Section -->
    <div class="grid grid-sidebar">
      
      <!-- Left: Timeline Jalons de Chantier -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Jalons & Planning Chantier</h3>
        </div>
        <div class="card-body">
          <div class="timeline">
            ${p.timeline.map(tl => `
              <div class="timeline-item">
                <div class="timeline-dot ${tl.status === 'done' ? 'green' : tl.status === 'current' ? 'yellow' : 'gray'}"></div>
                <div class="timeline-time">${tl.date}</div>
                <div class="timeline-text ${tl.status === 'current' ? 'font-semibold text-brand' : ''}">
                  ${tl.title}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Right: Detailed Sections (Photos, Tâches, Matériaux) -->
      <div style="display: flex; flex-direction: column; gap: var(--space-6);">
        
        <!-- Photo Gallery Avant / Pendant / Après -->
        <div class="card">
          <div class="card-header">
            <div>
              <h3 class="card-title">Suivi Visuel & Photos de Chantier</h3>
              <p class="card-subtitle">Documentation d'avancement pour le client et les procès-verbaux</p>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="window.showToast('Upload photo', 'Téléversement de photos de chantier...', 'info')">
              ${icons.upload} Ajouter photo
            </button>
          </div>
          <div class="card-body">
            <div class="project-photos">
              <!-- Before photo -->
              <div class="project-photo" style="background: linear-gradient(135deg, #334155, #1e293b); display: flex; align-items: center; justify-content: center; color: #fff;">
                ${icons.hardHat}
                <span class="project-photo-label" style="background: var(--danger-600);">Avant travaux (État des lieux)</span>
              </div>
              <!-- In-progress photo -->
              <div class="project-photo" style="background: linear-gradient(135deg, #0284c7, #0369a1); display: flex; align-items: center; justify-content: center; color: #fff;">
                ${icons.materials}
                <span class="project-photo-label" style="background: var(--brand-600);">En cours (Gaines & Plâtre)</span>
              </div>
              <!-- Another in-progress photo -->
              <div class="project-photo" style="background: linear-gradient(135deg, #10b981, #059669); display: flex; align-items: center; justify-content: center; color: #fff;">
                ${icons.checkCircle}
                <span class="project-photo-label" style="background: var(--success-600);">Réception Provisoire</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Linked Tasks for this project -->
        <div class="card">
          <div class="card-header">
            <div>
              <h3 class="card-title">Tâches assignées au chantier</h3>
              <p class="card-subtitle">${p.tasks_completed} sur ${p.tasks_total} tâches terminées</p>
            </div>
            <button class="btn btn-ghost btn-sm" onclick="window.navigateToPage('tasks')">${icons.plus} Gérer les tâches</button>
          </div>
          <div class="table-container">
            <table class="table">
              <thead>
                <tr>
                  <th>Tâche</th>
                  <th>Affecté à</th>
                  <th>Échéance</th>
                  <th>Priorité</th>
                </tr>
              </thead>
              <tbody>
                ${state.data.tasks.slice(0, 3).map(tk => `
                  <tr>
                    <td class="font-semibold">${tk.title}</td>
                    <td>${tk.assignee}</td>
                    <td><span class="badge badge-gray">${tk.due_date}</span></td>
                    <td><span class="badge ${tk.priority === 'Urgente' ? 'badge-red' : 'badge-yellow'}">${tk.priority}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  `;
}

function bindProjectsEvents() {
  const selectProj = document.getElementById('selectActiveProject');
  if (selectProj) {
    selectProj.onchange = (e) => {
      const proj = state.data.projects.find(p => p.id === e.target.value);
      if (proj) {
        state.selectedProject = proj;
        renderApp();
      }
    };
  }

  const newProjBtn = document.getElementById('btnNewProject');
  if (newProjBtn) {
    newProjBtn.onclick = () => {
      showToast('Nouveau Chantier', 'Formulaire de création de projet BTP ouvert', 'info');
    };
  }
}

export function viewProjectDetails(projectId) {
  const proj = state.data.projects.find(p => p.id === projectId);
  if (proj) {
    state.selectedProject = proj;
    navigateTo('projects');
  }
}

// ────────────────────────────────────────────
// 8. TÂCHES & TRAVAUX (KANBAN)
// ────────────────────────────────────────────
function renderTasksPage() {
  const d = state.data;
  const isAr = state.lang === 'ar';

  const columns = [
    { id: 'todo', name: 'À faire', name_ar: 'قيد الانتظار' },
    { id: 'in_progress', name: 'En cours', name_ar: 'قيد الإنجاز' },
    { id: 'review', name: 'En attente validation', name_ar: 'بانتظار المعاينة' },
    { id: 'done', name: 'Terminé', name_ar: 'مكتمل' }
  ];

  return `
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">${t('nav.tasks')}</h1>
        <p class="page-subtitle">Affectation des corps d'état, plannings journaliers et checklists de contrôle</p>
      </div>
      <div class="page-header-actions">
        <button class="btn btn-primary" id="btnNewTask">
          ${icons.plus} <span>${isAr ? 'مهمة جديدة' : 'Nouvelle Tâche'}</span>
        </button>
      </div>
    </div>

    <!-- Tasks Kanban Board -->
    <div class="kanban">
      ${columns.map(col => {
        const colTasks = d.tasks.filter(tk => tk.status === col.id);

        return `
          <div class="kanban-column">
            <div class="kanban-column-header">
              <div class="kanban-column-title">
                <span>${isAr ? col.name_ar : col.name}</span>
                <span class="kanban-count">${colTasks.length}</span>
              </div>
            </div>

            <div class="kanban-cards">
              ${colTasks.map(tk => `
                <div class="kanban-card">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                    <span class="badge ${tk.priority === 'Urgente' ? 'badge-red' : tk.priority === 'Haute' ? 'badge-yellow' : 'badge-blue'}">
                      ${tk.priority}
                    </span>
                    <span style="font-size: 10px; color: var(--text-tertiary);">${tk.due_date}</span>
                  </div>

                  <div class="kanban-card-title">${tk.title}</div>
                  
                  <div style="font-size: 11px; color: var(--text-tertiary); margin-bottom: 8px;">
                    ${tk.project}
                  </div>

                  <!-- Checklist items -->
                  <div style="display: flex; flex-direction: column; gap: 4px; padding-top: 6px; border-top: 1px solid var(--border-secondary);">
                    ${tk.checklist.map((item, ci) => `
                      <label class="checkbox-wrap" style="font-size: 11px; color: ${item.done ? 'var(--text-tertiary)' : 'var(--text-primary)'};">
                        <span class="checkbox ${item.done ? 'checked' : ''}">
                          ${item.done ? icons.check : ''}
                        </span>
                        <span style="${item.done ? 'text-decoration: line-through;' : ''}">${item.text}</span>
                      </label>
                    `).join('')}
                  </div>

                  <div style="margin-top: 10px; display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: var(--text-secondary);">
                    <span>${tk.assignee.split(' ')[0]}</span>
                    <span class="badge badge-gray">${tk.id}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function bindTasksEvents() {
  const newBtn = document.getElementById('btnNewTask');
  if (newBtn) {
    newBtn.onclick = () => {
      showToast('Nouvelle Tâche', 'Ouverture de l\'attribution d\'ordre de travail', 'info');
    };
  }
}

// ────────────────────────────────────────────
// 9. ÉQUIPE & OUVRIERS
// ────────────────────────────────────────────
function renderEmployeesPage() {
  const d = state.data;
  const isAr = state.lang === 'ar';

  return `
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">${t('nav.employees')}</h1>
        <p class="page-subtitle">Effectifs internes, artisans spécialisés, conducteurs de travaux et chefs d'équipe</p>
      </div>
      <div class="page-header-actions">
        <button class="btn btn-primary" onclick="window.showToast('Ajouter employé', 'Fiche nouvel ouvrier / artisan', 'info')">
          ${icons.plus} <span>${isAr ? 'إضافة عامل' : 'Ajouter un Artisan'}</span>
        </button>
      </div>
    </div>

    <div class="employee-grid">
      ${d.employees.map(e => `
        <div class="card employee-card">
          <div class="avatar avatar-lg" style="background: var(--brand-600);">${e.avatar_text}</div>
          <div class="employee-card-name">${e.name}</div>
          <div class="employee-card-role">${e.role}</div>
          <span class="badge badge-blue" style="margin-top: 6px;">${e.role_badge}</span>

          <div style="margin-top: var(--space-3); font-size: var(--text-xs); color: var(--text-secondary);">
            <div>Tél: <a href="tel:${e.phone}"><strong>${e.phone}</strong></a></div>
            <div style="margin-top: 2px;">Statut: <span class="badge badge-green">${e.availability}</span></div>
          </div>

          <div class="employee-card-stats">
            <div class="employee-stat-item">
              <div class="employee-stat-value">${e.projects_assigned}</div>
              <div class="employee-stat-label">Chantiers</div>
            </div>
            <div class="employee-stat-item">
              <div class="employee-stat-value font-mono">${e.daily_rate}</div>
              <div class="employee-stat-label">Tarif journalier</div>
            </div>
            <div class="employee-stat-item">
              <div class="employee-stat-value" style="color: var(--warning-500);">★ ${e.rating}</div>
              <div class="employee-stat-label">Qualité</div>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function bindEmployeesEvents() {}

// ────────────────────────────────────────────
// 10. MATÉRIAUX & STOCK
// ────────────────────────────────────────────
function renderMaterialsPage() {
  const d = state.data;
  const isAr = state.lang === 'ar';

  return `
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">${t('nav.materials')}</h1>
        <p class="page-subtitle">Suivi du dépôt central de matériaux, approvisionnements et seuils de réassort</p>
      </div>
      <div class="page-header-actions">
        <button class="btn btn-primary" onclick="window.showToast('Entrée Stock', 'Enregistrement bon de livraison fournisseur', 'info')">
          ${icons.plus} <span>${isAr ? 'إدخال مخزون' : 'Entrée de stock'}</span>
        </button>
      </div>
    </div>

    <div class="card">
      <div class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>Désignation du matériau</th>
              <th>Catégorie</th>
              <th>Stock Actuel</th>
              <th>Seuil d'alerte</th>
              <th>Prix Achat Moyen (DA)</th>
              <th>Fournisseur Algérie</th>
              <th>État</th>
            </tr>
          </thead>
          <tbody>
            ${d.materials.map(m => {
              const isLow = m.stock <= m.min_threshold;
              return `
                <tr>
                  <td class="font-semibold">${m.name}</td>
                  <td><span class="badge badge-gray">${m.category}</span></td>
                  <td class="font-mono font-bold" style="${isLow ? 'color: var(--danger-600);' : ''}">
                    ${m.stock} ${m.unit}
                  </td>
                  <td class="font-mono text-dimmed">${m.min_threshold} ${m.unit}</td>
                  <td class="font-mono">${formatDA(m.unit_price)}</td>
                  <td>${m.supplier}</td>
                  <td>
                    <span class="badge ${isLow ? 'badge-red' : 'badge-green'}">
                      ${m.status}
                    </span>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function bindMaterialsEvents() {}

// ────────────────────────────────────────────
// 11. PAIEMENTS & TRÉSORERIE
// ────────────────────────────────────────────
function renderPaymentsPage() {
  const d = state.data;
  const isAr = state.lang === 'ar';

  const totalEncaisse = d.payments.filter(p => p.status === 'Encaissé').reduce((acc, p) => acc + p.amount, 0);

  return `
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">${t('nav.payments')}</h1>
        <p class="page-subtitle">Suivi des acomptes, situations de travaux mensuelles et règlements bancaires / BaridiMob</p>
      </div>
      <div class="page-header-actions">
        <button class="btn btn-primary" id="btnRecordPayment">
          ${icons.plus} <span>${isAr ? 'تسجيل دفعة' : 'Enregistrer un Paiement'}</span>
        </button>
      </div>
    </div>

    <!-- Financial Cards -->
    <div class="payment-summary-cards">
      <div class="card payment-summary-card">
        <div class="stat-label">Total Encaissé ce trimestre</div>
        <div class="stat-value font-mono" style="color: var(--success-600);">${formatDA(totalEncaisse)}</div>
        <div style="font-size: var(--text-xs); color: var(--text-tertiary); margin-top: 4px;">Sur comptes BNA, BEA, CCP</div>
      </div>

      <div class="card payment-summary-card">
        <div class="stat-label">En attente de règlement</div>
        <div class="stat-value font-mono" style="color: var(--brand-600);">${formatDA(4350000)}</div>
        <div style="font-size: var(--text-xs); color: var(--text-tertiary); margin-top: 4px;">Factures transmises</div>
      </div>

      <div class="card payment-summary-card">
        <div class="stat-label">Paiements en souffrance / Retard</div>
        <div class="stat-value font-mono" style="color: var(--danger-600);">${formatDA(1450000)}</div>
        <div style="font-size: var(--text-xs); color: var(--danger-600); margin-top: 4px;">Relance recommandée</div>
      </div>
    </div>

    <!-- Payments Ledger Table -->
    <div class="card">
      <div class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>Réf. Encaissement</th>
              <th>Date</th>
              <th>Client</th>
              <th>Chantier</th>
              <th>Mode de règlement</th>
              <th>Objet / Type</th>
              <th>Montant (DZD)</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            ${d.payments.map(pay => `
              <tr>
                <td class="font-mono font-semibold" style="color: var(--brand-600);">${pay.id}</td>
                <td>${pay.date}</td>
                <td class="font-semibold">${pay.client_name}</td>
                <td>${pay.project_name}</td>
                <td>
                  <span class="badge badge-gray">${pay.method}</span>
                </td>
                <td style="font-size: var(--text-xs);">${pay.type}</td>
                <td class="font-mono font-bold" style="color: ${pay.status === 'Encaissé' ? 'var(--success-600)' : 'var(--danger-600)'};">
                  ${formatDA(pay.amount)}
                </td>
                <td>
                  <span class="badge ${pay.status === 'Encaissé' ? 'badge-green' : 'badge-red'}">
                    ${pay.status}
                  </span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function bindPaymentsEvents() {
  const recordBtn = document.getElementById('btnRecordPayment');
  if (recordBtn) {
    recordBtn.onclick = openRecordPaymentModal;
  }
}

function openRecordPaymentModal() {
  const bodyHtml = `
    <form id="formRecordPayment" style="display: flex; flex-direction: column; gap: var(--space-3);">
      <div class="form-group">
        <label class="form-label">Client <span class="required">*</span></label>
        <input type="text" id="inpPayClient" class="form-input" placeholder="Ex: M. Karim Belhadj" required>
      </div>
      <div class="form-group">
        <label class="form-label">Projet / Chantier <span class="required">*</span></label>
        <select id="inpPayProject" class="form-select">
          ${state.data.projects.map(p => `<option value="${p.name}">${p.name}</option>`).join('')}
        </select>
      </div>
      <div class="grid grid-2">
        <div class="form-group">
          <label class="form-label">Montant perçu (DA) <span class="required">*</span></label>
          <input type="number" id="inpPayAmount" class="form-input font-mono" placeholder="Ex: 500000" step="1000" required>
        </div>
        <div class="form-group">
          <label class="form-label">Date d'encaissement <span class="required">*</span></label>
          <input type="date" id="inpPayDate" class="form-input" value="2026-09-13" required>
        </div>
      </div>
      <div class="grid grid-2">
        <div class="form-group">
          <label class="form-label">Mode de règlement</label>
          <select id="inpPayMethod" class="form-select">
            <option value="Virement BNA">Virement bancaire BNA</option>
            <option value="Virement BEA">Virement bancaire BEA</option>
            <option value="Chèque certifié">Chèque bancaire certifié</option>
            <option value="BaridiMob / CCP">BaridiMob / Algérie Poste CCP</option>
            <option value="Espèces (Reçu de caisse)">Espèces (Contre reçu fiscalisé)</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">N° Transaction / Chèque</label>
          <input type="text" id="inpPayRef" class="form-input" placeholder="Ex: CHQ-890214">
        </div>
      </div>
    </form>
  `;

  const footerHtml = `
    <button class="btn btn-secondary" onclick="window.closeCurrentModal()">${t('common.cancel')}</button>
    <button class="btn btn-primary" id="btnSavePayment">Enregistrer l'encaissement</button>
  `;

  openModal('Enregistrer un Règlement Chantier', bodyHtml, footerHtml);

  document.getElementById('btnSavePayment').onclick = () => {
    const client = document.getElementById('inpPayClient').value.trim();
    const amount = parseFloat(document.getElementById('inpPayAmount').value) || 0;

    if (!client || amount <= 0) {
      showToast('Attention', 'Veuillez saisir le client et un montant valide.', 'warning');
      return;
    }

    state.data.payments.unshift({
      id: `PAY-2026-0${state.data.payments.length + 89}`,
      date: document.getElementById('inpPayDate').value,
      client_name: client,
      project_name: document.getElementById('inpPayProject').value,
      amount: amount,
      method: document.getElementById('inpPayMethod').value,
      reference: document.getElementById('inpPayRef').value || 'Reçu N° ' + Math.floor(Math.random() * 9000 + 1000),
      status: 'Encaissé',
      type: 'Acompte ou situation validée'
    });

    closeModal();
    renderApp();
    showToast('Encaissement enregistré', `${formatDA(amount)} enregistrés avec succès.`, 'success');
  };
}

// ────────────────────────────────────────────
// 12. DOCUMENTS & PV DE RÉCEPTION
// ────────────────────────────────────────────
function renderDocumentsPage() {
  const d = state.data;
  const isAr = state.lang === 'ar';

  return `
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">${t('nav.documents')}</h1>
        <p class="page-subtitle">Dossiers techniques : plans DWG/PDF, contrats, polices d'assurance et PV de réception</p>
      </div>
      <div class="page-header-actions">
        <button class="btn btn-primary" onclick="window.showToast('Ajouter document', 'Sélectionnez un fichier PDF ou DWG à indexer', 'info')">
          ${icons.upload} <span>${isAr ? 'رفع وثيقة' : 'Ajouter un Document'}</span>
        </button>
      </div>
    </div>

    <div class="document-grid">
      ${d.documents.map(doc => `
        <div class="card document-item" onclick="window.showToast('Document', 'Téléchargement de ${doc.title}...', 'info')">
          <div class="document-icon">${icons.fileText}</div>
          <div class="document-name">${doc.title}</div>
          <div class="document-meta">${doc.type} • ${doc.size}</div>
          <div style="font-size: 10px; color: var(--text-tertiary); margin-top: 4px;">Ajouté le ${doc.date}</div>
        </div>
      `).join('')}
    </div>
  `;
}

function bindDocumentsEvents() {}

// ────────────────────────────────────────────
// 13. NOTIFICATIONS
// ────────────────────────────────────────────
function renderNotificationsPage() {
  const d = state.data;
  const isAr = state.lang === 'ar';

  return `
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">${t('nav.notifications')}</h1>
        <p class="page-subtitle">Centre d'alertes en temps réel pour chantiers, devis et recouvrements</p>
      </div>
      <div class="page-header-actions">
        <button class="btn btn-secondary btn-sm" id="btnMarkAllRead">
          ${icons.check} <span>${isAr ? 'تحديد الكل كمقروء' : 'Tout marquer comme lu'}</span>
        </button>
      </div>
    </div>

    <div class="notification-center">
      <div class="card">
        <div class="card-body" style="padding: var(--space-2) var(--space-4);">
          ${d.notifications.map(n => `
            <div class="notification-item ${n.unread ? 'unread' : ''}" onclick="window.handleNotificationClick('${n.link}')">
              <div class="notification-icon" style="background: var(--brand-50); color: var(--brand-600);">
                ${n.type === 'payment' ? icons.dollarSign : n.type === 'alert' ? icons.alertCircle : icons.bell}
              </div>
              <div class="notification-content">
                <div class="notification-text">
                  <strong>${isAr ? n.title_ar : n.title}</strong><br>
                  <span style="color: var(--text-secondary); font-size: var(--text-xs);">${n.text}</span>
                </div>
                <div class="notification-time">${n.time}</div>
              </div>
              ${n.unread ? `<div class="notification-unread-dot"></div>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function bindNotificationsEvents() {
  const markBtn = document.getElementById('btnMarkAllRead');
  if (markBtn) {
    markBtn.onclick = () => {
      state.data.notifications.forEach(n => n.unread = false);
      const dot = document.getElementById('headerNotifDot');
      if (dot) dot.style.display = 'none';
      renderApp();
      showToast('Notifications', 'Toutes les notifications ont été marquées comme lues', 'success');
    };
  }
}

export function handleNotificationClick(link) {
  if (link) navigateTo(link);
}

// ────────────────────────────────────────────
// 14. RAPPORTS & ANALYTICS
// ────────────────────────────────────────────
function renderReportsPage() {
  const d = state.data;
  const isAr = state.lang === 'ar';

  return `
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">${t('nav.reports')}</h1>
        <p class="page-subtitle">Analyse financière et performance commerciale des corps de métier en Algérie</p>
      </div>
      <div class="page-header-actions">
        <button class="btn btn-secondary btn-sm" onclick="window.print()">
          ${icons.download} <span>Exporter rapport</span>
        </button>
      </div>
    </div>

    <!-- Breakdown Grid -->
    <div class="grid grid-2" style="margin-bottom: var(--space-6);">
      
      <!-- Top Trades Share -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Répartition par Corps d'État & Métiers</h3>
        </div>
        <div class="card-body">
          <div style="display: flex; flex-direction: column; gap: var(--space-4);">
            ${d.statsData.tradeDistribution.map(item => `
              <div>
                <div style="display: flex; justify-content: space-between; font-size: var(--text-sm); margin-bottom: 4px;">
                  <span class="font-medium">${item.trade}</span>
                  <span class="font-mono font-bold">${item.pct}%</span>
                </div>
                <div class="progress">
                  <div class="progress-bar" style="width: ${item.pct}%; background: ${item.color};"></div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Wilayas Geographic Distribution -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Top Wilayas d'Activité BTP</h3>
        </div>
        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>Wilaya</th>
                <th>Nombre de Chantiers</th>
                <th>Valeur Totale (DA)</th>
              </tr>
            </thead>
            <tbody>
              ${d.statsData.wilayasTop.map(w => `
                <tr>
                  <td class="font-semibold">${w.name}</td>
                  <td><span class="badge badge-blue">${w.count} chantiers</span></td>
                  <td class="font-mono font-bold">${w.val}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `;
}

function bindReportsEvents() {}

// ────────────────────────────────────────────
// 15. PARAMÈTRES DE L'ENTREPRISE
// ────────────────────────────────────────────
function renderSettingsPage() {
  const comp = state.data.company;
  const isAr = state.lang === 'ar';

  return `
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">${t('nav.settings')}</h1>
        <p class="page-subtitle">Identifiants fiscaux algériens, données bancaires et gestion des accès</p>
      </div>
      <div class="page-header-actions">
        <button class="btn btn-primary" id="btnSaveCompanySettings">
          ${icons.save} <span>${t('common.save')}</span>
        </button>
      </div>
    </div>

    <div class="settings-layout">
      <!-- Settings Nav tabs -->
      <div class="settings-nav">
        <div class="settings-nav-item active">Entreprise & Fiscalité</div>
        <div class="settings-nav-item" onclick="window.navigateToPage('auth')">Rôles & Auth Screens</div>
        <div class="settings-nav-item" onclick="window.showToast('Devis & Facturation', 'Paramètres de numérotation automatique', 'info')">Numérotation & TVA</div>
        <div class="settings-nav-item" onclick="window.showToast('Sauvegardes', 'Sauvegarde automatique cloud active', 'info')">Sauvegardes & Sécurité</div>
      </div>

      <!-- Settings Content -->
      <div class="card" style="padding: var(--space-6);">
        <div class="settings-section">
          <h3 class="settings-section-title">Informations Légales & Registre de Commerce</h3>
          <p class="settings-section-desc">Ces mentions apparaîtront obligatoirement sur vos devis et factures proforma.</p>

          <form id="settingsForm" class="settings-form">
            <div class="form-group full-width">
              <label class="form-label">Raison sociale de l'entreprise</label>
              <input type="text" class="form-input" id="setCompanyName" value="${comp.name}">
            </div>

            <div class="form-group">
              <label class="form-label">N° Registre de Commerce (RC)</label>
              <input type="text" class="form-input font-mono" id="setCompanyRc" value="${comp.rc}">
            </div>

            <div class="form-group">
              <label class="form-label">Numéro d'Identification Fiscale (NIF)</label>
              <input type="text" class="form-input font-mono" id="setCompanyNif" value="${comp.nif}">
            </div>

            <div class="form-group">
              <label class="form-label">Numéro d'Identification Statistique (NIS)</label>
              <input type="text" class="form-input font-mono" id="setCompanyNis" value="${comp.nis}">
            </div>

            <div class="form-group">
              <label class="form-label">Article d'Imposition (AI)</label>
              <input type="text" class="form-input font-mono" id="setCompanyAi" value="${comp.ai}">
            </div>

            <div class="form-group full-width">
              <label class="form-label">Adresse du siège social</label>
              <input type="text" class="form-input" id="setCompanyAddress" value="${comp.address}">
            </div>

            <div class="form-group full-width">
              <label class="form-label">Coordonnées Bancaires (Banque & RIB / RIP)</label>
              <input type="text" class="form-input font-mono" id="setCompanyRib" value="${comp.rib}">
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
}

function bindSettingsEvents() {
  const saveBtn = document.getElementById('btnSaveCompanySettings');
  if (saveBtn) {
    saveBtn.onclick = () => {
      state.data.company.name = document.getElementById('setCompanyName').value;
      state.data.company.rc = document.getElementById('setCompanyRc').value;
      state.data.company.nif = document.getElementById('setCompanyNif').value;
      state.data.company.address = document.getElementById('setCompanyAddress').value;
      showToast('Modifications enregistrées', 'Les paramètres de l\'entreprise ont été mis à jour.', 'success');
    };
  }
}

// ────────────────────────────────────────────
// 16. AUTHENTIFICATION & CRÉATION D'ENTREPRISE
// ────────────────────────────────────────────
function renderAuthScreen() {
  return `
    <div class="auth-page">
      <div class="auth-left">
        <div class="auth-branding">
          <div class="auth-logo">${icons.hardHat}</div>
          <h1>BTP CRM</h1>
          <p>La solution SaaS n°1 dédiée aux entreprises de construction, artisans et travaux tout corps d'état en Algérie.</p>

          <div class="auth-features">
            <div class="auth-feature">
              <div class="auth-feature-icon">${icons.check}</div>
              <span>Chiffrage rapide en Dinars Algériens (DZD)</span>
            </div>
            <div class="auth-feature">
              <div class="auth-feature-icon">${icons.check}</div>
              <span>Suivi chantiers avec photos Avant/Pendant/Après</span>
            </div>
            <div class="auth-feature">
              <div class="auth-feature-icon">${icons.check}</div>
              <span>Recouvrement BNA, BaridiMob & relances auto</span>
            </div>
          </div>
        </div>
      </div>

      <div class="auth-right">
        <div class="auth-form-container">
          <h2 class="auth-form-title">Espace Professionnel BTP</h2>
          <p class="auth-form-subtitle">Connectez-vous ou testez les écrans d'authentification</p>

          <div style="display: flex; gap: var(--space-2); margin-bottom: var(--space-4);">
            <button class="btn btn-secondary btn-sm" id="authTabLogin" style="flex: 1;">Connexion</button>
            <button class="btn btn-secondary btn-sm" id="authTabRegister" style="flex: 1;">Inscription</button>
            <button class="btn btn-secondary btn-sm" id="authTabCompany" style="flex: 1;">Entreprise</button>
          </div>

          <div id="authDynamicForm">
            <!-- Login Form Default -->
            <form class="auth-form" onsubmit="event.preventDefault(); window.navigateToPage('dashboard');">
              <div class="form-group">
                <label class="form-label">Email professionnel ou Téléphone</label>
                <input type="text" class="form-input" value="contact@atlasbtp-dz.com" required>
              </div>

              <div class="form-group">
                <label class="form-label">Mot de passe</label>
                <input type="password" class="form-input" value="••••••••••••" required>
              </div>

              <div class="auth-form-row">
                <label class="checkbox-wrap">
                  <span class="checkbox checked">${icons.check}</span>
                  <span class="checkbox-label">Se souvenir de moi</span>
                </label>
                <a href="#" class="auth-form-link" onclick="window.showToast('Mot de passe oublié', 'Lien de réinitialisation SMS/Email', 'info')">Mot de passe oublié ?</a>
              </div>

              <button type="submit" class="btn btn-primary" style="margin-top: var(--space-2);">
                ${icons.lock} Se connecter à BTP CRM
              </button>
            </form>
          </div>

          <div class="auth-form-footer">
            <button class="btn btn-secondary btn-sm" onclick="window.navigateToPage('dashboard')">
              ← Revenir au Tableau de Bord
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function bindAuthEvents() {
  const tabLogin = document.getElementById('authTabLogin');
  const tabReg = document.getElementById('authTabRegister');
  const tabComp = document.getElementById('authTabCompany');
  const container = document.getElementById('authDynamicForm');

  if (tabLogin && tabReg && tabComp && container) {
    tabLogin.onclick = () => {
      container.innerHTML = `
        <form class="auth-form" onsubmit="event.preventDefault(); window.navigateToPage('dashboard');">
          <div class="form-group">
            <label class="form-label">Email ou Téléphone</label>
            <input type="text" class="form-input" value="contact@atlasbtp-dz.com" required>
          </div>
          <div class="form-group">
            <label class="form-label">Mot de passe</label>
            <input type="password" class="form-input" value="••••••••" required>
          </div>
          <button type="submit" class="btn btn-primary">Se connecter</button>
        </form>
      `;
    };

    tabReg.onclick = () => {
      container.innerHTML = `
        <form class="auth-form" onsubmit="event.preventDefault(); window.navigateToPage('dashboard');">
          <div class="form-group">
            <label class="form-label">Nom et Prénom du dirigeant</label>
            <input type="text" class="form-input" placeholder="Ex: Samir Belkacem" required>
          </div>
          <div class="form-group">
            <label class="form-label">Téléphone mobile (Algérie)</label>
            <input type="tel" class="form-input" placeholder="Ex: 0550 12 34 56" required>
          </div>
          <div class="form-group">
            <label class="form-label">Email de l'entreprise</label>
            <input type="email" class="form-input" placeholder="Ex: contact@monentreprise.dz" required>
          </div>
          <div class="form-group">
            <label class="form-label">Créer un mot de passe</label>
            <input type="password" class="form-input" required>
          </div>
          <button type="submit" class="btn btn-primary">Créer mon compte BTP CRM</button>
        </form>
      `;
    };

    tabComp.onclick = () => {
      container.innerHTML = `
        <form class="auth-form" onsubmit="event.preventDefault(); window.navigateToPage('dashboard');">
          <div class="form-group">
            <label class="form-label">Nom commercial de l'entreprise BTP</label>
            <input type="text" class="form-input" placeholder="Ex: EURL Bâtiment & Finition Oran" required>
          </div>
          <div class="form-group">
            <label class="form-label">Wilaya d'implantation</label>
            <select class="form-select">
              <option>16 - Alger</option>
              <option>31 - Oran</option>
              <option>25 - Constantine</option>
              <option>09 - Blida</option>
              <option>19 - Sétif</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Spécialité principale</label>
            <select class="form-select">
              <option>Tout Corps d'État (TCE)</option>
              <option>Rénovation & Peinture Décoration</option>
              <option>Électricité & Domotique</option>
              <option>Plomberie & Climatisation</option>
              <option>Énergie Solaire</option>
            </select>
          </div>
          <button type="submit" class="btn btn-primary">Finaliser la configuration</button>
        </form>
      `;
    };
  }
}

// ── Global Window Exports for Inline HTML Handlers ──
window.navigateToPage = navigateTo;
window.closeCurrentModal = closeModal;
window.openProspectModalById = (id) => {
  const p = state.data.prospects.find(item => item.id === id);
  if (p) openProspectModal(p);
};
window.viewProjectDetails = viewProjectDetails;
window.viewClientProfile = viewClientProfile;
window.previewQuotePdf = previewQuotePdf;
window.sendQuoteWhatsApp = sendQuoteWhatsApp;
window.handleNotificationClick = handleNotificationClick;
window.showToast = showToast;
