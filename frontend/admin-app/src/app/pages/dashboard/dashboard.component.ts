import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  
  adminName = '';
  adminEmail = '';
  currentDate = new Date();

  ngOnInit() {
    this.adminEmail = this.authService.getUserEmail() || '';
    this.adminName = this.adminEmail.split('@')[0];
  }

  logout() {
    this.authService.logout();
  }
}