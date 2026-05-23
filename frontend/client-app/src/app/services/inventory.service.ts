import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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

  private getAuthHeaders(): HttpHeaders {
    let headers = new HttpHeaders();
    const token = this.authService.getToken();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  // Get inventory for a specific product
  getInventory(productId: number): Observable<InventoryResponseDTO> {
    return this.http.get<InventoryResponseDTO>(
      `${this.apiUrl}/${productId}`,
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
