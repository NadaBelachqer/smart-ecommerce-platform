import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface ForecastRequestDTO {
  productId: number;
  month: number;
  dayOfWeek: number;
  promo: number;
  stockLevel: number;
  price: number;
  discount: number;
  unitsSold: number;
  unitsOrdered: number;
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

  private getAuthHeaders() {
    const token = this.authService.getToken();
    return {
      Authorization: `Bearer ${token}`
    };
  }

  // Get demand prediction for a product
  predictDemand(request: ForecastRequestDTO): Observable<ForecastResponseDTO> {
    return this.http.post<ForecastResponseDTO>(
      `${this.apiUrl}/predict`,
      request,
      { headers: this.getAuthHeaders() }
    );
  }

  // Get forecast history for a product
  getForecastHistory(productId: number): Observable<ForecastHistory[]> {
    return this.http.get<ForecastHistory[]>(
      `${this.apiUrl}/history/${productId}`,
      { headers: this.getAuthHeaders() }
    );
  }

  // Predict and get recommendations
  getPredictionWithRecommendations(request: ForecastRequestDTO): Observable<ForecastResponseDTO> {
    return this.predictDemand(request);
  }
}
