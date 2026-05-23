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
  loading = false;

  onSubmit() {
    this.loading = true;
    this.errorMessage = '';

    this.authService.register(this.user).subscribe({
      next: (response) => {
        this.authService.saveToken(response.token);
        this.loading = false;
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Erreur lors de l\'inscription';
      }
    });
  }
}