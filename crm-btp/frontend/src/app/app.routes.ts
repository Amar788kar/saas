import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // ── Auth (public) ──
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },

  // ── Protected shell ──
  {
    path: '',
    loadComponent: () =>
      import('./shared/components/layout/layout.component').then(
        (m) => m.LayoutComponent
      ),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent
          ),
      },
      {
        path: 'prospects',
        loadChildren: () =>
          import('./features/prospects/prospects.routes').then(
            (m) => m.PROSPECTS_ROUTES
          ),
      },
      {
        path: 'clients',
        loadChildren: () =>
          import('./features/clients/clients.routes').then(
            (m) => m.CLIENTS_ROUTES
          ),
      },
      {
        path: 'visits',
        loadComponent: () =>
          import('./features/visits/visits.component').then(
            (m) => m.VisitsComponent
          ),
      },
      {
        path: 'quotes',
        loadChildren: () =>
          import('./features/quotes/quotes.routes').then(
            (m) => m.QUOTES_ROUTES
          ),
      },
      {
        path: 'contracts',
        loadComponent: () =>
          import('./features/contracts/contracts.component').then(
            (m) => m.ContractsComponent
          ),
      },
      {
        path: 'projects',
        loadChildren: () =>
          import('./features/projects/projects.routes').then(
            (m) => m.PROJECTS_ROUTES
          ),
      },
      {
        path: 'tasks',
        loadComponent: () =>
          import('./features/tasks/tasks.component').then(
            (m) => m.TasksComponent
          ),
      },
      {
        path: 'employees',
        loadComponent: () =>
          import('./features/employees/employees.component').then(
            (m) => m.EmployeesComponent
          ),
      },
      {
        path: 'materials',
        loadComponent: () =>
          import('./features/materials/materials.component').then(
            (m) => m.MaterialsComponent
          ),
      },
      {
        path: 'payments',
        loadComponent: () =>
          import('./features/payments/payments.component').then(
            (m) => m.PaymentsComponent
          ),
      },
      {
        path: 'documents',
        loadComponent: () =>
          import('./features/documents/documents.component').then(
            (m) => m.DocumentsComponent
          ),
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./features/notifications/notifications.component').then(
            (m) => m.NotificationsComponent
          ),
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./features/reports/reports.component').then(
            (m) => m.ReportsComponent
          ),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/settings.component').then(
            (m) => m.SettingsComponent
          ),
      },
    ],
  },

  { path: '**', redirectTo: '' },
];
