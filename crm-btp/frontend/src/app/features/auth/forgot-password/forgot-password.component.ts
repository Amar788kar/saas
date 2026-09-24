import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card card">
        <div class="auth-header">
          <div class="auth-logo">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <h1>Réinitialisation de mot de passe</h1>
          <p class="auth-subtitle">Entrez l'adresse email associée à votre compte BTP CRM pour recevoir un lien ou code de réinitialisation.</p>
        </div>

        <div *ngIf="submitted()" class="alert alert-success">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <div>
            <strong>Email de vérification envoyé !</strong>
            <p>Veuillez consulter votre boîte de réception ou vérifier vos courriers indésirables (Spam).</p>
          </div>
        </div>

        <form *ngIf="!submitted()" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="email">Email professionnel</label>
            <input
              id="email"
              type="email"
              [(ngModel)]="email"
              name="email"
              required
              placeholder="directeur@btp-algerie.dz"
            />
          </div>

          <button type="submit" class="btn btn-primary submit-btn" [disabled]="loading() || !email">
            <span *ngIf="!loading()">Envoyer le lien de réinitialisation</span>
            <span *ngIf="loading()">Envoi en cours...</span>
          </button>
        </form>

        <div class="auth-footer">
          <p><a routerLink="/auth/login">← Retour à la page de connexion</a></p>
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
      width: 100%;
      max-width: 460px;
      padding: 36px 32px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
    }
    .auth-header {
      text-align: center;
      margin-bottom: 24px;
    }
    .auth-logo {
      width: 52px;
      height: 52px;
      border-radius: 12px;
      background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
      color: #fff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
      box-shadow: 0 4px 14px rgba(249, 115, 22, 0.4);
    }
    h1 {
      font-size: 1.45rem;
      margin-bottom: 8px;
    }
    .auth-subtitle {
      font-size: 0.875rem;
      color: var(--text-muted);
      line-height: 1.4;
    }
    .submit-btn {
      width: 100%;
      padding: 12px;
      margin-top: 10px;
    }
    .auth-footer {
      text-align: center;
      margin-top: 24px;
      font-size: 0.875rem;
      a {
        color: var(--primary);
        font-weight: 600;
      }
    }
  `],
})
export class ForgotPasswordComponent {
  email = '';
  loading = signal(false);
  submitted = signal(false);

  onSubmit(): void {
    if (!this.email) return;
    this.loading.set(true);
    setTimeout(() => {
      this.loading.set(false);
      this.submitted.set(true);
    }, 800);
  }
}
