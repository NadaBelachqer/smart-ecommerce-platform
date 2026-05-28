import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { OrderService, Order, ApiResponse } from '../../services/order.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css']
})
export class OrdersComponent implements OnInit {
  private orderService = inject(OrderService);
  public authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  orders: Order[] = [];
  loading = true;
  deletingOrderId: number | null = null;
  errorMessage = '';
  expandedOrderId: number | null = null;

  ngOnInit() {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    this.loadOrders();
  }

  loadOrders() {
    this.loading = true;
    this.errorMessage = '';

    const request$ = this.authService.isAdmin()
      ? this.orderService.getAllOrders()
      : this.orderService.getMyOrders();

    request$
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (res) => {
          console.log('Orders response from backend:', res);
          this.orders = this.extractOrders(res)
            .sort((a, b) => this.toTime(b.createdAt) - this.toTime(a.createdAt));
        },
        error: (err) => {
          console.error('Orders loading failed:', err);
          if (err.status === 401) {
            this.authService.logout();
            this.errorMessage = 'Session expiree. Veuillez vous reconnecter.';
            return;
          }
          this.errorMessage = this.extractErrorMessage(err, 'Erreur lors du chargement des commandes');
        }
      });
  }

  toggleExpand(id: number) {
    this.expandedOrderId = this.expandedOrderId === id ? null : id;
  }

  deleteOrder(order: Order, event?: Event) {
    event?.stopPropagation();

    if (!this.canDelete(order.status)) {
      alert('Cette commande ne peut plus etre supprimee.');
      return;
    }

    if (!confirm('Supprimer cette commande ?')) return;

    this.deletingOrderId = order.id;
    const request$ = this.authService.isAdmin()
      ? this.orderService.adminCancelOrder(order.id)
      : this.orderService.cancelOrder(order.id);

    request$
      .pipe(finalize(() => {
        this.deletingOrderId = null;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: () => this.loadOrders(),
        error: (err) => {
          console.error('Order deletion failed:', err);
          alert(this.extractErrorMessage(err, 'Impossible de supprimer cette commande'));
        }
      });
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      PENDING: 'En attente',
      CONFIRMED: 'Confirmee',
      PROCESSING: 'En preparation',
      SHIPPED: 'Expediee',
      DELIVERED: 'Livree',
      CANCELLED: 'Supprimee',
      REFUNDED: 'Remboursee'
    };
    return labels[status] || status;
  }

  statusClass(status: string): string {
    const classes: Record<string, string> = {
      PENDING: 'status-pending',
      CONFIRMED: 'status-confirmed',
      PROCESSING: 'status-processing',
      SHIPPED: 'status-shipped',
      DELIVERED: 'status-delivered',
      CANCELLED: 'status-cancelled',
      REFUNDED: 'status-refunded'
    };
    return classes[status] || '';
  }

  canDelete(status: string): boolean {
    if (this.authService.isAdmin()) {
      return status !== 'CANCELLED' && status !== 'DELIVERED';
    }

    return ['PENDING', 'CONFIRMED'].includes(status);
  }

  trackByOrderId(_: number, order: Order): number {
    return order.id;
  }

  private extractOrders(response: ApiResponse<Order[]> | any): Order[] {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (response?.data) return [response.data];
    return [];
  }

  private toTime(value: string): number {
    const time = new Date(value).getTime();
    return Number.isNaN(time) ? 0 : time;
  }

  private extractErrorMessage(err: any, fallback: string): string {
    if (typeof err.error === 'string') {
      try {
        const parsed = JSON.parse(err.error);
        return parsed?.message || err.error;
      } catch {
        return err.error;
      }
    }
    return err.error?.message || err.message || fallback;
  }
}
