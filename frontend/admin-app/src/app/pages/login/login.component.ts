// login.component.ts - Ajout de rememberMe
import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],  
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  rememberMe = false;
  errorMessage = '';
  loading = false;

  currentSlide = 0;
  private slideInterval: any;
  
  slides = [
    {
      title: 'Connect with every application',
      description: 'Everything you need in an easily customizable dashboard.',
      icon: 'fas fa-plug'
    },
    {
      title: 'Real-time Analytics',
      description: 'Monitor your performance with live data and instant insights.',
      icon: 'fas fa-chart-line'
    },
    {
      title: 'Smart Automation',
      description: 'Let AI handle repetitive tasks and focus on what matters.',
      icon: 'fas fa-robot'
    },
    {
      title: 'Customizable Dashboard',
      description: 'Tailor your workspace to fit your unique business needs.',
      icon: 'fas fa-tachometer-alt'
    }
  ];

  ngOnInit() {
    this.startCarousel();
    // Charger l'email sauvegardé si "Se souvenir de moi" était coché
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      this.email = savedEmail;
      this.rememberMe = true;
    }
  }

  ngOnDestroy() {
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
    }
  }

  startCarousel() {
    this.slideInterval = setInterval(() => {
      this.nextSlide();
    }, 5000);
  }

  nextSlide() {
    this.currentSlide = (this.currentSlide + 1) % this.slides.length;
  }

  goToSlide(index: number) {
    this.currentSlide = index;
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
      this.startCarousel();
    }
  }

  onSubmit() {
    this.loading = true;
    this.errorMessage = '';

    // Gérer "Se souvenir de moi"
    if (this.rememberMe) {
      localStorage.setItem('rememberedEmail', this.email);
    } else {
      localStorage.removeItem('rememberedEmail');
    }

    this.authService.login(this.email, this.password).subscribe({
      next: (response) => {
        this.authService.saveToken(response.token);
        
        if (this.authService.isAdmin()) {
          this.loading = false;
          this.router.navigate(['/dashboard']);
        } else {
          this.authService.logout();
          this.errorMessage = 'Accès réservé aux administrateurs';
          this.loading = false;
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = 'Email ou mot de passe incorrect';
        console.error('Erreur de connexion:', err);
      }
    });
  }
}