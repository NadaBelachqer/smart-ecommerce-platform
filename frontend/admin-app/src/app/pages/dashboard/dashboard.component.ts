// dashboard.component.ts
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { OrderService, Order } from '../../services/order.service';
import { InventoryService, InventoryResponseDTO } from '../../services/inventory.service';
import { ProductService, Product } from '../../services/product.service';
import { forkJoin, catchError, of } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  private orderService = inject(OrderService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  private inventoryService = inject(InventoryService);
  private productService = inject(ProductService);

  // Commandes
  orders: Order[] = [];
  loading = false;
  lastUpdated?: string;
  
  // Stocks & Alertes
  lowStockProducts: { product: Product, stockLevel: number }[] = [];
  
  // KPIs
  revenue = 0;
  orderVolume = 0;
  newCustomers = 0;
  stockAlerts = 0;
  averageOrderValue = 0;
  
  // Données pour graphiques (dynamiques)
  weeklyRevenueData: number[] = [0, 0, 0, 0, 0, 0, 0];
  weeklyOrdersData: number[] = [0, 0, 0, 0, 0, 0, 0];
  monthlyRevenueData: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  topProducts: { name: string, revenue: number, quantity: number }[] = [];
  categoryDistribution: { category: string, revenue: number, percentage: number }[] = [];
  stockDistribution: { label: string, count: number, color: string }[] = [];
  
  // Configuration des graphiques
  maxRevenue = 0;
  maxOrders = 0;

  constructor() {
    // Liaison des méthodes pour le template
    this.getBarHeight = this.getBarHeight.bind(this);
    this.getOrderBarHeight = this.getOrderBarHeight.bind(this);
    this.getDonutDashArray = this.getDonutDashArray.bind(this);
    this.getDonutDashOffset = this.getDonutDashOffset.bind(this);
    this.getTotalStockCount = this.getTotalStockCount.bind(this);
    this.getMaxMonthlyRevenue = this.getMaxMonthlyRevenue.bind(this);
    this.getMonthName = this.getMonthName.bind(this);
  }

  ngOnInit() {
    this.loadAllData();
  }

 
  loadAllData() {
    this.loading = true;
    
    forkJoin({
      orders: this.orderService.getAllOrders().pipe(catchError(() => of([]))),
      products: this.productService.getProducts(0, 100).pipe(catchError(() => of({ content: [] }))),
    }).subscribe({
      next: (result) => {
        this.orders = result.orders;
        const products = result.products.content || result.products || [];
        
        // Traiter toutes les données
        this.processOrdersData();
        this.processTopProducts();
        this.processCategoryDistribution();
        this.loadStockData(products);
        this.calculateKPIs();
        
        this.loading = false;
        this.lastUpdated = new Date().toLocaleString();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur chargement des données:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

 
  processOrdersData() {
    // Grouper par jour de la semaine (Lundi = 0, Dimanche = 6)
    const dailyRevenue = [0, 0, 0, 0, 0, 0, 0];
    const dailyOrders = [0, 0, 0, 0, 0, 0, 0];
    
    const monthlyRevenue = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    
    this.orders.forEach(order => {
      if (order.status === 'CONFIRMED' && order.createdAt) {
        const date = new Date(order.createdAt);
        let dayIndex = date.getDay(); // 0 = Dimanche, 1 = Lundi
        dayIndex = dayIndex === 0 ? 6 : dayIndex - 1;
        
        dailyRevenue[dayIndex] += order.totalAmount || 0;
        dailyOrders[dayIndex] += 1;
        
        const monthIndex = date.getMonth();
        monthlyRevenue[monthIndex] += order.totalAmount || 0;
      }
    });
    
    this.weeklyRevenueData = dailyRevenue;
    this.weeklyOrdersData = dailyOrders;
    this.monthlyRevenueData = monthlyRevenue;
    
    this.maxRevenue = Math.max(...this.weeklyRevenueData, 1);
    this.maxOrders = Math.max(...this.weeklyOrdersData, 1);
  }

  processTopProducts() {
    const productRevenue = new Map<number, { name: string, revenue: number, quantity: number }>();
    
    this.orders.forEach(order => {
      if (order.status === 'CONFIRMED' && order.items) {
        order.items.forEach(item => {
          const current = productRevenue.get(item.productId) || { 
            name: item.productName, 
            revenue: 0, 
            quantity: 0 
          };
          current.revenue += (item.unitPrice * item.quantity);
          current.quantity += item.quantity;
          productRevenue.set(item.productId, current);
        });
      }
    });
    
    this.topProducts = Array.from(productRevenue.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }

  processCategoryDistribution() {
    const categoryRevenue = new Map<string, number>();
    let totalRevenue = 0;
    
    this.orders.forEach(order => {
      if (order.status === 'CONFIRMED' && order.items) {
        order.items.forEach(item => {
          const category = item.productName.split(' ')[0] || 'Autre';
          const amount = item.unitPrice * item.quantity;
          categoryRevenue.set(category, (categoryRevenue.get(category) || 0) + amount);
          totalRevenue += amount;
        });
      }
    });
    
    this.categoryDistribution = Array.from(categoryRevenue.entries())
      .map(([category, revenue]) => ({
        category,
        revenue,
        percentage: totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);
  }

  
  loadStockData(products: Product[]) {
    if (!products.length) return;
    
    const requests = products.map(product =>
      this.inventoryService.getInventory(product.id).pipe(catchError(() => of(null)))
    );
    
    forkJoin(requests).subscribe(inventories => {
      let optimal = 0;
      let moyen = 0;
      let bas = 0;
      let critique = 0;
      this.lowStockProducts = [];
      
      products.forEach((product, index) => {
        const inv = inventories[index] as InventoryResponseDTO | null;
        if (inv) {
          const stock = inv.stockLevel || 0;
          const threshold = inv.reorderThreshold || 20;
          
          if (stock > 100) optimal++;
          else if (stock > 50) moyen++;
          else if (stock > 20) bas++;
          else critique++;
          
          if (stock <= threshold) {
            this.lowStockProducts.push({ product, stockLevel: stock });
          }
        }
      });
      
      this.stockAlerts = this.lowStockProducts.length;
      this.stockDistribution = [
        { label: 'Stock optimal (>100)', count: optimal, color: '#10b981' },
        { label: 'Stock moyen (50-100)', count: moyen, color: '#f59e0b' },
        { label: 'Stock bas (20-49)', count: bas, color: '#ef4444' },
        { label: 'Rupture (<20)', count: critique, color: '#8b5cf6' }
      ];
      
      this.cdr.detectChanges();
    });
  }

  
  calculateKPIs() {
    const confirmedOrders = this.orders.filter(o => o.status === 'CONFIRMED');
    this.revenue = confirmedOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    this.orderVolume = this.orders.length;
    this.averageOrderValue = this.orderVolume > 0 ? this.revenue / this.orderVolume : 0;
    
    const uniqueCustomers = new Set(this.orders.map(o => o.userId).filter(id => id));
    this.newCustomers = uniqueCustomers.size;
  }

  
  refresh() {
    this.loadAllData();
  }

  
  navigate(path: string) {
    this.router.navigateByUrl(path);
  }

  
  getBarHeight(revenue: number): number {
    return this.maxRevenue > 0 ? (revenue / this.maxRevenue) * 100 : 0;
  }
  
  
  getOrderBarHeight(count: number): number {
    return this.maxOrders > 0 ? (count / this.maxOrders) * 100 : 0;
  }
  
  
  getMaxProductRevenue(): number {
    return this.topProducts.length > 0 ? Math.max(...this.topProducts.map(p => p.revenue)) : 1;
  }

  
  getDonutDashArray(segment: { count: number }, allSegments: { count: number }[]): string {
    const total = allSegments.reduce((sum, s) => sum + s.count, 0);
    if (total === 0) return '0 251.2';
    const circumference = 2 * Math.PI * 40; // r=40 => circonférence ≈ 251.2
    const dashLength = (segment.count / total) * circumference;
    return `${dashLength} ${circumference - dashLength}`;
  }

 
  getDonutDashOffset(segment: { count: number }, allSegments: { count: number }[], index: number): string {
    const total = allSegments.reduce((sum, s) => sum + s.count, 0);
    if (total === 0) return '0';
    const circumference = 2 * Math.PI * 40;
    let offset = 0;
    for (let i = 0; i < index; i++) {
      offset += (allSegments[i].count / total) * circumference;
    }
    return `${-offset}`;
  }

  
  getTotalStockCount(): number {
    return this.stockDistribution.reduce((sum, s) => sum + s.count, 0);
  }

  
  getMaxMonthlyRevenue(): number {
    return Math.max(...this.monthlyRevenueData, 1);
  }

  
  getMonthName(index: number): string {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    return months[index];
  }

  
  getCategoryPercentage(revenue: number): number {
    const total = this.categoryDistribution.reduce((sum, c) => sum + c.revenue, 0);
    return total > 0 ? (revenue / total) * 100 : 0;
  }

  
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(amount);
  }

  
  formatNumber(num: number): string {
    return new Intl.NumberFormat('fr-FR').format(num);
  }
}