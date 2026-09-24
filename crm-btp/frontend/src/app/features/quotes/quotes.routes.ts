import { Routes } from '@angular/router';

export const QUOTES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./quote-list.component').then((m) => m.QuoteListComponent),
  },
];
