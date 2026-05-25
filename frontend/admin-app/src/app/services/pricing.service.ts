// src/app/services/pricing.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface PricingRequest {
  productId: number;
}
export interface PricingResponse {
  product_id: number;       
  optimal_price: number;    
  expected_demand: number;  
  expected_revenue: number; 
  expected_profit: number;  
  score: number;
  competitor_price: number; 
  strategy: string;
  strategy_label: string;   
  message: string;
}

export interface PricingHistory {
  id: number;
  product_id: number;
  current_price: number;
  optimal_price: number;
  expected_demand: number;
  expected_revenue: number;
  expected_profit: number;
  competitor_price: number;
  pricing_date: string;
  created_at: string;
  strategy: string;
  strategy_label: string;
}

@Injectable({ providedIn: 'root' })
export class PricingService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = 'http://localhost:8086/pricing';

  private getAuthHeaders() {
    const token = this.authService.getToken();
    return { Authorization: `Bearer ${token}` };
  }

  optimize(productId: number): Observable<PricingResponse> {
    const body: PricingRequest = { productId };
    return this.http.post<PricingResponse>(
      `${this.apiUrl}/optimize`,
      body,
      { headers: this.getAuthHeaders() }
    );
  }

  getHistory(productId: number): Observable<PricingHistory[]> {
    return this.http.get<PricingHistory[]>(
      `${this.apiUrl}/history/${productId}`,
      { headers: this.getAuthHeaders() }
    );
  }
}