import { Component, OnInit, inject, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { timeout, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { ForecastService, ForecastRequestDTO, ForecastResponseDTO, ForecastHistory } from '../../../services/forecast.service';
import { ProductService, Product, PageResponse } from '../../../services/product.service';
import { InventoryService, Movement } from '../../../services/inventory.service';

@Component({
  selector: 'app-forecast-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './forecast-list.component.html',
  styleUrls: ['./forecast-list.component.css']
})
export class ForecastListComponent implements OnInit {
  private forecastService = inject(ForecastService);
  private productService = inject(ProductService);
  private inventoryService = inject(InventoryService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

  products: Product[] = [];
  filteredProducts: Product[] = [];
  searchQuery: string = '';
  forecastHistory: ForecastHistory[] = [];
  selectedProductId: number | null = null;
  selectedProduct: Product | null = null;
  currentPrediction: ForecastResponseDTO | null = null;
  currentPredictionTime: string | null = null;
  isLoadingProducts = false;
  isLoadingPrediction = false;
  isLoadingHistory = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  // Form inputs
  month: number = new Date().getMonth() + 1;
  dayOfWeek: number = new Date().getDay();
  promoActive: boolean = false;
  stockLevel: number = 0;
  price: number = 0;
  discount: number = 0;
  unitsSold: number = 0;
  unitsOrdered: number = 0;

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.isLoadingProducts = true;
    this.errorMessage = null;
    this.productService.getProducts(0, 100).pipe(
      timeout(8000)
    ).subscribe({
      next: (response: PageResponse<Product>) => {
        this.ngZone.run(() => {
          this.products = response.content;
          this.filteredProducts = response.content;
          this.isLoadingProducts = false;
        });
      },
      error: (err) => {
        const isTimeout = err?.name === 'TimeoutError';
        this.errorMessage = isTimeout
          ? 'Délai dépassé — vérifiez que Docker Desktop est lancé et que tous les services sont démarrés (docker-compose up).'
          : 'Impossible de joindre le backend (localhost:8080). Vérifiez que docker-compose up est lancé.';
        this.isLoadingProducts = false;
      }
    });
  }

  onSearch(): void {
    const query = this.searchQuery.trim().toLowerCase();
    if (!query) {
      this.filteredProducts = this.products;
    } else {
      this.filteredProducts = this.products.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.sku.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
      );
    }
  }

  selectProduct(product: Product): void {
    this.selectedProduct = product;
    this.selectedProductId = product.id;
    this.price = product.sellingPrice;
    this.currentPrediction = null;
    this.currentPredictionTime = null;
    this.cdr.detectChanges();
    this.loadForecastHistory(product.id);
    this.loadInventoryData(product.id);
  }

  loadInventoryData(productId: number): void {
    forkJoin({
      inventory: this.inventoryService.getInventory(productId).pipe(catchError(() => of(null))),
      movements: this.inventoryService.getMovements(productId).pipe(catchError(() => of([])))
    }).subscribe(({ inventory, movements }) => {
      if (inventory) this.stockLevel = inventory.stockLevel;
      const mvts = movements as Movement[];
      const sales = mvts.filter(m => m.movementType === 'OUT').reduce((sum, m) => sum + m.quantity, 0);
      const orders = mvts.filter(m => m.movementType === 'IN').reduce((sum, m) => sum + m.quantity, 0);
      this.unitsSold = sales || 0;
      this.unitsOrdered = orders || 0;
      this.cdr.detectChanges();
    });
  }

  loadForecastHistory(productId: number): void {
    this.isLoadingHistory = true;
    this.forecastService.getForecastHistory(productId).subscribe({
      next: (history: ForecastHistory[]) => {
        this.forecastHistory = history.sort((a: ForecastHistory, b: ForecastHistory) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.isLoadingHistory = false;
      },
      error: () => {
        this.forecastHistory = [];
        this.isLoadingHistory = false;
      }
    });
  }

  predictDemand(): void {
    if (!this.selectedProductId) {
      this.errorMessage = 'Veuillez sélectionner un produit';
      return;
    }

    const request: ForecastRequestDTO = {
      productId: this.selectedProductId,
      month: this.month,
      dayOfWeek: this.dayOfWeek,
      promo: this.promoActive ? 1 : 0,
      stockLevel: this.stockLevel || 0,
      price: this.price || 0,
      discount: this.discount || 0,
      unitsSold: this.unitsSold || 0,
      unitsOrdered: this.unitsOrdered || 0
    };

    this.isLoadingPrediction = true;
    this.errorMessage = null;
    this.successMessage = null;

    this.forecastService.predictDemand(request).subscribe({
      next: (prediction: ForecastResponseDTO) => {
        this.currentPrediction = prediction;
        this.currentPredictionTime = new Date().toISOString();
        this.successMessage = 'Prédiction générée avec succès !';
        this.loadForecastHistory(this.selectedProductId!);
        this.isLoadingPrediction = false;
        this.cdr.detectChanges();
        setTimeout(() => this.successMessage = null, 3000);
      },
      error: () => {
        this.errorMessage = 'Erreur lors de la génération de la prédiction';
        this.isLoadingPrediction = false;
      }
    });
  }

  getRecommendationColor(prediction: ForecastResponseDTO): string {
    if (prediction.recommendedStock > prediction.predictedSales * 1.5) return '#ffc107';
    if (prediction.recommendedStock < prediction.predictedSales) return '#dc3545';
    return '#28a745';
  }

  getRecommendationMessage(prediction: ForecastResponseDTO): string {
    if (prediction.recommendedStock > prediction.predictedSales * 1.5) return 'Risque de surstock';
    if (prediction.recommendedStock < prediction.predictedSales) return 'Risque de rupture';
    return 'Stock optimal';
  }

  getRecommendationClass(prediction: ForecastResponseDTO): string {
    if (prediction.recommendedStock > prediction.predictedSales * 1.5) return 'rec-warning';
    if (prediction.recommendedStock < prediction.predictedSales) return 'rec-danger';
    return 'rec-ok';
  }

  getHistoryRowClass(item: ForecastHistory): string {
    if (item.recommendedStock > item.predictedSales * 1.5) return 'row-warning';
    if (item.recommendedStock < item.predictedSales) return 'row-danger';
    return '';
  }

  getMonthName(month: number): string {
    const months = ['', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    return months[month] || '';
  }

  getDayName(day: number): string {
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    return days[day] || '';
  }

  formatDate(date: string): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  formatNumber(num: number): string {
    if (num === null || num === undefined) return '—';
    return new Intl.NumberFormat('fr-FR', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0
    }).format(num);
  }
}
