import { Routes } from '@angular/router';

export const PROSPECTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./prospect-list.component').then((m) => m.ProspectListComponent),
  },
];
