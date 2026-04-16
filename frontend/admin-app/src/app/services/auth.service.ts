import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = 'http://localhost:8080/api/auth';

  register(user: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    address?: string;
    phone?: string;
  }): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(`${this.apiUrl}/register`, user);
  }

  registerAdmin(user: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    address?: string;
    phone?: string;
  }): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(`${this.apiUrl}/register-admin`, user);
  }

  login(email: string, password: string): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(`${this.apiUrl}/login`, { email, password });
  }

  saveToken(token: string) {
    localStorage.setItem('adminToken', token);
    console.log('Token sauvegardé');
  }

  getToken(): string | null {
    return localStorage.getItem('adminToken');
  }

  clearToken() {
    localStorage.removeItem('adminToken');
  }

  private decodeToken(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.error('Token invalide');
        return null;
      }
      const payload = JSON.parse(atob(parts[1]));
      console.log('Token décodé:', payload);
      return payload;
    } catch (error) {
      console.error('Erreur décodage token:', error);
      return null;
    }
  }

  getUserRole(): string | null {
    const token = this.getToken();
    if (!token) return null;
    
    const payload = this.decodeToken(token);
    if (!payload) return null;
    
    let role = payload.role || payload.roles || payload.authorities;
    
    if (Array.isArray(role)) {
      role = role[0];
    }
    
    if (role && typeof role === 'string' && role.startsWith('ROLE_')) {
      role = role.substring(5);
    }
    
    console.log('Rôle extrait:', role);
    return role || null;
  }

  getUserEmail(): string | null {
    const token = this.getToken();
    if (!token) return null;
    const payload = this.decodeToken(token);
    return payload?.sub || payload?.email || null;
  }

  isAdmin(): boolean {
    const role = this.getUserRole();
    const isAdmin = role === 'ADMIN';
    console.log('isAdmin():', isAdmin, 'rôle:', role);
    return isAdmin;
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) {
      console.log('isLoggedIn: pas de token');
      return false;
    }
    
    const payload = this.decodeToken(token);
    if (!payload) return false;
    
    const exp = payload.exp * 1000;
    const isExpired = Date.now() >= exp;
    const isValid = !isExpired && this.isAdmin();
    
    console.log('isLoggedIn:', isValid, 'expiré:', isExpired);
    return isValid;
  }

  logout() {
    this.clearToken();
    this.router.navigate(['/login']);
  }
}