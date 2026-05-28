import { Component, OnInit, inject, ChangeDetectorRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, timeout, finalize } from 'rxjs/operators';
import { InventoryService, InventoryResponseDTO, Movement, Alert } from '../../../services/inventory.service';
import { ProductService, Product, PageResponse } from '../../../services/product.service';

@Component({
  selector: 'app-inventory-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventory-list.component.html',
  styleUrls: ['./inventory-list.component.css']
})
export class InventoryListComponent implements OnInit, AfterViewChecked {
  private inventoryService = inject(InventoryService);
  private productService = inject(ProductService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  inventories: Product[] = [];
  filteredInventories: Product[] = [];
  searchQuery: string = '';
  selectedProductId: number | null = null;
  selectedInventory: InventoryResponseDTO | null = null;
  selectedAlerts: Alert[] = [];
  movements: Movement[] = [];
  isLoadingInventories = false;
  isLoadingDetails = false;
  updateQuantity: number = 0;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  showLowStockOnly = false;

  // Forcer la détection de changement après chaque vérification
  ngAfterViewChecked() {
    this.cdr.detectChanges();
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['filter'] === 'low') {
        this.showLowStockOnly = true;
      }
      this.loadInventories();
    });
  }

  loadInventories(): void {
    this.isLoadingInventories = true;
    this.errorMessage = null;
    this.cdr.detectChanges(); // Force detection

    this.productService.getProducts(0, 100).pipe(
      timeout(10000),
      finalize(() => {
        this.isLoadingInventories = false;
        this.cdr.detectChanges(); // Force detection after completion
      })
    ).subscribe({
      next: (response: PageResponse<Product>) => {
        this.inventories = response.content;
        this.filteredInventories = [...response.content]; // Force new array reference
        
        if (this.showLowStockOnly) {
          this.loadLowStockFilter(response.content);
        } else {
          this.cdr.detectChanges(); // Force update
        }
      },
      error: (err) => {
        const isTimeout = err?.name === 'TimeoutError';
        this.errorMessage = isTimeout
          ? 'Délai dépassé — vérifiez que Docker Desktop est lancé et que tous les services sont démarrés (docker-compose up).'
          : 'Impossible de joindre le backend (localhost:8080). Vérifiez que docker-compose up est lancé.';
        this.isLoadingInventories = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadLowStockFilter(products: Product[]): void {
    const requests = products.map(p =>
      this.inventoryService.getInventory(p.id).pipe(
        catchError(() => of(null)),
        finalize(() => this.cdr.detectChanges())
      )
    );
    
    forkJoin(requests).subscribe(inventories => {
      this.filteredInventories = products.filter((p, i) => {
        const inv = inventories[i];
        return inv && inv.stockLevel <= inv.reorderThreshold;
      });
      this.cdr.detectChanges(); // Force detection after filter
    });
  }

  onSearch(): void {
    const query = this.searchQuery.trim().toLowerCase();
    if (!query) {
      this.filteredInventories = [...this.inventories]; // New array reference
    } else {
      this.filteredInventories = this.inventories.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.sku.toLowerCase().includes(query) ||
        (p.category && p.category.toLowerCase().includes(query))
      );
    }
    this.cdr.detectChanges(); // Force update after search
  }

  selectProduct(productId: number): void {
    this.selectedProductId = productId;
    this.loadInventoryDetails(productId);
    this.cdr.detectChanges();
  }

  loadInventoryDetails(productId: number): void {
    this.isLoadingDetails = true;
    this.errorMessage = null;
    this.selectedInventory = null;
    this.movements = [];
    this.selectedAlerts = [];
    this.cdr.detectChanges();

    forkJoin({
      inventory: this.inventoryService.getInventory(productId).pipe(
        timeout(8000),
        catchError(() => of(null)),
        finalize(() => this.cdr.detectChanges())
      ),
      movements: this.inventoryService.getMovements(productId).pipe(
        timeout(8000),
        catchError(() => of([])),
        finalize(() => this.cdr.detectChanges())
      ),
      alerts: this.inventoryService.getAlerts(productId).pipe(
        timeout(8000),
        catchError(() => of([])),
        finalize(() => this.cdr.detectChanges())
      )
    }).pipe(
      finalize(() => {
        this.isLoadingDetails = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: ({ inventory, movements, alerts }) => {
        if (inventory === null) {
          this.errorMessage = 'Produit non trouvé dans l\'inventaire';
          this.selectedInventory = null;
        } else {
          this.selectedInventory = inventory;
        }
        
        this.movements = Array.isArray(movements) && movements.length > 0
          ? [...movements].sort((a, b) => {
              const tA = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
              const tB = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
              return tB - tA;
            })
          : [];
          
        this.selectedAlerts = Array.isArray(alerts) ? [...alerts] : [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading details:', err);
        this.errorMessage = 'Erreur lors du chargement des détails';
        this.isLoadingDetails = false;
        this.cdr.detectChanges();
      }
    });
  }

  updateStock(): void {
    if (!this.selectedProductId || this.updateQuantity <= 0) {
      this.errorMessage = 'Quantité invalide';
      this.cdr.detectChanges();
      return;
    }
    
    this.inventoryService.updateStock(this.selectedProductId, this.updateQuantity).pipe(
      finalize(() => this.cdr.detectChanges())
    ).subscribe({
      next: (updated: InventoryResponseDTO) => {
        this.selectedInventory = updated;
        this.successMessage = `Stock mis à jour avec succès (+${this.updateQuantity})`;
        this.updateQuantity = 0;
        this.loadMovements(this.selectedProductId!);
        setTimeout(() => {
          this.successMessage = null;
          this.cdr.detectChanges();
        }, 3000);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Update error:', err);
        this.errorMessage = 'Erreur lors de la mise à jour du stock';
        this.cdr.detectChanges();
      }
    });
  }

  reserveStock(): void {
    if (!this.selectedProductId || this.updateQuantity <= 0) {
      this.errorMessage = 'Quantité invalide';
      this.cdr.detectChanges();
      return;
    }
    
    this.inventoryService.reserveStock(this.selectedProductId, this.updateQuantity).pipe(
      finalize(() => this.cdr.detectChanges())
    ).subscribe({
      next: (updated: InventoryResponseDTO) => {
        this.selectedInventory = updated;
        this.successMessage = `Stock réservé avec succès (${this.updateQuantity} unités)`;
        this.updateQuantity = 0;
        this.loadMovements(this.selectedProductId!);
        setTimeout(() => {
          this.successMessage = null;
          this.cdr.detectChanges();
        }, 3000);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Reserve error:', err);
        this.errorMessage = 'Erreur lors de la réservation du stock';
        this.cdr.detectChanges();
      }
    });
  }

  loadMovements(productId: number): void {
    this.inventoryService.getMovements(productId).pipe(
      finalize(() => this.cdr.detectChanges())
    ).subscribe({
      next: (movements: Movement[]) => {
        this.movements = Array.isArray(movements) && movements.length > 0
          ? [...movements].sort((a: Movement, b: Movement) => {
              const timeA = a && a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const timeB = b && b.createdAt ? new Date(b.createdAt).getTime() : 0;
              return isNaN(timeA) || isNaN(timeB) ? 0 : timeB - timeA;
            })
          : [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading movements:', err);
        this.movements = [];
        this.cdr.detectChanges();
      }
    });
  }

  // Helper methods
  getAvailableStock(inventory: InventoryResponseDTO): number {
    return inventory.stockLevel - inventory.reservedStock;
  }

  getStockPercent(inventory: InventoryResponseDTO): number {
    if (inventory.reorderThreshold === 0) return 100;
    const pct = (inventory.stockLevel / (inventory.reorderThreshold * 3)) * 100;
    return Math.min(Math.max(pct, 0), 100);
  }

  getStockStatus(inventory: InventoryResponseDTO): string {
    if (inventory.stockLevel <= inventory.reorderThreshold) return 'Stock critique';
    if (inventory.stockLevel <= inventory.reorderThreshold * 2) return 'Stock faible';
    return 'Stock optimal';
  }

  getStockIcon(inventory: InventoryResponseDTO): string {
    if (inventory.stockLevel <= inventory.reorderThreshold) return 'fas fa-exclamation-triangle';
    if (inventory.stockLevel <= inventory.reorderThreshold * 2) return 'fas fa-chart-line';
    return 'fas fa-check-circle';
  }

  getStockStatusClass(inventory: InventoryResponseDTO): string {
    if (inventory.stockLevel <= inventory.reorderThreshold) return 'status-critical';
    if (inventory.stockLevel <= inventory.reorderThreshold * 2) return 'status-low';
    return 'status-ok';
  }

  getAlertStatusClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'RESOLVED': return 'alert-resolved';
      case 'PENDING': return 'alert-pending';
      case 'ACTIVE': return 'alert-active';
      default: return 'alert-active';
    }
  }

  getMovementTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'IN': 'Entrée',
      'OUT': 'Sortie',
      'RESERVE': 'Réservation'
    };
    return labels[type] || type;
  }

  getMovementIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'IN': 'fas fa-arrow-down',
      'OUT': 'fas fa-arrow-up',
      'RESERVE': 'fas fa-lock'
    };
    return icons[type] || 'fas fa-exchange-alt';
  }

  formatDate(date: string): string {
    if (!date) return 'Non spécifiée';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Non spécifiée';
    return d.toLocaleDateString('fr-FR', {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit'
    });
  }
}