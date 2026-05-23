import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';
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
  
  adminName = '';
  adminEmail = '';
  currentDate = new Date();
  pageTitle = 'Tableau de bord';

  ngOnInit() {
    this.adminEmail = this.authService.getUserEmail() || '';
    this.adminName = this.adminEmail.split('@')[0];
    
    this.router.events.subscribe(() => {
      const currentUrl = this.router.url;
      if (currentUrl.includes('/dashboard')) {
        this.pageTitle = 'Tableau de bord';
      } else if (currentUrl.includes('/products')) {
        this.pageTitle = 'Gestion des produits';
      } else if (currentUrl.includes('/inventory')) {
        this.pageTitle = 'Gestion de l\'inventaire';
      } else if (currentUrl.includes('/forecast')) {
        this.pageTitle = 'Prédiction de demande';
      } else {
        this.pageTitle = 'Administration';
      }
    });
  }

  logout() {
    this.authService.logout();
  }

  comingSoon() {
    alert('Cette fonctionnalité sera bientôt disponible !');
  }
}