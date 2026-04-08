import { Component, inject } from '@angular/core';
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
export class RegisterComponent {
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

  onSubmit() {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    console.log('Création compte admin:', this.user.email);

    // ✅ Utiliser registerAdmin au lieu de register
    this.authService.registerAdmin(this.user).subscribe({
      next: (response) => {
        console.log('Compte admin créé:', response);
        this.successMessage = '✅ Compte administrateur créé avec succès ! Redirection...';
        
        // Sauvegarder le token et rediriger
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
          this.errorMessage = '❌ Impossible de contacter le serveur. Vérifiez que l\'API Gateway est démarrée (port 8080).';
        } else if (err.error?.message) {
          this.errorMessage = err.error.message;
        } else {
          this.errorMessage = '❌ Erreur lors de la création du compte admin.';
        }
      }
    });
  }
}