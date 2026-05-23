import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface ForecastRequestDTO {
  productId: number;
  month: number;
  dayOfWeek: number;
  promo: number;
  stockLevel: number;
}

export interface ForecastResponseDTO {
  predictedSales: number;
  recommendedStock: number;
  timestamp: string;
}

export interface ForecastHistory {
  id: number;
  productId: number;
  predictedSales: number;
  recommendedStock: number;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class ForecastService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = 'http://localhost:8080/api/forecast';

  private getAuthHeaders(): HttpHeaders {
    let headers = new HttpHeaders();
    const token = this.authService.getToken();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  // Get forecast history for a product
  getForecastHistory(productId: number): Observable<ForecastHistory[]> {
    return this.http.get<ForecastHistory[]>(
      `${this.apiUrl}/history/${productId}`,
      { headers: this.getAuthHeaders() }
    );
  }
}
