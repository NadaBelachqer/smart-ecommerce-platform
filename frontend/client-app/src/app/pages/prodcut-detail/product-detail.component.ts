import { Component, inject, OnInit,ChangeDetectorRef  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ProductService, Product } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { Promotion, PromotionService } from '../../services/promotion.service';
@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css']
})
export class ProductDetailComponent implements OnInit {

  private productService = inject(ProductService);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  private cartService = inject(CartService);
  private promotionService = inject(PromotionService);

  product: Product | null = null;
  promotion: Promotion | null = null;
  loading = true;
  errorMessage = '';
  addedToCart = false;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      const productId = Number(id);
      this.loadProduct(productId);
      this.loadPromotion(productId);
    } else {
      this.loading = false;
      this.errorMessage = 'ID invalide';

      this.cdr.detectChanges(); 
    }
  }

  
  loadProduct(id: number) {
    this.loading = true;
    this.errorMessage = '';

    this.productService.getProductById(id)
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.detectChanges(); 
      }))
      .subscribe({
        next: (data) => {
          this.product = data;
          this.cdr.detectChanges(); 
        },
        error: () => {
          this.product = null;
          this.errorMessage = 'Produit non trouvé';
          this.cdr.detectChanges(); 
        }
      });
  }

  loadPromotion(productId: number) {
    this.promotionService.getValidatedPromotions()
      .subscribe({
        next: (promotions) => {
          this.promotion = (promotions || [])
            .find(promotion => Number(promotion.productId) === Number(productId)) || null;
          this.cdr.detectChanges();
        },
        error: () => {
          this.promotion = null;
          this.cdr.detectChanges();
        }
      });
  }

  
  addToCart() {
    if (this.product) {
      const product = this.promotion
        ? { ...this.product, sellingPrice: Number(this.promotion.promotionalPrice) }
        : this.product;
      this.cartService.add(product);
      this.addedToCart = true;
      setTimeout(() => this.addedToCart = false, 2000);
    }
  }

  getImageUrl(): string {
    if (!this.product?.imageUrl) {
      return 'https://via.placeholder.com/400?text=No+Image';
    }

    if (this.product.imageUrl.startsWith('http')) {
      return this.product.imageUrl;
    }

    if (this.product.imageUrl.startsWith('/uploads/')) {
      return `http://localhost:8080${this.product.imageUrl}`;
    }

    return 'https://via.placeholder.com/400?text=No+Image';
  }

  quantity: number = 1;

  formatPrice(price: number | undefined | null): string {
    return Number(price || 0).toFixed(2);
  }

  discountLabel(): string {
    return this.promotion ? `-${Math.round(Number(this.promotion.suggestedDiscount || 0))}%` : '';
  }

  originalPrice(): number {
    return Number(this.promotion?.currentPrice || this.product?.sellingPrice || 0);
  }



  
}
