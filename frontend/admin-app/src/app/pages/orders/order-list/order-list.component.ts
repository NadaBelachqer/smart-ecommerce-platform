import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrderService, Order } from '../../../services/order.service';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './order-list.component.html',
  styleUrls: ['./order-list.component.css']
})
export class OrderListComponent implements OnInit {
  private orderService = inject(OrderService);
  private cdr = inject(ChangeDetectorRef);

  orders: Order[] = [];
  filteredOrders: Order[] = [];
  loading = true;
  errorMessage = '';

  currentPage = 0;
  pageSize = 10;
  totalPages = 0;

  selectedStatus = '';
  readonly statuses = ['', 'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

  ngOnInit() { this.loadOrders(); }

  loadOrders() {
    this.loading = true;
    this.errorMessage = '';
    this.orderService.getAllOrders().subscribe({
      next: (data) => {
        this.orders = data ?? [];
        this.applyFilter();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Erreur lors du chargement des commandes';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyFilter() {
    const filtered = this.selectedStatus
      ? this.orders.filter(o => o.status === this.selectedStatus)
      : [...this.orders];
    this.currentPage = 0;
    this.totalPages = Math.ceil(filtered.length / this.pageSize) || 1;
    this.filteredOrders = filtered;
    this.cdr.detectChanges();
  }

  get pagedOrders(): Order[] {
    const start = this.currentPage * this.pageSize;
    return this.filteredOrders.slice(start, start + this.pageSize);
  }

  goToPage(page: number) {
    if (page >= 0 && page < this.totalPages) this.currentPage = page;
  }

  getPaginationArray(): number[] {
    const pages: number[] = [];
    const max = 5;
    let start = Math.max(0, this.currentPage - Math.floor(max / 2));
    let end = Math.min(this.totalPages, start + max);
    if (end - start < max) start = Math.max(0, end - max);
    for (let i = start; i < end; i++) pages.push(i);
    return pages;
  }

  deleteOrder(id: number, orderNumber: string) {
    if (!confirm(`Supprimer la commande ${orderNumber} ?`)) return;
    this.orderService.deleteOrder(id).subscribe({
      next: () => {
        this.loadOrders();
        this.errorMessage = '';
      },
      error: (err) => {
        console.error('Erreur suppression:', err);
        if (err.status === 404) {
          this.errorMessage = `La commande ${orderNumber} n'existe pas ou a déjà été supprimée`;
          this.loadOrders();
        } else if (err.status === 400) {
          this.errorMessage = `Impossible de supprimer la commande ${orderNumber}`;
        } else {
          this.errorMessage = 'Erreur lors de la suppression de la commande';
        }
        this.cdr.detectChanges();
      }
    });
  }

  isOrderDeleted(order: Order): boolean {
    return order.status === 'CANCELLED';
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'badge-warning',
      CONFIRMED: 'badge-info',
      PROCESSING: 'badge-primary',
      SHIPPED: 'badge-secondary',
      DELIVERED: 'badge-success',
      CANCELLED: 'badge-danger'
    };
    return map[status] || 'badge-secondary';
  }
}
