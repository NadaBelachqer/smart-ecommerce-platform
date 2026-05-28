import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface Product {
  id: number;
  sku: string;
  name: string;
  category: string;
  description: string;
  sellingPrice: number;
  cost?: number;
  expirationDate?: string;  
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductRequest {
  sku: string;
  name: string;
  category: string;
  description: string;
  sellingPrice: number;
  cost?: number;
  expirationDate?: string;  
  imageUrl?: string;
  imageFile?: File;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = 'http://localhost:8080/api';
  private imageBaseUrl = 'http://localhost:8080';

  private getAuthHeaders() {
    const token = this.authService.getToken();
    return { Authorization: `Bearer ${token}` };
  }

  private normalizeImageUrl(product: Product): Product {
    if (product.imageUrl && product.imageUrl.startsWith('/uploads/')) {
      product.imageUrl = `${this.imageBaseUrl}${product.imageUrl}`;
    }
    return product;
  }

  private normalizeImageUrls(products: Product[]): Product[] {
    return products.map(p => this.normalizeImageUrl(p));
  }

  getProducts(
    page: number = 0,
    size: number = 10,
    keyword: string = '',
    category: string = ''
  ): Observable<PageResponse<Product>> {
    // CORRECTION: Utiliser le bon endpoint /products (sans /admin/list)
    let url = `${this.apiUrl}/products`;
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    if (keyword && keyword.trim()) {
      params = params.set('keyword', keyword.trim());
    }
    if (category && category.trim()) {
      params = params.set('category', category.trim());
    }
    
    console.log('📡 Appel API produits:', url, params.toString());
    
    return this.http.get<PageResponse<Product>>(url, { 
      headers: this.getAuthHeaders(),
      params: params
    }).pipe(map(response => ({
      ...response,
      content: this.normalizeImageUrls(response.content)
    })));
  }

  // Garder cette méthode pour la compatibilité si nécessaire
  getProductsAdmin(page: number = 0, size: number = 10): Observable<PageResponse<Product>> {
    return this.http.get<PageResponse<Product>>(`${this.apiUrl}/products/admin/list`, { 
      headers: this.getAuthHeaders(),
      params: new HttpParams().set('page', page).set('size', size)
    });
  }

  getProductById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/products/${id}`, { headers: this.getAuthHeaders() })
      .pipe(map(product => this.normalizeImageUrl(product)));
  }

  createProduct(product: ProductRequest, imageFile?: File): Observable<Product> {
    const token = this.authService.getToken();
    const formData = new FormData();
    const productBlob = new Blob([JSON.stringify(product)], { type: 'application/json' });
    formData.append('product', productBlob);
    if (imageFile) {
      formData.append('image', imageFile);
    }
    
    return this.http.post<Product>(
      `${this.apiUrl}/products/admin/create`,
      formData,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
  }

  importProductsCsv(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(
      `${this.apiUrl}/products/admin/import/csv`,
      formData,
      { headers: this.getAuthHeaders(), responseType: 'text' }
    );
  }

  updateProduct(id: number, product: ProductRequest, imageFile?: File): Observable<Product> {
    const token = this.authService.getToken();
    const formData = new FormData();
    const productBlob = new Blob([JSON.stringify(product)], { type: 'application/json' });
    formData.append('product', productBlob);
    if (imageFile) {
      formData.append('image', imageFile);
    }
    
    return this.http.put<Product>(
      `${this.apiUrl}/products/admin/update/${id}`,
      formData,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/products/admin/delete/${id}`, { headers: this.getAuthHeaders() });
  }
}