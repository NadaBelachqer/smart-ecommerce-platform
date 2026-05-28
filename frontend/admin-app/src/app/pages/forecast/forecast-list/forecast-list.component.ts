import { Component, OnInit, inject, ChangeDetectorRef, NgZone, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { timeout, catchError, finalize } from 'rxjs/operators';
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
export class ForecastListComponent implements OnInit, AfterViewChecked {
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

  // Forcer la détection de changement après chaque vérification
  ngAfterViewChecked() {
    this.cdr.detectChanges();
  }

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.isLoadingProducts = true;
    this.errorMessage = null;
    this.cdr.detectChanges();

    this.productService.getProducts(0, 100).pipe(
      timeout(10000),
      finalize(() => {
        this.isLoadingProducts = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (response: PageResponse<Product>) => {
        this.ngZone.run(() => {
          this.products = [...response.content]; // Nouvelle référence
          this.filteredProducts = [...response.content];
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        const isTimeout = err?.name === 'TimeoutError';
        this.errorMessage = isTimeout
          ? 'Délai dépassé — vérifiez que Docker Desktop est lancé et que tous les services sont démarrés (docker-compose up).'
          : 'Impossible de joindre le backend (localhost:8080). Vérifiez que docker-compose up est lancé.';
        this.isLoadingProducts = false;
        this.cdr.detectChanges();
      }
    });
  }

  onSearch(): void {
    const query = this.searchQuery.trim().toLowerCase();
    if (!query) {
      this.filteredProducts = [...this.products]; // Nouvelle référence
    } else {
      this.filteredProducts = this.products.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.sku.toLowerCase().includes(query) ||
        (p.category && p.category.toLowerCase().includes(query))
      );
    }
    this.cdr.detectChanges(); // Force update after search
  }

  selectProduct(product: Product): void {
    this.selectedProduct = product;
    this.selectedProductId = product.id;
    this.price = product.sellingPrice;
    
    // Reset prediction data
    this.currentPrediction = null;
    this.currentPredictionTime = null;
    this.forecastHistory = [];
    
    this.cdr.detectChanges();
    
    // Load data in parallel
    this.loadForecastHistory(product.id);
    this.loadInventoryData(product.id);
  }

  loadInventoryData(productId: number): void {
    forkJoin({
      inventory: this.inventoryService.getInventory(productId).pipe(
        timeout(8000),
        catchError(() => of(null)),
        finalize(() => this.cdr.detectChanges())
      ),
      movements: this.inventoryService.getMovements(productId).pipe(
        timeout(8000),
        catchError(() => of([])),
        finalize(() => this.cdr.detectChanges())
      )
    }).pipe(
      finalize(() => this.cdr.detectChanges())
    ).subscribe(({ inventory, movements }) => {
      if (inventory) {
        this.stockLevel = inventory.stockLevel;
      }
      
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
    this.cdr.detectChanges();
    
    this.forecastService.getForecastHistory(productId).pipe(
      timeout(8000),
      finalize(() => {
        this.isLoadingHistory = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (history: ForecastHistory[]) => {
        this.forecastHistory = history && history.length > 0
          ? [...history].sort((a: ForecastHistory, b: ForecastHistory) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )
          : [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading history:', err);
        this.forecastHistory = [];
        this.isLoadingHistory = false;
        this.cdr.detectChanges();
      }
    });
  }

  predictDemand(): void {
    if (!this.selectedProductId) {
      this.errorMessage = 'Veuillez sélectionner un produit';
      this.cdr.detectChanges();
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
    this.cdr.detectChanges();

    this.forecastService.predictDemand(request).pipe(
      timeout(15000),
      finalize(() => {
        this.isLoadingPrediction = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (prediction: ForecastResponseDTO) => {
        this.currentPrediction = prediction;
        this.currentPredictionTime = new Date().toISOString();
        this.successMessage = 'Prédiction générée avec succès !';
        
        // Refresh history after new prediction
        this.loadForecastHistory(this.selectedProductId!);
        this.cdr.detectChanges();
        
        setTimeout(() => {
          this.successMessage = null;
          this.cdr.detectChanges();
        }, 3000);
      },
      error: (err) => {
        console.error('Prediction error:', err);
        this.errorMessage = 'Erreur lors de la génération de la prédiction';
        this.cdr.detectChanges();
      }
    });
  }

  getRecommendationColor(prediction: ForecastResponseDTO): string {
    if (prediction.recommendedStock > prediction.predictedSales * 1.5) return '#ffc107';
    if (prediction.recommendedStock < prediction.predictedSales) return '#dc3545';
    return '#28a745';
  }

  getRecommendationMessage(prediction: ForecastResponseDTO | ForecastHistory): string {
    if (prediction.recommendedStock > prediction.predictedSales * 1.5) return '⚠️ Risque de surstock';
    if (prediction.recommendedStock < prediction.predictedSales) return '🔴 Risque de rupture';
    return '✅ Stock optimal';
  }

  getRecommendationClass(prediction: ForecastResponseDTO): string {
    if (prediction.recommendedStock > prediction.predictedSales * 1.5) return 'rec-warning';
    if (prediction.recommendedStock < prediction.predictedSales) return 'rec-danger';
    return 'rec-ok';
  }

  getHistoryRowClass(item: ForecastHistory): string {
    if (item.recommendedStock > item.predictedSales * 1.5) return 'row-warning';
    if (item.recommendedStock < item.predictedSales) return 'row-danger';
    return 'row-ok';
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
    const d = new Date(date);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('fr-FR', {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit'
    });
  }

  formatNumber(num: number): string {
    if (num === null || num === undefined) return '—';
    return new Intl.NumberFormat('fr-FR', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0
    }).format(num);
  }

  // Force refresh method
  refreshData(): void {
    if (this.selectedProductId) {
      this.loadInventoryData(this.selectedProductId);
      this.loadForecastHistory(this.selectedProductId);
    }
    this.cdr.detectChanges();
  }
}