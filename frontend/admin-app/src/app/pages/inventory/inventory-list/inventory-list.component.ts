import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { InventoryService, InventoryResponseDTO, Movement, Alert } from '../../../services/inventory.service';
import { ProductService, Product, PageResponse } from '../../../services/product.service';

@Component({
  selector: 'app-inventory-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventory-list.component.html',
  styleUrls: ['./inventory-list.component.css']
})
export class InventoryListComponent implements OnInit {
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
    this.productService.getProducts(0, 100).pipe(
      timeout(8000)
    ).subscribe({
      next: (response: PageResponse<Product>) => {
        this.inventories = response.content;
        if (this.showLowStockOnly) {
          this.loadLowStockFilter(response.content);
        } else {
          this.filteredInventories = response.content;
          this.isLoadingInventories = false;
        }
      },
      error: (err) => {
        const isTimeout = err?.name === 'TimeoutError';
        this.errorMessage = isTimeout
          ? 'Délai dépassé — vérifiez que Docker Desktop est lancé et que tous les services sont démarrés (docker-compose up).'
          : 'Impossible de joindre le backend (localhost:8080). Vérifiez que docker-compose up est lancé.';
        this.isLoadingInventories = false;
      }
    });
  }

  loadLowStockFilter(products: Product[]): void {
    const requests = products.map(p =>
      this.inventoryService.getInventory(p.id).pipe(catchError(() => of(null)))
    );
    forkJoin(requests).subscribe(inventories => {
      this.filteredInventories = products.filter((p, i) => {
        const inv = inventories[i];
        return inv && inv.stockLevel <= inv.reorderThreshold;
      });
      this.isLoadingInventories = false;
      this.cdr.detectChanges();
    });
  }

  onSearch(): void {
    const query = this.searchQuery.trim().toLowerCase();
    if (!query) {
      this.filteredInventories = this.inventories;
    } else {
      this.filteredInventories = this.inventories.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.sku.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
      );
    }
  }

  selectProduct(productId: number): void {
    this.selectedProductId = productId;
    this.loadInventoryDetails(productId);
  }

  loadInventoryDetails(productId: number): void {
    this.isLoadingDetails = true;
    this.errorMessage = null;

    forkJoin({
      inventory: this.inventoryService.getInventory(productId).pipe(catchError(() => of(null))),
      movements: this.inventoryService.getMovements(productId).pipe(catchError(() => of([]))),
      alerts: this.inventoryService.getAlerts(productId).pipe(catchError(() => of([])))
    }).subscribe({
      next: ({ inventory, movements, alerts }) => {
        if (inventory === null) {
          this.errorMessage = 'Produit non trouvé dans l\'inventaire';
          this.selectedInventory = null;
        } else {
          this.selectedInventory = inventory;
        }
        this.movements = Array.isArray(movements)
          ? (movements as Movement[]).sort((a, b) => {
              const tA = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
              const tB = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
              return tB - tA;
            })
          : [];
        this.selectedAlerts = Array.isArray(alerts) ? (alerts as Alert[]) : [];
        this.isLoadingDetails = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Erreur lors du chargement des détails';
        this.isLoadingDetails = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadMovements(productId: number): void {
    this.inventoryService.getMovements(productId).subscribe({
      next: (movements: Movement[]) => {
        try {
          this.movements = Array.isArray(movements)
            ? movements.sort((a: Movement, b: Movement) => {
                const timeA = a && a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const timeB = b && b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return isNaN(timeA) || isNaN(timeB) ? 0 : timeB - timeA;
              })
            : [];
        } catch (err) {
          console.error('Error sorting movements:', err);
          this.movements = [];
        }
      },
      error: () => {
        this.movements = [];
      }
    });
  }

  updateStock(): void {
    if (!this.selectedProductId || this.updateQuantity <= 0) {
      this.errorMessage = 'Quantité invalide';
      return;
    }
    this.inventoryService.updateStock(this.selectedProductId, this.updateQuantity).subscribe({
      next: (updated: InventoryResponseDTO) => {
        this.selectedInventory = updated;
        this.successMessage = `Stock mis à jour avec succès (+${this.updateQuantity})`;
        this.updateQuantity = 0;
        this.loadMovements(this.selectedProductId!);
        setTimeout(() => this.successMessage = null, 3000);
      },
      error: () => {
        this.errorMessage = 'Erreur lors de la mise à jour du stock';
      }
    });
  }

  reserveStock(): void {
    if (!this.selectedProductId || this.updateQuantity <= 0) {
      this.errorMessage = 'Quantité invalide';
      return;
    }
    this.inventoryService.reserveStock(this.selectedProductId, this.updateQuantity).subscribe({
      next: (updated: InventoryResponseDTO) => {
        this.selectedInventory = updated;
        this.successMessage = `Stock réservé avec succès (${this.updateQuantity} unités)`;
        this.updateQuantity = 0;
        this.loadMovements(this.selectedProductId!);
        setTimeout(() => this.successMessage = null, 3000);
      },
      error: () => {
        this.errorMessage = 'Erreur lors de la réservation du stock';
      }
    });
  }

  getAvailableStock(inventory: InventoryResponseDTO): number {
    return inventory.stockLevel - inventory.reservedStock;
  }

  getStockPercent(inventory: InventoryResponseDTO): number {
    if (inventory.reorderThreshold === 0) return 100;
    const pct = (inventory.stockLevel / (inventory.reorderThreshold * 3)) * 100;
    return Math.min(pct, 100);
  }

  getStockStatus(inventory: InventoryResponseDTO): string {
    if (inventory.stockLevel <= inventory.reorderThreshold) return 'Faible stock';
    return 'Stock OK';
  }

  getStockStatusClass(inventory: InventoryResponseDTO): string {
    return inventory.stockLevel <= inventory.reorderThreshold ? 'status-low' : 'status-ok';
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

  formatDate(date: string): string {
    if (!date) return 'Non spécifiée';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Non spécifiée';
    return d.toLocaleDateString('fr-FR', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }
}
