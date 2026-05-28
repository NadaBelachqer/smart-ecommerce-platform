import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.css']
})
export class MainLayoutComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  
  isSidebarCollapsed = false;
  adminName = '';
  adminEmail = '';
  currentDate = new Date();
  pageTitle = 'Tableau de bord';

  ngOnInit() {
    this.adminEmail = this.authService.getUserEmail() || '';
    this.adminName = this.adminEmail.split('@')[0];
    
    // Récupérer l'état du sidebar
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState !== null) {
      this.isSidebarCollapsed = JSON.parse(savedState);
    }
    
    // Mettre à jour le titre selon la route
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        const currentUrl = event.url;
        if (currentUrl.includes('/dashboard')) {
          this.pageTitle = 'Tableau de bord';
        } else if (currentUrl.includes('/products')) {
          this.pageTitle = 'Catalogue Articles';
        } else if (currentUrl.includes('/orders')) {
          this.pageTitle = 'Commandes & Flux';
        } else if (currentUrl.includes('/inventory') || currentUrl.includes('/stock')) {
          this.pageTitle = 'Gestion de Stock';
        } else if (currentUrl.includes('/forecast')) {
          this.pageTitle = 'Prévisions de Vente';
        } else {
          this.pageTitle = 'Administration';
        }
      }
    });
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
    localStorage.setItem('sidebarCollapsed', JSON.stringify(this.isSidebarCollapsed));
  }

  logout(): void {
    this.authService.logout();
  }

  comingSoon(event?: Event): void {
    if (event) {
      event.preventDefault();
    }
    alert('✨ Cette fonctionnalité sera bientôt disponible ! ✨');
  }
}