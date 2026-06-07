import { Component, inject, OnInit, OnDestroy ,ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription, finalize } from 'rxjs';
import { ProductService, Product } from '../../services/product.service';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { Promotion, PromotionService } from '../../services/promotion.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {

  private productService = inject(ProductService);
  private promotionService = inject(PromotionService);
  public authService = inject(AuthService);
  public cartService = inject(CartService);
  private cdr = inject(ChangeDetectorRef);

  products: Product[] = [];
  loading = false;
  errorMessage = '';
  searchKeyword = '';
  selectedCategory = '';
  promotions: Promotion[] = [];
  promotionsByProductId = new Map<number, Promotion>();
  promotionProductsById = new Map<number, Product>();

  currentPage = 0;
  pageSize = 6;
  hasMore = true;

  private subscriptions: Subscription[] = [];

  ngOnInit() {
    this.loadPromotions();
    this.loadProducts();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadPromotions() {
    const sub = this.promotionService.getValidatedPromotions()
      .subscribe({
        next: (promotions) => {
          this.promotions = promotions || [];
          this.promotionsByProductId = new Map(
            this.promotions.map(p => [Number(p.productId), p])
          );
          this.promotions.forEach(p => {
            const id = Number(p.productId);
            if (!this.promotionProductsById.has(id)) {
              this.productService.getProductById(id).subscribe({
                next: (product) => {
                  this.promotionProductsById.set(id, product);
                  this.cdr.detectChanges();
                },
                error: () => {}
              });
            }
          });
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);
          this.promotions = [];
          this.promotionsByProductId = new Map();
          this.cdr.detectChanges();
        }
      });

    this.subscriptions.push(sub);
  }

  loadProducts(reset: boolean = true) {
    if (reset) {
      this.currentPage = 0;
      this.products = [];
      this.hasMore = true;
    }

    this.loading = true;
    this.errorMessage = '';

    const sub = this.productService.getAllProducts(this.currentPage, this.pageSize)
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (response) => {
          const newProducts = response.content || [];
          this.products = [...this.products, ...newProducts];
          this.hasMore = !response.last;
          this.currentPage++;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);
          this.errorMessage = 'Erreur lors du chargement du catalogue';
          this.cdr.detectChanges();
        }
      });

    this.subscriptions.push(sub);
  }

  loadMore() {
    this.loadProducts(false);
  }

  search() {
    const keyword = this.searchKeyword.trim();
    if (!keyword) {
      this.loadProducts();
      return;
    }
    this.loading = true;
    this.errorMessage = '';

    const sub = this.productService.searchProducts(keyword)
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (data) => {
          this.products = data || [];
          this.selectedCategory = '';
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);
          this.errorMessage = 'Erreur search';
          this.products = [];
          this.cdr.detectChanges();
        }
      });

    this.subscriptions.push(sub);
  }

  filterByCategory(category: string) {
    this.selectedCategory = category;
    if (!category) {
      this.loadProducts();
      return;
    }
    this.loading = true;
    this.errorMessage = '';

    const sub = this.productService.getProductsByCategory(category)
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (data) => {
          this.products = data || [];
          this.searchKeyword = '';
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);
          this.errorMessage = 'Erreur filtre catégorie';
          this.products = [];
          this.cdr.detectChanges();
        }
      });
    this.subscriptions.push(sub);
  }

  getImageUrl(product: Product): string {
    if (product.imageUrl && product.imageUrl.startsWith('http')) {
      return product.imageUrl;
    }
    if (product.imageUrl && product.imageUrl.startsWith('/uploads/')) {
      return `http://localhost:8080${product.imageUrl}`;
    }
    return 'https://placehold.co/300x300?text=Image+coming+soon';
  }

  addToCart(product: Product) {
    const promotion = this.getPromotion(product);
    const cartProduct = promotion
      ? { ...product, sellingPrice: promotion.promotionalPrice }
      : product;
    this.cartService.add(cartProduct);
  }

  addPromotionToCart(promotion: Promotion) {
    const loadedProduct = this.getProductForPromotion(promotion);
    const product: Product = {
      id: Number(promotion.productId),
      sku: loadedProduct?.sku || '',
      name: loadedProduct?.name || promotion.productName,
      category: loadedProduct?.category || promotion.category,
      description: loadedProduct?.description || promotion.reason || '',
      sellingPrice: Number(promotion.promotionalPrice),
      imageUrl: loadedProduct?.imageUrl || ''
    };
    this.cartService.add(product);
  }

  getProductForPromotion(promotion: Promotion): Product | undefined {
    const id = Number(promotion.productId);
    return this.promotionProductsById.get(id)
      || this.products.find(p => Number(p.id) === id);
  }

  promotionImageUrl(promotion: Promotion): string {
    const product = this.getProductForPromotion(promotion);
    return product ? this.getImageUrl(product) : 'https://placehold.co/400x400/fff7ed/c2410c?text=PROMO';
  }

  getPromotion(product: Product): Promotion | undefined {
    return this.promotionsByProductId.get(Number(product.id));
  }

  hasPromotion(product: Product): boolean {
    return !!this.getPromotion(product);
  }

  formatPrice(price: number | undefined | null): string {
    return Number(price || 0).toFixed(2);
  }

  originalPrice(product: Product): number {
    return Number(this.getPromotion(product)?.currentPrice || product.sellingPrice || 0);
  }

  discountLabel(product: Product): string {
    const promotion = this.getPromotion(product);
    return promotion ? this.promotionDiscountLabel(promotion) : '';
  }

  promotionDiscountLabel(promotion: Promotion): string {
    return `-${Math.round(Number(promotion.suggestedDiscount || 0))}%`;
  }

  logout() {
    this.authService.logout();
  }

  getUserDisplayName(): string {
    const email = this.authService.getUserEmail();
    if (email && email.includes('@')) {
      return email.split('@')[0];
    }
    return 'Client';
  }
}
