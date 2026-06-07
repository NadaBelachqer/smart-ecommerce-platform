import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface PromotionResponseDTO {
  id: number;
  productId: number;
  productName: string;
  category: string;
  currentPrice: number;
  suggestedDiscount: number;
  promotionalPrice: number;
  suggestedDate: string;
  reason: string;
  status: string;
  batchId: number;
  createdAt: string;
  validatedAt: string;
}

export interface PromotionBatchResponseDTO {
  batchId: number;
  batchStatus: string;
  totalSuggestions: number;
  createdAt: string;
  promotions?: PromotionResponseDTO[];
}

@Injectable({ providedIn: 'root' })
export class PromotionService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  
  // Choix 1: Appel direct au promotion-service (pour développement)
  private apiUrl = 'http://localhost:8086/promotions';
  
  // Choix 2: Garder les deux URLs et basculer facilement
  // private gatewayUrl = 'http://localhost:8080/api/promotions';
  // private directUrl = 'http://localhost:8086/promotions';
  // private useGateway = false; // Mettre à false pour utiliser direct
  // private apiUrl = this.useGateway ? this.gatewayUrl : this.directUrl;

  private headers() {
    return { Authorization: `Bearer ${this.authService.getToken()}` };
  }

  suggestPromotions(): Observable<PromotionBatchResponseDTO> {
    return this.http.post<PromotionBatchResponseDTO>(`${this.apiUrl}/suggest`, {}, { headers: this.headers() });
  }

  validateBatch(batchId: number): Observable<PromotionBatchResponseDTO> {
    return this.http.post<PromotionBatchResponseDTO>(`${this.apiUrl}/batches/${batchId}/validate`, {}, { headers: this.headers() });
  }

  rejectBatch(batchId: number): Observable<PromotionBatchResponseDTO> {
    return this.http.post<PromotionBatchResponseDTO>(`${this.apiUrl}/batches/${batchId}/reject`, {}, { headers: this.headers() });
  }

  cancelBatch(batchId: number): Observable<PromotionBatchResponseDTO> {
    return this.http.post<PromotionBatchResponseDTO>(`${this.apiUrl}/batches/${batchId}/reject`, {}, { headers: this.headers() });
  }

  getBatches(): Observable<PromotionBatchResponseDTO[]> {
    return this.http.get<PromotionBatchResponseDTO[]>(`${this.apiUrl}/batches`, { headers: this.headers() });
  }

  getBatch(batchId: number): Observable<PromotionBatchResponseDTO> {
    return this.http.get<PromotionBatchResponseDTO>(`${this.apiUrl}/batches/${batchId}`, { headers: this.headers() });
  }

  getValidated(): Observable<PromotionResponseDTO[]> {
    return this.http.get<PromotionResponseDTO[]>(`${this.apiUrl}/validated`, { headers: this.headers() });
  }
}