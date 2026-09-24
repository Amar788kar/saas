import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

export type NotifCategory =
  | 'NOUVEAU_PROSPECT'
  | 'NOUVEAU_DEVIS'
  | 'DEVIS_ACCEPTE'
  | 'PAIEMENT_RECU'
  | 'PAIEMENT_RETARD'
  | 'TACHE_URGENTE'
  | 'ECHEANCE_PROJET'
  | 'RELANCE_CLIENT';

export interface BtpNotification {
  id: string;
  category: NotifCategory;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  linkRoute: string;
  actionLabel: string;
  urgency: 'HIGH' | 'MEDIUM' | 'NORMAL';
}

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="notifications-page">
      <!-- HEADER -->
      <div class="page-header">
        <div>
          <h2>Centre de Notifications & Alertes Chantiers</h2>
          <p class="page-subtitle">Suivi en direct des prospects, validations de devis, encaissements et urgences opérationnelles</p>
        </div>
        <div class="header-btns">
          <button class="btn btn-outline btn-sm" (click)="markAllRead()">
            ✓ Tout marquer comme lu
          </button>
        </div>
      </div>

      <!-- FILTER TABS (8 TYPES DU PROMPT) -->
      <div class="filter-tabs-row">
        <button
          class="f-tab-btn"
          [class.active]="selectedCategory() === 'ALL'"
          (click)="selectedCategory.set('ALL')"
        >
          Toutes ({{ notifications.length }})
        </button>
        <button
          class="f-tab-btn"
          [class.active]="selectedCategory() === 'NOUVEAU_PROSPECT'"
          (click)="selectedCategory.set('NOUVEAU_PROSPECT')"
        >
          👤 Nouveaux Prospects
        </button>
        <button
          class="f-tab-btn"
          [class.active]="selectedCategory() === 'DEVIS_ACCEPTE'"
          (click)="selectedCategory.set('DEVIS_ACCEPTE')"
        >
          🎉 Devis Acceptés
        </button>
        <button
          class="f-tab-btn"
          [class.active]="selectedCategory() === 'PAIEMENT_RECU'"
          (click)="selectedCategory.set('PAIEMENT_RECU')"
        >
          💰 Paiements Reçus
        </button>
        <button
          class="f-tab-btn alert-tab"
          [class.active]="selectedCategory() === 'PAIEMENT_RETARD'"
          (click)="selectedCategory.set('PAIEMENT_RETARD')"
        >
          🚨 Paiements en Retard
        </button>
        <button
          class="f-tab-btn alert-tab"
          [class.active]="selectedCategory() === 'TACHE_URGENTE'"
          (click)="selectedCategory.set('TACHE_URGENTE')"
        >
          ⚠️ Tâches Urgentes
        </button>
        <button
          class="f-tab-btn"
          [class.active]="selectedCategory() === 'ECHEANCE_PROJET'"
          (click)="selectedCategory.set('ECHEANCE_PROJET')"
        >
          📅 Échéances Chantiers
        </button>
        <button
          class="f-tab-btn"
          [class.active]="selectedCategory() === 'RELANCE_CLIENT'"
          (click)="selectedCategory.set('RELANCE_CLIENT')"
        >
          ⏰ Relances Clients
        </button>
      </div>

      <!-- LIST OF NOTIFICATIONS -->
      <div class="card notif-card">
        <div
          *ngFor="let n of filteredNotifications()"
          class="notif-item"
          [class.unread]="!n.isRead"
          [class.high-urgency]="n.urgency === 'HIGH'"
        >
          <div class="notif-icon-box" [ngClass]="getCategoryClass(n.category)">
            <span *ngIf="n.category === 'NOUVEAU_PROSPECT'">👤</span>
            <span *ngIf="n.category === 'NOUVEAU_DEVIS'">📄</span>
            <span *ngIf="n.category === 'DEVIS_ACCEPTE'">🎉</span>
            <span *ngIf="n.category === 'PAIEMENT_RECU'">💰</span>
            <span *ngIf="n.category === 'PAIEMENT_RETARD'">🚨</span>
            <span *ngIf="n.category === 'TACHE_URGENTE'">⚠️</span>
            <span *ngIf="n.category === 'ECHEANCE_PROJET'">📅</span>
            <span *ngIf="n.category === 'RELANCE_CLIENT'">⏰</span>
          </div>

          <div class="notif-content">
            <div class="notif-header">
              <div class="title-wrap">
                <span class="category-pill" [ngClass]="getCategoryClass(n.category)">
                  {{ getCategoryLabel(n.category) }}
                </span>
                <h4 class="notif-title">{{ n.title }}</h4>
              </div>
              <span class="notif-time">{{ n.time }}</span>
            </div>
            <p class="notif-desc">{{ n.message }}</p>

            <div class="notif-footer-actions">
              <a [routerLink]="n.linkRoute" class="btn btn-outline btn-xs">
                {{ n.actionLabel }} →
              </a>
              <button *ngIf="!n.isRead" class="btn-mark-read" (click)="toggleRead(n)">
                Marquer lu
              </button>
            </div>
          </div>
        </div>

        <div *ngIf="filteredNotifications().length === 0" class="empty-state">
          <span>🔔</span>
          <p>Aucune notification dans cette catégorie pour le moment.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .notifications-page { display: flex; flex-direction: column; gap: 20px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; }
    .page-subtitle { font-size: 0.875rem; color: var(--text-muted); }
    .filter-tabs-row {
      display: flex; gap: 8px; overflow-x: auto; padding-bottom: 6px;
    }
    .f-tab-btn {
      padding: 6px 12px; font-size: 0.8rem; font-weight: 600; border: 1px solid var(--border-color);
      border-radius: var(--radius-full); background: #ffffff; cursor: pointer; white-space: nowrap; color: var(--text-muted);
      transition: all 0.15s ease;
      &.active {
        background: var(--primary); color: #ffffff; border-color: var(--primary);
      }
      &.alert-tab.active {
        background: #ef4444; border-color: #ef4444; color: #fff;
      }
    }
    .notif-card { padding: 0; overflow: hidden; }
    .notif-item {
      display: flex; gap: 16px; padding: 18px 22px; border-bottom: 1px solid var(--border-color);
      transition: background 0.15s ease;
      &:hover { background: #f8fafc; }
      &.unread {
        background: #fffaf0;
      }
      &.high-urgency.unread {
        background: #fff5f5;
        border-left: 4px solid #ef4444;
      }
    }
    .notif-icon-box {
      width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center;
      justify-content: center; font-size: 1.25rem; flex-shrink: 0; background: #f1f5f9;
      &.cat-prospect { background: #e0f2fe; }
      &.cat-devis { background: #fef3c7; }
      &.cat-accepte { background: #dcfce7; }
      &.cat-paiement { background: #d1fae5; }
      &.cat-retard { background: #fee2e2; }
      &.cat-urgent { background: #fee2e2; }
      &.cat-echeance { background: #ede9fe; }
      &.cat-relance { background: #ffedd5; }
    }
    .notif-content { flex: 1; }
    .notif-header {
      display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;
    }
    .title-wrap { display: flex; align-items: center; gap: 8px; }
    .category-pill {
      font-size: 0.675rem; font-weight: 700; padding: 2px 6px; border-radius: 4px; text-transform: uppercase;
      &.cat-prospect { background: #e0f2fe; color: #0369a1; }
      &.cat-devis { background: #fef3c7; color: #b45309; }
      &.cat-accepte { background: #dcfce7; color: #15803d; }
      &.cat-paiement { background: #d1fae5; color: #065f46; }
      &.cat-retard { background: #fee2e2; color: #991b1b; }
      &.cat-urgent { background: #fee2e2; color: #991b1b; }
      &.cat-echeance { background: #ede9fe; color: #6d28d9; }
      &.cat-relance { background: #ffedd5; color: #c2410c; }
    }
    .notif-title { font-size: 0.95rem; font-weight: 700; margin: 0; }
    .notif-time { font-size: 0.75rem; color: var(--text-muted); }
    .notif-desc { font-size: 0.85rem; color: #475569; margin-bottom: 10px; line-height: 1.4; }
    .notif-footer-actions { display: flex; align-items: center; gap: 12px; }
    .btn-xs { padding: 4px 10px; font-size: 0.75rem; font-weight: 600; }
    .btn-mark-read {
      background: none; border: none; font-size: 0.75rem; color: var(--text-muted); cursor: pointer;
      text-decoration: underline;
    }
    .empty-state {
      text-align: center; padding: 50px 20px; color: var(--text-muted);
      span { font-size: 2.5rem; display: block; margin-bottom: 10px; }
    }
  `],
})
export class NotificationsComponent {
  selectedCategory = signal<string>('ALL');

  notifications: BtpNotification[] = [
    {
      id: 'n-1',
      category: 'NOUVEAU_PROSPECT',
      title: 'Nouveau prospect en attente de contact',
      message: 'Promotion Immobilière Al-Manar a formulé une demande pour 32 logements en menuiserie alu à Oran (24 000 000 DZD).',
      time: 'Il y a 10 min',
      isRead: false,
      linkRoute: '/prospects',
      actionLabel: 'Voir le prospect',
      urgency: 'HIGH',
    },
    {
      id: 'n-2',
      category: 'DEVIS_ACCEPTE',
      title: 'Devis #DEV-2024-001 validé par le client',
      message: 'M. Belkacem Brahimi a accepté l’offre pour la Villa R+2 Chéraga (14 200 000 DZD). Marché prêt pour contrat.',
      time: 'Il y a 1 heure',
      isRead: false,
      linkRoute: '/quotes',
      actionLabel: 'Créer le contrat de marché',
      urgency: 'HIGH',
    },
    {
      id: 'n-3',
      category: 'PAIEMENT_RECU',
      title: 'Acompte encaissé avec succès',
      message: 'Réception du virement CPA de 3 400 000 DZD de SARL Numidia Import pour les travaux du Showroom.',
      time: 'Il y a 2 heures',
      isRead: false,
      linkRoute: '/payments',
      actionLabel: 'Voir le règlement',
      urgency: 'MEDIUM',
    },
    {
      id: 'n-4',
      category: 'PAIEMENT_RETARD',
      title: 'Paiement en retard de 9 jours',
      message: 'Copropriété Les Pins : La situation n°1 de 1 400 000 DZD pour l’étanchéité à Blida est échue.',
      time: 'Il y a 4 heures',
      isRead: false,
      linkRoute: '/payments',
      actionLabel: 'Envoyer relance WhatsApp',
      urgency: 'HIGH',
    },
    {
      id: 'n-5',
      category: 'TACHE_URGENTE',
      title: 'Intervention critique sur chantier',
      message: 'Coulage de la dalle 1er étage prévu demain à 07:30 sur le chantier Chéraga. Validation du ferraillage CTC requise.',
      time: 'Hier à 16:00',
      isRead: true,
      linkRoute: '/tasks',
      actionLabel: 'Vérifier la tâche',
      urgency: 'HIGH',
    },
    {
      id: 'n-6',
      category: 'ECHEANCE_PROJET',
      title: 'Échéance de phase de chantier proche',
      message: 'Chantier Showroom Numidia Oran : Fin de phase Second Œuvre prévue dans 15 jours.',
      time: 'Hier à 11:30',
      isRead: true,
      linkRoute: '/projects',
      actionLabel: 'Inspecter l’avancement',
      urgency: 'MEDIUM',
    },
    {
      id: 'n-7',
      category: 'RELANCE_CLIENT',
      title: 'Rappel de relance commerciale',
      message: 'Relancer Dr. Sid Ahmed Khelil pour le devis Climatisation VRV (4 200 000 DZD) avant expiration.',
      time: 'Il y a 2 jours',
      isRead: true,
      linkRoute: '/prospects',
      actionLabel: 'Fiche prospect',
      urgency: 'MEDIUM',
    },
    {
      id: 'n-8',
      category: 'NOUVEAU_DEVIS',
      title: 'Nouveau Devis BTP émis',
      message: 'Devis #DEV-2024-035 généré pour le Cabinet Médical Alger Centre.',
      time: 'Il y a 3 jours',
      isRead: true,
      linkRoute: '/quotes',
      actionLabel: 'Consulter le devis',
      urgency: 'NORMAL',
    },
  ];

  filteredNotifications(): BtpNotification[] {
    if (this.selectedCategory() === 'ALL') return this.notifications;
    return this.notifications.filter((n) => n.category === this.selectedCategory());
  }

  toggleRead(n: BtpNotification): void {
    n.isRead = !n.isRead;
  }

  markAllRead(): void {
    this.notifications.forEach((n) => (n.isRead = true));
  }

  getCategoryClass(cat: NotifCategory): string {
    switch (cat) {
      case 'NOUVEAU_PROSPECT': return 'cat-prospect';
      case 'NOUVEAU_DEVIS': return 'cat-devis';
      case 'DEVIS_ACCEPTE': return 'cat-accepte';
      case 'PAIEMENT_RECU': return 'cat-paiement';
      case 'PAIEMENT_RETARD': return 'cat-retard';
      case 'TACHE_URGENTE': return 'cat-urgent';
      case 'ECHEANCE_PROJET': return 'cat-echeance';
      case 'RELANCE_CLIENT': return 'cat-relance';
    }
  }

  getCategoryLabel(cat: NotifCategory): string {
    switch (cat) {
      case 'NOUVEAU_PROSPECT': return 'Prospect';
      case 'NOUVEAU_DEVIS': return 'Devis DQE';
      case 'DEVIS_ACCEPTE': return 'Devis Gagné';
      case 'PAIEMENT_RECU': return 'Encaissement';
      case 'PAIEMENT_RETARD': return 'Retard';
      case 'TACHE_URGENTE': return 'Urgent';
      case 'ECHEANCE_PROJET': return 'Échéance';
      case 'RELANCE_CLIENT': return 'Relance';
    }
  }
}
