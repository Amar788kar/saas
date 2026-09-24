import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: string;
  type: 'SUCCESS' | 'ERROR' | 'INFO' | 'WARNING';
  title: string;
  message?: string;
  durationMs?: number;
}

export interface ConfirmationDialog {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  toasts = signal<ToastMessage[]>([]);
  activeConfirmation = signal<ConfirmationDialog | null>(null);

  show(toast: Omit<ToastMessage, 'id'>): void {
    const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
    const newToast: ToastMessage = { ...toast, id };
    this.toasts.update((current) => [...current, newToast]);

    setTimeout(() => {
      this.remove(id);
    }, toast.durationMs || 4000);
  }

  success(title: string, message?: string): void {
    this.show({ type: 'SUCCESS', title, message });
  }

  error(title: string, message?: string): void {
    this.show({ type: 'ERROR', title, message });
  }

  warning(title: string, message?: string): void {
    this.show({ type: 'WARNING', title, message });
  }

  info(title: string, message?: string): void {
    this.show({ type: 'INFO', title, message });
  }

  remove(id: string): void {
    this.toasts.update((current) => current.filter((t) => t.id !== id));
  }

  confirm(dialog: ConfirmationDialog): void {
    this.activeConfirmation.set(dialog);
  }

  resolveConfirm(confirmed: boolean): void {
    const dialog = this.activeConfirmation();
    if (!dialog) return;
    if (confirmed) {
      dialog.onConfirm();
    } else if (dialog.onCancel) {
      dialog.onCancel();
    }
    this.activeConfirmation.set(null);
  }
}
