import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = 'http://localhost:8080/api/auth';

  login(email: string, password: string) {
    return this.http.post<{ token: string }>(`${this.apiUrl}/login`, { email, password });
  }

  
  register(user: any) {
    return this.http.post<{ token: string }>(`${this.apiUrl}/register`, user);
  }

  saveToken(token: string) {
    localStorage.setItem('token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getValidToken(): string | null {
    const token = this.getToken();
    if (!token) return null;
    if (this.isTokenExpired(token)) {
      localStorage.removeItem('token');
      return null;
    }
    return token;
  }

  getAuthHeaders(): HttpHeaders {
    const token = this.getValidToken();
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }

  getUserRole(): string | null {
    const payload = this.getTokenPayload();
    const role = payload?.role?.replace('ROLE_', '');
    return role || null;
  }

  getUserEmail(): string | null {
    const payload = this.getTokenPayload();
    return payload?.sub || payload?.email || null;
  }

  getUserId(): number | null {
    const payload = this.getTokenPayload();
    return payload?.userId || payload?.id || null;
  }

  isLoggedIn(): boolean {
    return !!this.getValidToken();
  }

  isAdmin(): boolean {
    return this.getUserRole() === 'ADMIN';
  }

  logout() {
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }

  private getTokenPayload(): any | null {
    const token = this.getValidToken();
    if (!token) return null;
    try {
      const payload = token.split('.')[1];
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
      return JSON.parse(atob(padded));
    } catch {
      return null;
    }
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = token.split('.')[1];
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
      const decoded = JSON.parse(atob(padded));
      return typeof decoded.exp === 'number' && decoded.exp * 1000 <= Date.now();
    } catch {
      return true;
    }
  }
}
