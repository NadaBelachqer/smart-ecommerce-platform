import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { AdminGuard } from './guards/admin.guard';
import { ProductListComponent } from './pages/products/productList/product-list.component';
import { ProductFormComponent } from './pages/products/productForm/product-form.component';
import { MainLayoutComponent } from './layouts/main-layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { InventoryListComponent } from './pages/inventory/inventory-list/inventory-list.component';
import { ForecastListComponent } from './pages/forecast/forecast-list/forecast-list.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { 
    path: '',
    component: MainLayoutComponent,
    canActivate: [AdminGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'products', component: ProductListComponent },
      { path: 'products/new', component: ProductFormComponent },
      { path: 'products/:id/edit', component: ProductFormComponent },
      { path: 'inventory', component: InventoryListComponent },
      { path: 'forecast', component: ForecastListComponent },
      { path: '', redirectTo: '/dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: '/login' }
];