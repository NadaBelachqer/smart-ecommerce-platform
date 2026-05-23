import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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

  private getAuthHeaders() {
    const token = this.authService.getToken();
    return {
      Authorization: `Bearer ${token}`
    };
  }

  // Get inventory for a specific product
  getInventory(productId: number): Observable<InventoryResponseDTO> {
    return this.http.get<InventoryResponseDTO>(
      `${this.apiUrl}/${productId}`,
      { headers: this.getAuthHeaders() }
    );
  }

  // Update stock level
  updateStock(productId: number, quantity: number): Observable<InventoryResponseDTO> {
    return this.http.put<InventoryResponseDTO>(
      `${this.apiUrl}/stock?productId=${productId}&quantity=${quantity}`,
      {},
      { headers: this.getAuthHeaders() }
    );
  }

  // Reserve stock for order
  reserveStock(productId: number, quantity: number): Observable<InventoryResponseDTO> {
    return this.http.put<InventoryResponseDTO>(
      `${this.apiUrl}/reserve?productId=${productId}&quantity=${quantity}`,
      {},
      { headers: this.getAuthHeaders() }
    );
  }

  // Get movement history for a product
  getMovements(productId: number): Observable<Movement[]> {
    return this.http.get<Movement[]>(
      `${this.movementsUrl}/product/${productId}`,
      { headers: this.getAuthHeaders() }
    );
  }

  // Get all movements
  getAllMovements(): Observable<Movement[]> {
    return this.http.get<Movement[]>(
      `${this.movementsUrl}`,
      { headers: this.getAuthHeaders() }
    );
  }

  // Get alerts for a product
  getAlerts(productId: number): Observable<Alert[]> {
    return this.http.get<Alert[]>(
      `${this.alertsUrl}/product/${productId}`,
      { headers: this.getAuthHeaders() }
    );
  }

  // Get all alerts
  getAllAlerts(): Observable<Alert[]> {
    return this.http.get<Alert[]>(
      `${this.alertsUrl}`,
      { headers: this.getAuthHeaders() }
    );
  }
}
