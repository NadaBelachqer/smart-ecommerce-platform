import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ForecastService, ForecastHistory } from '../../services/forecast.service';
import { InventoryService, Alert } from '../../services/inventory.service';
import { ProductService, Product } from '../../services/product.service';

@Component({
  selector: 'app-availability',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './availability.component.html',
  styleUrls: ['./availability.component.css']
})
export class AvailabilityComponent implements OnInit {
  private forecastService = inject(ForecastService);
  private inventoryService = inject(InventoryService);
  private productService = inject(ProductService);

  products: Product[] = [];
  forecastHistory: ForecastHistory[] = [];
  alerts: Alert[] = [];
  selectedProductId: number | null = null;
  selectedProduct: Product | null = null;
  isLoading = false;
  errorMessage: string | null = null;

  ngOnInit(): void {
    this.loadProducts();
    this.loadAlerts();
  }

  loadProducts(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.productService.getAllProducts(0, 100).subscribe({
      next: (response: any) => {
        this.products = response.content || response;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Erreur lors du chargement des produits';
        this.isLoading = false;
      }
    });
  }

  loadAlerts(): void {
    this.inventoryService.getAllAlerts().subscribe({
      next: (alerts: Alert[]) => {
        this.alerts = alerts;
      },
      error: () => {
        this.alerts = [];
      }
    });
  }

  selectProduct(product: Product): void {
    this.selectedProduct = product;
    this.selectedProductId = product.id;
    this.loadForecastHistory(product.id);
  }

  loadForecastHistory(productId: number): void {
    this.forecastService.getForecastHistory(productId).subscribe({
      next: (history: ForecastHistory[]) => {
        this.forecastHistory = history.sort((a: ForecastHistory, b: ForecastHistory) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      },
      error: () => {
        this.forecastHistory = [];
      }
    });
  }

  getProductAlerts(productId: number): Alert[] {
    return this.alerts.filter((a: Alert) => a.productId === productId);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatNumber(num: number): string {
    return new Intl.NumberFormat('fr-FR', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0
    }).format(num);
  }
}
