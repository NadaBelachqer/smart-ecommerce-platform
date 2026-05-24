import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { OrderService } from '../../services/order.service';
import { InventoryService, Alert } from '../../services/inventory.service';
import { ProductService, Product } from '../../services/product.service';
import { forkJoin, catchError, of } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  private orderService = inject(OrderService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  private inventoryService = inject(InventoryService);
  private productService = inject(ProductService);

  orderCount = 0;
  orders: any[] = [];
  loadingOrders = false;
  errorMessage?: string;
  lastUpdated?: string;
  lowStockProducts: { product: Product, stockLevel: number }[] = [];
  alertCount = 0;
  
  // Statistiques
  confirmedOrders = 0;
  cancelledOrders = 0;
  totalRevenue = 0;
  averageOrderValue = 0;

  navigate(path: string) {
    this.router.navigateByUrl(path);
  }

  ngOnInit() {
    this.loadOrderCount();
    this.loadLowStockProducts();
  }

  loadLowStockProducts() {
    this.productService.getProducts(0, 100).subscribe({
      next: (response) => {
        const products = response.content;
        const requests = products.map(p =>
          this.inventoryService.getInventory(p.id).pipe(catchError(() => of(null)))
        );
        forkJoin(requests).subscribe(inventories => {
          this.lowStockProducts = products
            .map((p, i) => ({ product: p, inv: inventories[i] }))
            .filter(x => x.inv && x.inv.stockLevel <= x.inv.reorderThreshold)
            .map(x => ({ product: x.product, stockLevel: x.inv!.stockLevel }));
          this.alertCount = this.lowStockProducts.length;
          this.cdr.detectChanges();
        });
      }
    });
  }

  loadOrderCount() {
    this.loadingOrders = true;
    this.orderService.getAllOrders().subscribe({
      next: (orders: any) => {
        console.log('Orders reçues:', orders);
        let count = 0;
        if (Array.isArray(orders)) {
          this.orders = orders;
          count = orders.length;
        } else if (orders && typeof orders === 'object') {
          if (typeof orders.total === 'number') count = orders.total;
          else if (typeof orders.count === 'number') count = orders.count;
          else if (Array.isArray(orders.data)) {
            this.orders = orders.data;
            count = orders.data.length;
          }
          else if (typeof (orders.length) === 'number') count = (orders as any).length;
        }
        console.log('Count calculé:', count);
        this.orderCount = count;
        this.calculateStatistics();
        this.loadingOrders = false;
        this.lastUpdated = new Date().toLocaleString();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur lors du chargement:', err);
        this.errorMessage = 'Impossible de charger le nombre de commandes';
        this.loadingOrders = false;
        this.lastUpdated = new Date().toLocaleString();
        this.cdr.detectChanges();
      }
    });
  }

  calculateStatistics() {
    if (!this.orders || this.orders.length === 0) {
      this.confirmedOrders = 0;
      this.cancelledOrders = 0;
      this.totalRevenue = 0;
      this.averageOrderValue = 0;
      return;
    }

    this.confirmedOrders = this.orders.filter(o => o.status === 'CONFIRMED').length;
    this.cancelledOrders = this.orders.filter(o => o.status === 'CANCELLED').length;
    this.totalRevenue = this.orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    this.averageOrderValue = this.totalRevenue / this.orders.length;
  }
}