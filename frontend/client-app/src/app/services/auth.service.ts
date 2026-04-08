import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = 'http://localhost:8080/api/auth';

  // Connexion
  login(email: string, password: string) {
    return this.http.post<{ token: string }>(`${this.apiUrl}/login`, { email, password });
  }

  // Inscription
  register(user: any) {
    return this.http.post<{ token: string }>(`${this.apiUrl}/register`, user);
  }

  // Sauvegarder token
  saveToken(token: string) {
    localStorage.setItem('token', token);
  }

  // Récupérer token
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Lire le rôle dans le token
  getUserRole(): string | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      // Enlever "ROLE_" si présent
      const role = payload.role?.replace('ROLE_', '');
      return role || null;
    } catch {
      return null;
    }
  }

  // Récupérer l'email depuis le token
getUserEmail(): string | null {
  const token = this.getToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sub || null;
  } catch {
    return null;
  }
}

  // Vérifier si connecté
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  // Vérifier si admin
  isAdmin(): boolean {
    return this.getUserRole() === 'ADMIN';
  }

  // Déconnexion
  logout() {
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }
}