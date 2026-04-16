import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductService, Product, PageResponse } from '../../../services/product.service';
import { finalize } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css']
})
export class ProductListComponent implements OnInit {

  private productService = inject(ProductService);
  private cdr = inject(ChangeDetectorRef);

    Math = Math;

  products: Product[] = [];
  loading = false;
  errorMessage = '';
  
  currentPage = 0;
  pageSize = 10;
  totalPages = 0;
  totalElements = 0;
    searchKeyword = '';
    selectedCategory = '';
  categories: string[] = [];

  private imageBaseUrl = 'http://localhost:8080';

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.loading = true;
    this.errorMessage = '';
    this.productService.getAllProducts(this.currentPage, this.pageSize)
      .pipe( finalize(() => {
        this.loading = false;
          this.cdr.detectChanges(); 
        })
      )
      .subscribe({
        next: (response: PageResponse<Product>) => {
          console.log(' Données reçues:', response);
          this.products = response.content;
          this.totalPages = response.totalPages;
          this.totalElements = response.totalElements;
          this.currentPage = response.number;
          
          this.extractCategories(response.content);
        },
        error: (err) => {
          console.error(err);
          this.errorMessage = 'Erreur lors du chargement des produits';
        }
      });
  }

  extractCategories(products: Product[]) {
    const uniqueCategories = [...new Set(products.map(p => p.category).filter(c => c))];
    this.categories = uniqueCategories;
  }

  filterByCategory(category: string) {
    this.selectedCategory = category;
    this.currentPage = 0;
    this.loadProducts();
  }

  search() {
    this.currentPage = 0;
    this.loadProducts();
  }

  resetFilters() {
    this.searchKeyword = '';
    this.selectedCategory = '';
    this.currentPage = 0;
    this.loadProducts();
  }

  goToPage(page: number) {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadProducts();
    }
  }

  changePageSize(size: number) {
    this.pageSize = size;
    this.currentPage = 0;
    this.loadProducts();
  }

  getImageUrl(imagePath: string): string {
    if (!imagePath) {
      return '';
    }
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    return `${this.imageBaseUrl}${imagePath}`;
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="%23999" stroke-width="2"%3E%3Crect x="2" y="2" width="20" height="20" rx="2.18"%3E%3C/rect%3E%3Cpath d="M8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"%3E%3C/path%3E%3Cpath d="M21.5 15.5L17 11l-4 4-3-3-5 5"%3E%3C/path%3E%3C/svg%3E';
    img.classList.add('image-error');
  }

  deleteProduct(id: number, name: string) {
    if (confirm(`Supprimer le produit "${name}" ?`)) {
      this.productService.deleteProduct(id)
        .subscribe({
          next: () => {
            this.loadProducts();
          },
          error: (err) => {
            console.error(err);
            this.errorMessage = 'Erreur lors de la suppression';
          }
        });
    }
  }

  getPaginationArray(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(0, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible);
    
    if (end - start < maxVisible) {
      start = Math.max(0, end - maxVisible);
    }
    
    for (let i = start; i < end; i++) {
      pages.push(i);
    }
    return pages;
  }
}