import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrderService, Order, ORDER_STATUSES } from '../../../services/order.service';
import { switchMap } from 'rxjs';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './order-detail.component.html',
  styleUrls: ['./order-detail.component.css']
})
export class OrderDetailComponent implements OnInit {
  private orderService = inject(OrderService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  order: Order | null = null;
  loading = true;
  errorMessage = '';
  successMessage = '';
  selectedStatus = '';
  updating = false;

  readonly statuses = ORDER_STATUSES;

  private readonly allowedTransitions: Record<string, string[]> = {
    PENDING: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['PROCESSING', 'CANCELLED'],
    PROCESSING: ['SHIPPED', 'CANCELLED'],
    SHIPPED: ['DELIVERED'],
    DELIVERED: [],
    CANCELLED: []
  };

  ngOnInit() {
    this.route.paramMap.pipe(
      switchMap(params => {
        const id = Number(params.get('id'));
        this.loading = true;
        this.order = null;
        this.errorMessage = '';
        return this.orderService.getOrderById(id);
      })
    ).subscribe({
      next: (data) => {
        this.order = data;
        this.selectedStatus = data.status;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Commande introuvable';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  getAvailableStatuses(): string[] {
    if (!this.order) return [];
    return this.allowedTransitions[this.order.status] || [];
  }

  canChangeStatus(): boolean {
    return this.getAvailableStatuses().length > 0;
  }

  updateStatus() {
    if (!this.order || !this.selectedStatus || this.selectedStatus === this.order.status) return;
    this.updating = true;
    this.errorMessage = '';
    this.orderService.updateOrderStatus(this.order.id, this.selectedStatus).subscribe({
      next: (updated) => {
        this.order = updated;
        this.selectedStatus = updated.status;
        this.successMessage = 'Statut mis à jour avec succès';
        this.updating = false;
        this.cdr.detectChanges();
        setTimeout(() => { this.successMessage = ''; this.cdr.detectChanges(); }, 3000);
      },
      error: () => {
        this.errorMessage = 'Erreur lors de la mise à jour du statut';
        this.updating = false;
        this.cdr.detectChanges();
      }
    });
  }

  canDelete(): boolean {
    return this.order?.status !== 'CANCELLED' && this.order?.status !== 'DELIVERED';
  }

  deleteOrder() {
    if (!this.order || !confirm(`Supprimer la commande ${this.order.orderNumber} ?`)) return;
    this.orderService.deleteOrder(this.order.id).subscribe({
      next: () => this.router.navigate(['/orders']),
      error: (err) => {
        const msg = err?.error?.message || err?.message || '';
        this.errorMessage = msg.includes('already cancelled')
          ? 'Cette commande est déjà annulée.'
          : msg.includes('delivered')
          ? 'Impossible d\'annuler une commande livrée.'
          : 'Erreur lors de la suppression.';
        this.cdr.detectChanges();
      }
    });
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'badge-warning', CONFIRMED: 'badge-info', PROCESSING: 'badge-primary',
      SHIPPED: 'badge-secondary', DELIVERED: 'badge-success', CANCELLED: 'badge-danger'
    };
    return map[status] || 'badge-secondary';
  }
}
