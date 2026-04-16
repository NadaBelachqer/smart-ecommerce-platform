import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface Product {
  id: number;
  sku: string;
  name: string;
  category: string;
  description: string;
  sellingPrice: number;
  imageUrl: string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/products';
  private imageBaseUrl = 'http://localhost:8080';  

  /*getAllProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(this.apiUrl).pipe(
      map(products => this.normalizeImageUrls(products))
    );
  }*/

    getAllProducts(page = 0, size = 6): Observable<any> {
  return this.http.get<any>(
    `${this.apiUrl}?page=${page}&size=${size}`
  );
}

  

  getProductById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`).pipe(
      map(product => this.normalizeImageUrl(product))
    );
  }

  getProductsByCategory(category: string): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/category/${category}`).pipe(
      map(products => this.normalizeImageUrls(products))
    );
  }

  searchProducts(keyword: string): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/search?keyword=${keyword}`).pipe(
      map(products => this.normalizeImageUrls(products))
    );
  }

  private normalizeImageUrl(product: Product): Product {
    if (product.imageUrl && product.imageUrl.startsWith('/uploads/')) {
      product.imageUrl = `${this.imageBaseUrl}${product.imageUrl}`;
    }
    return product;
  }

  private normalizeImageUrls(products: Product[]): Product[] {
    return products.map(product => this.normalizeImageUrl(product));
  }
}