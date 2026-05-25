// register.component.ts - Version complète avec carrousel
import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);

  user = {
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    address: '',
    phone: ''
  };
  errorMessage = '';
  successMessage = '';
  loading = false;

  // Propriétés du carrousel
  currentSlide = 0;
  private slideInterval: any;
  
  slides = [
    {
      title: 'Plateforme E-commerce',
      description: 'Gérez votre boutique en ligne avec des outils puissants et intuitifs.',
      icon: 'fas fa-store'
    },
    {
      title: 'Analyses Avancées',
      description: 'Suivez vos performances et optimisez vos ventes avec des données en temps réel.',
      icon: 'fas fa-chart-line'
    },
    {
      title: 'Pricing Intelligent',
      description: 'Optimisez automatiquement vos prix grâce à notre IA.',
      icon: 'fas fa-tags'
    },
    {
      title: 'Support 24/7',
      description: 'Une équipe dédiée pour vous accompagner dans votre succès.',
      icon: 'fas fa-headset'
    }
  ];

  ngOnInit() {
    this.startCarousel();
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
    this.successMessage = '';

    console.log('Création compte admin:', this.user.email);

    this.authService.registerAdmin(this.user).subscribe({
      next: (response) => {
        console.log('Compte admin créé:', response);
        this.successMessage = '✓ Compte administrateur créé avec succès ! Redirection...';
        
        this.authService.saveToken(response.token);
        
        setTimeout(() => {
          this.loading = false;
          this.router.navigate(['/dashboard']);
        }, 1500);
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.loading = false;
        
        if (err.status === 0) {
          this.errorMessage = 'Impossible de contacter le serveur. Vérifiez que l\'API Gateway est démarrée (port 8080).';
        } else if (err.error?.message) {
          this.errorMessage = err.error.message;
        } else {
          this.errorMessage = '❌ Erreur lors de la création du compte admin.';
        }
      }
    });
  }
}