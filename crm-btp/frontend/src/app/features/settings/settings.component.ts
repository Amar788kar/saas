import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="settings-page">
      <div class="page-header">
        <div>
          <h2>Paramètres de l'Entreprise & Conformité Fiscale</h2>
          <p class="page-subtitle">Configurez vos mentions légales algériennes (NIF, NIS, RC, Art. Taxe) et vos coordonnées d'entreprise</p>
        </div>
        <button class="btn btn-primary" (click)="saveSettings()">
          Sauvegarder les Paramètres
        </button>
      </div>

      <div *ngIf="successMessage()" class="alert alert-success">
        <span>✓ {{ successMessage() }}</span>
      </div>

      <div class="settings-grid">
        <!-- 1. IDENTITÉ DE L'ENTREPRISE -->
        <div class="card">
          <div class="card-title-row">
            <h3>🏢 Identité & Coordonnées de l'Entreprise</h3>
          </div>

          <div class="form-row">
            <div class="form-group flex-2">
              <label>Dénomination Sociale *</label>
              <input type="text" [(ngModel)]="company.name" placeholder="SARL BTP El-Binaa Algérie" />
            </div>
            <div class="form-group flex-1">
              <label>Forme Juridique</label>
              <select [(ngModel)]="company.legalForm">
                <option value="SARL">SARL</option>
                <option value="EURL">EURL</option>
                <option value="SPA">SPA</option>
                <option value="SNC">SNC</option>
                <option value="ARTISAN">Artisan / Personne Physique</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group flex-1">
              <label>Nom Commercial / Enseigne</label>
              <input type="text" [(ngModel)]="company.tradeName" placeholder="El-Binaa Construction" />
            </div>
            <div class="form-group flex-1">
              <label>Wilaya du Siège Social *</label>
              <select [(ngModel)]="company.wilaya">
                <option value="16 - Alger">16 - Alger</option>
                <option value="31 - Oran">31 - Oran</option>
                <option value="25 - Constantine">25 - Constantine</option>
                <option value="19 - Sétif">19 - Sétif</option>
                <option value="09 - Blida">09 - Blida</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group flex-1">
              <label>Téléphone Professionnel *</label>
              <input type="text" [(ngModel)]="company.phone" placeholder="0550 12 34 56" />
            </div>
            <div class="form-group flex-1">
              <label>Email Commercial *</label>
              <input type="email" [(ngModel)]="company.email" placeholder="contact@binaa-dz.com" />
            </div>
          </div>

          <div class="form-group">
            <label>Adresse du Siège Social</label>
            <input type="text" [(ngModel)]="company.address" placeholder="Zone d'Activité Amara, Lot 14, Chéraga, Alger" />
          </div>
        </div>

        <!-- 2. IDENTIFIANTS FISCAUX ALGERIENS -->
        <div class="card">
          <div class="card-title-row">
            <h3>⚖️ Identifiants Fiscaux & Réglementaires Algériens</h3>
            <span class="sub-hint">Indispensables pour la validité juridique de vos devis et factures</span>
          </div>

          <div class="form-row">
            <div class="form-group flex-1">
              <label>N.I.F (Numéro d'Identification Fiscale) *</label>
              <input type="text" [(ngModel)]="company.nif" placeholder="000216012345678" />
            </div>
            <div class="form-group flex-1">
              <label>N.I.S (Numéro d'Identification Statistique)</label>
              <input type="text" [(ngModel)]="company.nis" placeholder="0992160123456" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group flex-1">
              <label>R.C (Registre du Commerce) *</label>
              <input type="text" [(ngModel)]="company.rc" placeholder="16/00-1234567B22" />
            </div>
            <div class="form-group flex-1">
              <label>Article d'Imposition (A.I) *</label>
              <input type="text" [(ngModel)]="company.articleTaxe" placeholder="16240123456" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group flex-1">
              <label>Taux de TVA par défaut</label>
              <select [(ngModel)]="company.tvaRate">
                <option [ngValue]="19">19% (Taux normal Travaux BTP)</option>
                <option [ngValue]="9">9% (Taux réduit matériaux subventionnés)</option>
                <option [ngValue]="0">0% (Exonération / Achat en franchise)</option>
              </select>
            </div>
            <div class="form-group flex-1">
              <label>Devise Principale</label>
              <input type="text" value="DZD (Dinar Algérien)" disabled />
            </div>
          </div>
        </div>

        <!-- 3. COORDONNÉES BANCAIRES & CCP -->
        <div class="card">
          <div class="card-title-row">
            <h3>💳 Coordonnées Bancaires & Compte CCP</h3>
          </div>

          <div class="form-row">
            <div class="form-group flex-1">
              <label>Banque Principale</label>
              <select [(ngModel)]="company.bankName">
                <option value="BNA">Banque Nationale d'Algérie (BNA)</option>
                <option value="BEA">Banque Extérieure d'Algérie (BEA)</option>
                <option value="CPA">Crédit Populaire d'Algérie (CPA)</option>
                <option value="BDL">Banque de Développement Local (BDL)</option>
                <option value="BADR">Banque de l'Agriculture et du Dvlpt (BADR)</option>
                <option value="AL_BARAKA">Banque Al Baraka d'Algérie</option>
              </select>
            </div>
            <div class="form-group flex-2">
              <label>Numéro de Compte RIB Bancaire (20 chiffres)</label>
              <input type="text" [(ngModel)]="company.bankRib" placeholder="001 00123 1234567890 12" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group flex-2">
              <label>Numéro de Compte Courant Postal (CCP)</label>
              <input type="text" [(ngModel)]="company.ccpNumber" placeholder="0012345678" />
            </div>
            <div class="form-group flex-1">
              <label>Clé CCP</label>
              <input type="text" [(ngModel)]="company.ccpKey" placeholder="98" />
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .settings-page {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }

    .page-subtitle {
      font-size: 0.875rem;
      color: var(--text-muted);
    }

    .settings-grid {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .card-title-row {
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--border-color);

      h3 { font-size: 1.05rem; }
      .sub-hint { font-size: 0.775rem; color: var(--text-muted); display: block; margin-top: 2px; }
    }

    .form-row {
      display: flex;
      gap: 14px;
    }

    .flex-1 { flex: 1; }
    .flex-2 { flex: 2; }
  `],
})
export class SettingsComponent {
  private authService = inject(AuthService);
  successMessage = signal<string | null>(null);

  company = {
    name: 'SARL BTP El-Binaa Algérie',
    tradeName: 'El-Binaa Construction & Travaux',
    legalForm: 'SARL',
    wilaya: '16 - Alger',
    phone: '0550 12 34 56',
    email: 'contact@binaa-dz.com',
    address: 'Zone d\'Activité Amara, Lot 14, Chéraga, Alger',
    nif: '000216012345678',
    nis: '0992160123456',
    rc: '16/00-1234567B22',
    articleTaxe: '16240123456',
    tvaRate: 19,
    bankName: 'BNA',
    bankRib: '001 00123 1234567890 12',
    ccpNumber: '0012345678',
    ccpKey: '98',
  };

  saveSettings(): void {
    this.successMessage.set('Paramètres de l’entreprise sauvegardés avec succès !');
    setTimeout(() => this.successMessage.set(null), 4000);
  }
}
