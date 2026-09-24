import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // If user has token or currentUser set, allow access
  if (authService.getAccessToken() || authService.currentUser()) {
    return true;
  }

  // Not authenticated, redirect to login page
  return router.createUrlTree(['/auth/login']);
};
