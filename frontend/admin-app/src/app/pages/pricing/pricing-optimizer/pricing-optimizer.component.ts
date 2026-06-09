import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PricingService, PricingResponse, PricingHistory } from '../../../services/pricing.service';
import { ProductService, Product } from '../../../services/product.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-pricing-optimizer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './pricing-optimizer.component.html',
  styleUrls: ['./pricing-optimizer.component.css']
})
export class PricingOptimizerComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private pricingService = inject(PricingService);
  private productService = inject(ProductService);
  private cdr = inject(ChangeDetectorRef);

  productId!: number;
  product: Product | null = null;
  pricingResult: PricingResponse | null = null;
  history: PricingHistory[] = [];

  loadingProduct = false;
  loadingOptimize = false;
  loadingHistory = false;
  loadingApply = false;
  applySuccess = false;
  errorMessage = '';
  successMessage = '';

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.productId = Number(params['id']);
      if (this.productId) {
        this.loadProduct();
        this.loadHistory();
      }
    });
  }

  loadProduct() {
    this.loadingProduct = true;
    this.productService.getProductById(this.productId)
      .pipe(finalize(() => {
        this.loadingProduct = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (p) => {
          this.product = p;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);
          this.errorMessage = 'Produit introuvable';
          this.cdr.detectChanges();
        }
      });
  }

  optimize() {
    if (!this.productId) return;

    this.loadingOptimize = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.pricingResult = null;
    this.applySuccess = false;

    this.pricingService.optimize(this.productId)
      .pipe(finalize(() => {
        this.loadingOptimize = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (res) => {
          this.pricingResult = res;
          this.cdr.detectChanges();
          this.loadHistory();
        },
        error: (err) => {
          this.errorMessage = 'Erreur: ' + (err.error?.message || err.message || 'Service indisponible');
          this.cdr.detectChanges();
        }
      });
  }

  loadHistory() {
    if (!this.productId) return;

    this.loadingHistory = true;
    this.pricingService.getHistory(this.productId)
      .pipe(finalize(() => {
        this.loadingHistory = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (h) => {
          this.history = h.sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          this.cdr.detectChanges();
        },
        error: () => { this.cdr.detectChanges(); }
      });
  }

  applyPrice() {
    if (!this.pricingResult?.history_id) return;
    this.loadingApply = true;
    this.errorMessage = '';
    this.pricingService.applyPrice(this.pricingResult.history_id)
      .pipe(finalize(() => { this.loadingApply = false; this.cdr.detectChanges(); }))
      .subscribe({
        next: () => {
          this.applySuccess = true;
          this.successMessage = `Prix optimal de ${this.pricingResult!.optimal_price.toFixed(2)} DH applique avec succes sur le catalogue !`;
          if (this.product) this.product.sellingPrice = this.pricingResult!.optimal_price;
          this.loadHistory();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.errorMessage = "Erreur lors de l'application: " + (err.error?.message || err.message);
          this.cdr.detectChanges();
        }
      });
  }

  getPriceDiff(): number {
    if (!this.pricingResult || !this.product) return 0;
    return this.pricingResult.optimal_price - this.product.sellingPrice;
  }

  getPriceDiffPercent(): number {
    if (!this.product?.sellingPrice) return 0;
    return (this.getPriceDiff() / this.product.sellingPrice) * 100;
  }

  getScoreClass(score: number): string {
    if (score >= 0) return 'score-high';
    if (score >= -500) return 'score-medium';
    return 'score-low';
  }

  getStrategyClass(strategy: string): string {
    const classes: Record<string, string> = {
      'stock_critical': 'strategy-critical',
      'liquidation': 'strategy-liquidation',
      'destocking': 'strategy-destocking',
      'penetration': 'strategy-penetration',
      'premium': 'strategy-premium',
      'promo_seasonal': 'strategy-promo',
      'competitive': 'strategy-competitive'
    };
    return classes[strategy] || '';
  }

  getStrategyIcon(strategy: string): string {
    const icons: Record<string, string> = {
      'stock_critical': 'fa-triangle-exclamation',
      'liquidation': 'fa-tag',
      'destocking': 'fa-boxes',
      'penetration': 'fa-rocket',
      'premium': 'fa-gem',
      'promo_seasonal': 'fa-calendar-alt',
      'competitive': 'fa-chart-line'
    };
    return icons[strategy] || 'fa-chart-simple';
  }
}
