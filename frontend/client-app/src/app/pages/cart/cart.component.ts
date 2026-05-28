import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { OrderItemRequest, OrderRequest, OrderService } from '../../services/order.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent {
  cartService = inject(CartService);
  authService = inject(AuthService);
  private orderService = inject(OrderService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  shippingAddress = '';
  paymentMethod = 'CARD';
  loading = false;
  errorMessage = '';
  successMessage = '';
  stockErrorProductId: number | null = null;

  getImageUrl(imageUrl: string): string {
    if (!imageUrl) return 'https://placehold.co/80x80?text=No+Image';
    if (imageUrl.startsWith('http')) return imageUrl;
    if (imageUrl.startsWith('/uploads/')) return `http://localhost:8080${imageUrl}`;
    return 'https://placehold.co/80x80?text=No+Image';
  }

  placeOrder() {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    if (this.cartService.cartItems().length === 0) {
      this.errorMessage = 'Votre panier est vide';
      return;
    }

    if (!this.shippingAddress.trim()) {
      this.errorMessage = 'Veuillez saisir une adresse de livraison';
      return;
    }

    const request = this.buildOrderRequest();
    if (request.items.length === 0) {
      this.errorMessage = 'Votre panier contient des produits invalides. Supprimez-les puis ajoutez-les de nouveau.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.stockErrorProductId = null;
    console.log('Order request sent to backend:', request);

    this.orderService.createOrder(request).subscribe({
      next: (res) => {
        this.loading = false;
        this.cartService.clear();
        this.successMessage = `Commande #${res.data.orderNumber} passee avec succes !`;
        setTimeout(() => this.router.navigate(['/orders']), 2000);
      },
      error: (err) => {
        this.loading = false;
        console.error('Order creation failed:', err);
        if (err.status === 401) {
          this.authService.logout();
          this.errorMessage = 'Session expiree. Veuillez vous reconnecter.';
          this.cdr.detectChanges();
          return;
        }
        this.errorMessage = this.formatOrderErrorMessage(this.extractErrorMessage(err, 'Erreur lors de la commande'));
        this.cdr.detectChanges();
      }
    });
  }

  isStockErrorItem(productId: number): boolean {
    return this.stockErrorProductId === Number(productId);
  }

  private buildOrderRequest(): OrderRequest {
    const items: OrderItemRequest[] = this.cartService.cartItems()
      .map(item => ({
        productId: Number(item.product?.id),
        quantity: Number(item.quantity)
      }))
      .filter(item =>
        Number.isInteger(item.productId) &&
        item.productId > 0 &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0
      );

    return {
      shippingAddress: this.shippingAddress,
      paymentMethod: this.paymentMethod,
      items
    };
  }

  private extractErrorMessage(err: any, fallback: string): string {
    if (typeof err.error === 'string') {
      try {
        const parsed = JSON.parse(err.error);
        return parsed?.message || err.error;
      } catch {
        return err.error;
      }
    }
    return err.error?.message || err.message || fallback;
  }

  private formatOrderErrorMessage(message: string): string {
    const stockError = message.match(
      /Insufficient stock for product (\d+)\. Available: (\d+), Requested: (\d+)/
    );

    if (!stockError) return message;

    const productId = Number(stockError[1]);
    this.stockErrorProductId = productId;
    const available = stockError[2];
    const requested = stockError[3];
    const productName = this.cartService.cartItems()
      .find(item => Number(item.product?.id) === productId)
      ?.product?.name;

    return `Stock insuffisant pour "${productName || `Produit #${productId}`}". Disponible: ${available}, demande: ${requested}.`;
  }
}
