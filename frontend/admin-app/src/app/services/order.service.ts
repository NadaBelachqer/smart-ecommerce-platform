import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { AuthService } from './auth.service';

export interface OrderItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  id: number;
  orderNumber: string;
  userId: number;
  totalAmount: number;
  status: string;
  shippingAddress: string;
  paymentMethod: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export const ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

@Injectable({ providedIn: 'root' })
export class OrderService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = 'http://localhost:8080/api/orders/admin';

  private getHeaders() {
    return { Authorization: `Bearer ${this.authService.getToken()}` };
  }

  getAllOrders(): Observable<Order[]> {
    return this.http.get<ApiResponse<Order[]>>(
      `${this.apiUrl}/all`,
      { headers: this.getHeaders() }
    ).pipe(map(r => r.data));
  }

  getOrderById(id: number): Observable<Order> {
    return this.http.get<ApiResponse<Order>>(
      `${this.apiUrl}/${id}`,
      { headers: this.getHeaders() }
    ).pipe(map(r => r.data));
  }

  updateOrderStatus(id: number, status: string): Observable<Order> {
    return this.http.put<ApiResponse<Order>>(
      `${this.apiUrl}/${id}/status?status=${status}`,
      null,
      { headers: this.getHeaders() }
    ).pipe(map(r => r.data));
  }

  deleteOrder(id: number): Observable<ApiResponse<Order>> {
    return this.http.delete<ApiResponse<Order>>(
      `${this.apiUrl}/${id}/cancel`,
      { headers: this.getHeaders() }
    );
  }
}
