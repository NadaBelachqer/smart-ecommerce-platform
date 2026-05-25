import { Injectable } from '@angular/core';
import { Product } from './product.service';

export interface CartItem {
  product: Product;
  quantity: number;
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartKey = 'shopping_cart';
  
  getItems(): CartItem[] {
    const cart = localStorage.getItem(this.cartKey);
    return cart ? JSON.parse(cart) : [];
  }
  
  addToCart(product: Product, quantity: number = 1) {
    const items = this.getItems();
    const existingItem = items.find(item => item.product.id === product.id);
    
    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.total = existingItem.product.sellingPrice * existingItem.quantity;
    } else {
      items.push({
        product: product,
        quantity: quantity,
        total: product.sellingPrice * quantity
      });
    }
    
    localStorage.setItem(this.cartKey, JSON.stringify(items));
  }
  
  updateQuantity(productId: number, quantity: number) {
    const items = this.getItems();
    const item = items.find(i => i.product.id === productId);
    if (item) {
      item.quantity = quantity;
      item.total = item.product.sellingPrice * quantity;
      localStorage.setItem(this.cartKey, JSON.stringify(items));
    }
  }
  
  removeFromCart(productId: number) {
    const items = this.getItems();
    const filtered = items.filter(item => item.product.id !== productId);
    localStorage.setItem(this.cartKey, JSON.stringify(filtered));
  }
  
  clearCart() {
    localStorage.removeItem(this.cartKey);
  }
  
  getTotal(): number {
    const items = this.getItems();
    return items.reduce((sum, item) => sum + item.total, 0);
  }
  
  getItemCount(): number {
    const items = this.getItems();
    return items.reduce((count, item) => count + item.quantity, 0);
  }
}