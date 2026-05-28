import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { AuthService } from './auth.service';

export interface InventoryResponseDTO {
  inventoryId: number;
  productId: number;
  stockLevel: number;
  reorderThreshold: number;
  reservedStock: number;
  createdAt: string;
  updatedAt: string;
}

export interface Movement {
  movementId: number;
  productId: number;
  movementType: 'IN' | 'OUT' | 'RESERVE';
  quantity: number;
  createdAt: string;
}

export interface Alert {
  alertId: number;
  productId: number;
  alertType: string;
  createdAt: string;
  status: string;
}

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = 'http://localhost:8080/api/inventory';
  private movementsUrl = 'http://localhost:8080/api/movements';
  private alertsUrl = 'http://localhost:8080/api/alerts';

  private cache = new Map<string, Observable<any>>();

  clearCache() { this.cache.clear(); }

  private getAuthHeaders() {
    const token = this.authService.getToken();
    return {
      Authorization: `Bearer ${token}`
    };
  }

  getInventory(productId: number): Observable<InventoryResponseDTO> {
    const key = `inventory-${productId}`;
    if (!this.cache.has(key)) {
      this.cache.set(key, this.http.get<InventoryResponseDTO>(`${this.apiUrl}/${productId}`, { headers: this.getAuthHeaders() }).pipe(shareReplay(1)));
    }
    return this.cache.get(key)!;
  }

  // Update stock level
  updateStock(productId: number, quantity: number): Observable<InventoryResponseDTO> {
    // Vider le cache pour forcer le rechargement après mise à jour
    this.cache.delete(`inventory-${productId}`);
    this.cache.delete(`movements-${productId}`);
    return this.http.put<InventoryResponseDTO>(
      `${this.apiUrl}/stock?productId=${productId}&quantity=${quantity}`,
      {},
      { headers: this.getAuthHeaders() }
    );
  }

  // Reserve stock for order
  reserveStock(productId: number, quantity: number): Observable<InventoryResponseDTO> {
    // Vider le cache pour forcer le rechargement après réservation
    this.cache.delete(`inventory-${productId}`);
    this.cache.delete(`movements-${productId}`);
    return this.http.put<InventoryResponseDTO>(
      `${this.apiUrl}/reserve?productId=${productId}&quantity=${quantity}`,
      {},
      { headers: this.getAuthHeaders() }
    );
  }

  getMovements(productId: number): Observable<Movement[]> {
    const key = `movements-${productId}`;
    if (!this.cache.has(key)) {
      this.cache.set(key, this.http.get<Movement[]>(`${this.movementsUrl}/product/${productId}`, { headers: this.getAuthHeaders() }).pipe(shareReplay(1)));
    }
    return this.cache.get(key)!;
  }

  // Get all movements
  getAllMovements(): Observable<Movement[]> {
    if (!this.cache.has('movements')) {
      this.cache.set('movements', this.http.get<Movement[]>(`${this.movementsUrl}`, { headers: this.getAuthHeaders() }).pipe(shareReplay(1)));
    }
    return this.cache.get('movements')!;
  }

  getAlerts(productId: number): Observable<Alert[]> {
    const key = `alerts-${productId}`;
    if (!this.cache.has(key)) {
      this.cache.set(key, this.http.get<Alert[]>(`${this.alertsUrl}/product/${productId}`, { headers: this.getAuthHeaders() }).pipe(shareReplay(1)));
    }
    return this.cache.get(key)!;
  }

  // Get all alerts
  getAllAlerts(): Observable<Alert[]> {
    if (!this.cache.has('alerts')) {
      this.cache.set('alerts', this.http.get<Alert[]>(`${this.alertsUrl}`, { headers: this.getAuthHeaders() }).pipe(shareReplay(1)));
    }
    return this.cache.get('alerts')!;
  }
}
