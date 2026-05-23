import { Component, inject } from '@angular/core';
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
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  errorMessage = '';
  loading = false;

  onSubmit() {
    console.log('Tentative de connexion avec:', this.email);
    this.loading = true;
    this.errorMessage = '';

    this.authService.login(this.email, this.password).subscribe({
      next: (response) => {
        console.log('Connexion réussie:', response);
        this.authService.saveToken(response.token);
        this.loading = false;
        this.router.navigate(['/']);
      },
      error: (err) => {
        console.error('Erreur de connexion:', err);
        this.loading = false;
        this.errorMessage = 'Email ou mot de passe incorrect';
      }
    });
  }
}