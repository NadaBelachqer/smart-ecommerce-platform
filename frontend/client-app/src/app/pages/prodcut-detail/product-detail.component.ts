import { Component, inject, OnInit,ChangeDetectorRef  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ProductService, Product } from '../../services/product.service';
@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css']
})
export class ProductDetailComponent implements OnInit {

  private productService = inject(ProductService);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  product: Product | null = null;
  loading = true;
  errorMessage = '';

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.loadProduct(Number(id));
    } else {
      this.loading = false;
      this.errorMessage = 'ID invalide';

      this.cdr.detectChanges(); 
    }
  }

  
  loadProduct(id: number) {
    this.loading = true;
    this.errorMessage = '';

    this.productService.getProductById(id)
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.detectChanges(); 
      }))
      .subscribe({
        next: (data) => {
          this.product = data;
          this.cdr.detectChanges(); 
        },
        error: () => {
          this.product = null;
          this.errorMessage = 'Produit non trouvé';
          this.cdr.detectChanges(); 
        }
      });
  }

  
  getImageUrl(): string {
    if (!this.product?.imageUrl) {
      return 'https://via.placeholder.com/400?text=No+Image';
    }

    if (this.product.imageUrl.startsWith('http')) {
      return this.product.imageUrl;
    }

    if (this.product.imageUrl.startsWith('/uploads/')) {
      return `http://localhost:8080${this.product.imageUrl}`;
    }

    return 'https://via.placeholder.com/400?text=No+Image';
  }

  quantity: number = 1;

  addToCart(product: Product) {
    // 1. Récupérer le panier actuel depuis le localStorage
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    // 2. Vérifier si le produit est déjà dans le panier
    const existingItem = cart.find((item: any) => item.product.id === product.id);
    if (existingItem) {
      // 3. Si oui, augmenter la quantité
      existingItem.quantity += this.quantity;
    } else {
      // 4. Sinon, ajouter le produit avec la quantité
      cart.push({ product, quantity: this.quantity });
    }
    // 5. Enregistrer le panier mis à jour dans le localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
    alert(`${product.name} ajouté au panier !`);
  }

  
}