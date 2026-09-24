import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface BtpDocument {
  id: string;
  name: string;
  projectCode: string;
  category: 'PLANS_ARCHI' | 'CTC' | 'PV_RECEPTION' | 'PERMIS' | 'CONTRAT';
  fileType: 'PDF' | 'DWG' | 'DOCX';
  fileSize: string;
  date: string;
}

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="documents-page">
      <div class="page-header">
        <div>
          <h2>Plans, PV de Réception & Dossiers Réglementaires</h2>
          <p class="page-subtitle">Centralisez vos permis de construire, plans de coffrage/ferraillage, rapports CTC et PV de chantiers</p>
        </div>
        <button class="btn btn-primary">
          + Téléverser un Document
        </button>
      </div>

      <!-- DOCS GRID -->
      <div class="docs-grid">
        <div *ngFor="let doc of documents" class="doc-card card">
          <div class="doc-type-icon" [ngClass]="doc.fileType.toLowerCase()">
            {{ doc.fileType }}
          </div>
          <div class="doc-info">
            <h4 class="doc-name">{{ doc.name }}</h4>
            <p class="doc-meta">🏗️ {{ doc.projectCode }} • {{ doc.fileSize }} • 📅 {{ doc.date }}</p>
            <span class="category-badge">{{ getCategoryLabel(doc.category) }}</span>
          </div>
          <div class="doc-actions">
            <button class="btn btn-outline btn-xs">Télécharger</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .documents-page {
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

    .docs-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 16px;
    }

    .doc-card {
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .doc-type-icon {
      width: 44px;
      height: 44px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 0.85rem;

      &.pdf { background: #fee2e2; color: #b91c1c; }
      &.dwg { background: #e0f2fe; color: #0369a1; }
      &.docx { background: #eff6ff; color: #1d4ed8; }
    }

    .doc-info {
      flex: 1;

      .doc-name {
        font-size: 0.9rem;
        color: var(--text-main);
        margin-bottom: 2px;
      }

      .doc-meta {
        font-size: 0.75rem;
        color: var(--text-muted);
        margin-bottom: 6px;
      }
    }

    .category-badge {
      font-size: 0.7rem;
      font-weight: 600;
      background: #f1f5f9;
      color: #334155;
      padding: 2px 6px;
      border-radius: 4px;
    }

    .btn-xs {
      padding: 4px 8px;
      font-size: 0.775rem;
    }
  `],
})
export class DocumentsComponent {
  documents: BtpDocument[] = [
    {
      id: 'D-01',
      name: 'Plan de Coffrage & Ferraillage Dalles RDC (Approuvé CTC)',
      projectCode: 'CH-2024-001 (Villa Chéraga)',
      category: 'CTC',
      fileType: 'PDF',
      fileSize: '4.8 Mo',
      date: '2024-08-10',
    },
    {
      id: 'D-02',
      name: 'Plan d’Architecte & Façades AutoCAD',
      projectCode: 'CH-2024-001 (Villa Chéraga)',
      category: 'PLANS_ARCHI',
      fileType: 'DWG',
      fileSize: '12.4 Mo',
      date: '2024-08-05',
    },
    {
      id: 'D-03',
      name: 'PV de Réception Provisoire des Travaux sans réserves',
      projectCode: 'CH-2024-003 (Résidence Blida)',
      category: 'PV_RECEPTION',
      fileType: 'PDF',
      fileSize: '1.2 Mo',
      date: '2024-09-18',
    },
    {
      id: 'D-04',
      name: 'Permis de Construire Arrêté Municipal N° 451/2024',
      projectCode: 'CH-2024-001 (Villa Chéraga)',
      category: 'PERMIS',
      fileType: 'PDF',
      fileSize: '2.1 Mo',
      date: '2024-06-12',
    },
    {
      id: 'D-05',
      name: 'Cahier des Clauses Techniques Particulières (CCTP)',
      projectCode: 'CH-2024-002 (Showroom Oran)',
      category: 'CONTRAT',
      fileType: 'DOCX',
      fileSize: '850 Ko',
      date: '2024-08-25',
    },
  ];

  getCategoryLabel(c: BtpDocument['category']): string {
    switch (c) {
      case 'PLANS_ARCHI': return 'Plans d’Architecte';
      case 'CTC': return 'Contrôle Technique (CTC)';
      case 'PV_RECEPTION': return 'PV de Réception';
      case 'PERMIS': return 'Permis de Construire';
      case 'CONTRAT': return 'CCTP & Marché';
    }
  }
}
