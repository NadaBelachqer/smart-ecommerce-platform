import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';

export interface Promotion {
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

@Injectable({ providedIn: 'root' })
export class PromotionService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/promotions';
  private directApiUrl = 'http://localhost:8086/promotions';

  getValidatedPromotions(): Observable<Promotion[]> {
    return this.http.get<Promotion[]>(`${this.apiUrl}/validated`).pipe(
      catchError(() => this.http.get<Promotion[]>(`${this.directApiUrl}/validated`))
    );
  }
}
