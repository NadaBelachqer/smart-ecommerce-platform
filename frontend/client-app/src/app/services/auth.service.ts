import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

  private decodePayload(token: string): any {
    try {
      const base64url = token.split('.')[1];
      const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
      return JSON.parse(atob(padded));
    } catch {
      return null;
    }
  }

  getUserRole(): string | null {
    const token = this.getToken();
    if (!token) return null;
    const payload = this.decodePayload(token);
    if (!payload) return null;
    const role = payload.role?.replace('ROLE_', '');
    return role || null;
  }

  getUserEmail(): string | null {
    const token = this.getToken();
    if (!token) return null;
    const payload = this.decodePayload(token);
    return payload?.sub || null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  isAdmin(): boolean {
    return this.getUserRole() === 'ADMIN';
  }

  logout() {
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }
}
