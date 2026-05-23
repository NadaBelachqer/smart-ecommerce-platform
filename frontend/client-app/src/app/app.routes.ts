import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { HomeComponent } from './pages/home/home.component';
import { ProductDetailComponent } from './pages/prodcut-detail/product-detail.component';
import { AvailabilityComponent } from './pages/availability/availability.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'products/:id', component: ProductDetailComponent },
  { path: 'availability', component: AvailabilityComponent },
  { path: '**', redirectTo: '' }
];