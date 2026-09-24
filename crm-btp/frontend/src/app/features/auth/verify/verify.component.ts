import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-verify',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card card">
        <div class="auth-header">
          <div class="auth-logo">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
          </div>
          <h1>Vérification de sécurité</h1>
          <p class="auth-subtitle">
            Un code à 6 chiffres a été envoyé par SMS/Email au <strong>0550 •• •• 56</strong> ou <strong>contact@...dz</strong>.
          </p>
        </div>

        <div *ngIf="errorMessage()" class="alert alert-danger">
          <span>{{ errorMessage() }}</span>
        </div>

        <form (ngSubmit)="onVerify()">
          <div class="otp-container">
            <input
              *ngFor="let digit of digits; let i = index"
              type="text"
              maxlength="1"
              [(ngModel)]="digits[i]"
              [name]="'digit' + i"
              class="otp-digit"
              (input)="onDigitInput($event, i)"
            />
          </div>

          <button type="submit" class="btn btn-primary submit-btn" [disabled]="loading() || !isComplete()">
            <span *ngIf="!loading()">Confirmer et activer le compte</span>
            <span *ngIf="loading()">Vérification...</span>
          </button>
        </form>

        <div class="resend-box">
          <p>Vous n'avez pas reçu le code ?</p>
          <button type="button" class="btn-resend" (click)="resendCode()" [disabled]="countdown() > 0">
            Renvoyer le code {{ countdown() > 0 ? '(' + countdown() + 's)' : '' }}
          </button>
        </div>

        <div class="auth-footer">
          <p><a routerLink="/auth/login">← Revenir à la connexion</a></p>
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
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: #fff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
      box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);
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
    .otp-container {
      display: flex;
      justify-content: center;
      gap: 10px;
      margin: 24px 0;
    }
    .otp-digit {
      width: 48px;
      height: 56px;
      font-size: 1.5rem;
      font-weight: 700;
      text-align: center;
      border: 2px solid var(--border-color);
      border-radius: var(--radius-md);
      transition: all 0.15s ease;
      &:focus {
        outline: none;
        border-color: var(--primary);
        box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.15);
      }
    }
    .submit-btn {
      width: 100%;
      padding: 12px;
    }
    .resend-box {
      text-align: center;
      margin-top: 20px;
      font-size: 0.85rem;
      color: var(--text-muted);
    }
    .btn-resend {
      background: none;
      border: none;
      color: var(--primary);
      font-weight: 600;
      cursor: pointer;
      margin-top: 4px;
      &:disabled {
        color: var(--text-light);
        cursor: not-allowed;
      }
    }
    .auth-footer {
      text-align: center;
      margin-top: 24px;
      font-size: 0.85rem;
      a {
        color: var(--text-muted);
      }
    }
  `],
})
export class VerifyComponent {
  digits = ['', '', '', '', '', ''];
  loading = signal(false);
  errorMessage = signal<string | null>(null);
  countdown = signal(45);

  constructor(private router: Router) {
    const timer = setInterval(() => {
      if (this.countdown() > 0) {
        this.countdown.set(this.countdown() - 1);
      } else {
        clearInterval(timer);
      }
    }, 1000);
  }

  isComplete(): boolean {
    return this.digits.every((d) => d.trim().length === 1);
  }

  onDigitInput(event: any, index: number): void {
    const val = event.target.value;
    if (val && index < 5) {
      const nextInput = event.target.parentElement.querySelectorAll('input')[index + 1];
      if (nextInput) nextInput.focus();
    }
  }

  resendCode(): void {
    this.countdown.set(60);
    this.errorMessage.set(null);
  }

  onVerify(): void {
    this.loading.set(true);
    setTimeout(() => {
      this.loading.set(false);
      this.router.navigate(['/auth/select-company']);
    }, 600);
  }
}
