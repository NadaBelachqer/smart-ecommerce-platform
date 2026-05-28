import { Injectable, signal, computed } from '@angular/core';
import { Product } from './product.service';

export interface CartItem {
  product: Product;
  quantity: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly storageKey = 'cartItems';
  private items = signal<CartItem[]>(this.loadItems());

  cartItems = this.items.asReadonly();
  totalItems = computed(() => this.items().reduce((sum, i) => sum + i.quantity, 0));
  totalPrice = computed(() => this.items().reduce((sum, i) => sum + i.product.sellingPrice * i.quantity, 0));

  add(product: Product, quantity = 1) {
    const productId = Number(product.id);
    const itemQuantity = Number(quantity);
    if (!Number.isInteger(productId) || productId <= 0 || !Number.isInteger(itemQuantity) || itemQuantity <= 0) {
      return;
    }

    this.items.update(items => {
      const normalizedProduct = { ...product, id: productId };
      const existing = items.find(i => Number(i.product.id) === productId);
      if (existing) {
        return this.save(items.map(i => Number(i.product.id) === productId
          ? { ...i, product: normalizedProduct, quantity: i.quantity + itemQuantity }
          : i));
      }
      return this.save([...items, { product: normalizedProduct, quantity: itemQuantity }]);
    });
  }

  remove(productId: number) {
    const id = Number(productId);
    this.items.update(items => this.save(items.filter(i => Number(i.product.id) !== id)));
  }

  updateQuantity(productId: number, quantity: number) {
    const id = Number(productId);
    const nextQuantity = Number(quantity);
    if (nextQuantity <= 0) { this.remove(id); return; }
    if (!Number.isInteger(id) || id <= 0 || !Number.isInteger(nextQuantity)) return;
    this.items.update(items => this.save(items.map(i => Number(i.product.id) === id ? { ...i, quantity: nextQuantity } : i)));
  }

  clear() {
    this.items.set([]);
    localStorage.removeItem(this.storageKey);
  }

  private loadItems(): CartItem[] {
    try {
      const storedItems = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
      if (!Array.isArray(storedItems)) return [];
      const validItems = storedItems
        .map(item => ({
          product: { ...item.product, id: Number(item.product?.id) },
          quantity: Number(item.quantity)
        }))
        .filter(item =>
          Number.isInteger(item.product.id) &&
          item.product.id > 0 &&
          Number.isInteger(item.quantity) &&
          item.quantity > 0
        );
      localStorage.setItem(this.storageKey, JSON.stringify(validItems));
      return validItems;
    } catch {
      localStorage.removeItem(this.storageKey);
      return [];
    }
  }

  private save(items: CartItem[]): CartItem[] {
    localStorage.setItem(this.storageKey, JSON.stringify(items));
    return items;
  }
}
