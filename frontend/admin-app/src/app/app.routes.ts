import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { AdminGuard } from './guards/admin.guard';
import { ProductListComponent } from './pages/products/productList/product-list.component';
import { ProductFormComponent } from './pages/products/productForm/product-form.component';
import { MainLayoutComponent } from './layouts/main-layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { OrderListComponent } from './pages/orders/order-list/order-list.component';
import { OrderDetailComponent } from './pages/orders/order-detail/order-detail.component';
import { ForecastListComponent } from './pages/forecast/forecast-list/forecast-list.component';
import { InventoryListComponent } from './pages/inventory/inventory-list/inventory-list.component';

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
      { path: 'orders', component: OrderListComponent },
      { path: 'orders/:id', component: OrderDetailComponent },
      { path: 'forecast', component: ForecastListComponent },
      { path: 'inventory', component: InventoryListComponent },
      { path: '', redirectTo: '/dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: '/login' }
];