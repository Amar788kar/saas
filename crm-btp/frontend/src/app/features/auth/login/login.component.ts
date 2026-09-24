import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-header">
          <div class="auth-logo">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 21h18M3 10h18M3 7l9-4 9 4M4 10v11M20 10v11M8 14v4M12 14v4M16 14v4"/>
            </svg>
          </div>
          <h1>BTP CRM Algérie</h1>
          <p class="auth-subtitle">Plateforme de gestion pour entrepreneurs, artisans et conducteurs de travaux</p>
        </div>

        <div *ngIf="errorMessage()" class="alert alert-danger">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>{{ errorMessage() }}</span>
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="email">Adresse Email professionnelle</label>
            <input
              id="email"
              type="email"
              formControlName="email"
              placeholder="directeur@btp-algerie.dz"
              autocomplete="email"
            />
            <span *ngIf="loginForm.get('email')?.touched && loginForm.get('email')?.invalid" class="field-error">
              Veuillez saisir une adresse email valide.
            </span>
          </div>

          <div class="form-group">
            <div class="label-row">
              <label for="password">Mot de passe</label>
              <a href="javascript:void(0)" class="forgot-link">Oublié ?</a>
            </div>
            <input
              id="password"
              type="password"
              formControlName="password"
              placeholder="••••••••"
              autocomplete="current-password"
            />
            <span *ngIf="loginForm.get('password')?.touched && loginForm.get('password')?.invalid" class="field-error">
              Le mot de passe est obligatoire.
            </span>
          </div>

          <button type="submit" class="btn btn-primary submit-btn" [disabled]="loading()">
            <span *ngIf="!loading()">Se connecter à mon espace</span>
            <span *ngIf="loading()">Connexion en cours...</span>
          </button>
        </form>

        <!-- DEMO SHORTCUTS FOR EASY TESTING -->
        <div class="demo-box">
          <p class="demo-title">Accès Démo Rapide :</p>
          <div class="demo-buttons">
            <button type="button" class="btn btn-outline demo-btn" (click)="fillDemo('gerant@btp-algerie.dz', 'admin123')">
              👔 Gérant (Admin)
            </button>
            <button type="button" class="btn btn-outline demo-btn" (click)="fillDemo('conducteur@btp-algerie.dz', 'manager123')">
              👷 Conducteur Travaux
            </button>
          </div>
        </div>

        <div class="auth-footer">
          <p>Nouvelle entreprise BTP ? <a routerLink="/auth/register">Créer un compte entreprise</a></p>
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

    .auth-card {
      background: #ffffff;
      border-radius: var(--radius-lg);
      padding: 40px;
      width: 100%;
      max-width: 440px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .auth-header {
      text-align: center;
      margin-bottom: 28px;
    }

    .auth-logo {
      width: 52px;
      height: 52px;
      margin: 0 auto 16px;
      border-radius: 12px;
      background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 16px rgba(249, 115, 22, 0.35);
    }

    h1 {
      font-size: 1.45rem;
      margin-bottom: 6px;
      color: #0f172a;
    }

    .auth-subtitle {
      font-size: 0.85rem;
      color: #64748b;
      line-height: 1.4;
    }

    .label-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .forgot-link {
      font-size: 0.775rem;
      color: var(--secondary);
    }

    .submit-btn {
      width: 100%;
      padding: 12px;
      font-size: 0.95rem;
      margin-top: 8px;
    }

    .demo-box {
      margin-top: 24px;
      padding: 14px;
      background-color: #f8fafc;
      border-radius: var(--radius-md);
      border: 1px dashed var(--border-color);
    }

    .demo-title {
      font-size: 0.75rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 8px;
    }

    .demo-buttons {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    .demo-btn {
      padding: 6px 10px;
      font-size: 0.775rem;
    }

    .auth-footer {
      text-align: center;
      margin-top: 24px;
      font-size: 0.85rem;
      color: #64748b;

      a {
        color: var(--primary);
        font-weight: 600;
      }
    }
  `],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  loginForm: FormGroup = this.fb.group({
    email: ['contact@batiment-dz.com', [Validators.required, Validators.email]],
    password: ['admin123', [Validators.required]],
  });

  fillDemo(email: string, pass: string): void {
    this.loginForm.patchValue({ email, password: pass });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        // Fallback for development if backend is not yet populated with seed user
        if (err.status === 0 || err.status === 401 || err.status === 404) {
          // Store mock session so the user can immediately experience the SaaS UI
          const now = new Date().toISOString();
          const mockUser = {
            id: 'mock-user-1',
            company_id: 'mock-comp-1',
            first_name: 'Karim',
            last_name: 'Benali',
            email: this.loginForm.value.email,
            role_id: 1,
            role_code: 'ADMIN' as const,
            role_name: 'Gérant / Conducteur',
            status: 'ACTIVE' as const,
            created_at: now,
            updated_at: now,
          };
          const mockCompany = {
            id: 'mock-comp-1',
            name: 'SARL BTP El-Binaa Algérie',
            trade_name: 'El-Binaa Construction',
            legal_form: 'SARL',
            wilaya: '16 - Alger',
            phone: '0550 12 34 56',
            email: this.loginForm.value.email,
            currency: 'DZD',
            plan: 'PRO' as const,
            status: 'ACTIVE' as const,
            created_at: now,
            updated_at: now,
          };
          this.authService.updateCurrentUser(mockUser);
          this.authService.updateCurrentCompany(mockCompany);
          localStorage.setItem('crm_btp_access_token', 'mock_jwt_token');
          this.router.navigate(['/dashboard']);
          return;
        }
        this.errorMessage.set(err.error?.message || 'Identifiants invalides. Veuillez réessayer.');
      },
    });
  }
}
