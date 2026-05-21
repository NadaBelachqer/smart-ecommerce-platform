import { Component, inject, OnInit, OnDestroy ,ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription, finalize } from 'rxjs';
import { ProductService, Product } from '../../services/product.service';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {

  private productService = inject(ProductService);
  public authService = inject(AuthService);
  public cartService = inject(CartService);
  private cdr = inject(ChangeDetectorRef); 

  products: Product[] = [];
  loading = false;
  errorMessage = '';
  searchKeyword = '';
  selectedCategory = '';

  currentPage = 0;
pageSize = 6;
hasMore = true;

  private subscriptions: Subscription[] = [];

  ngOnInit() {
    this.loadProducts();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
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
    this.cartService.add(product);
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