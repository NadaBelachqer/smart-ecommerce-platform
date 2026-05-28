import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductService, ProductRequest } from '../../../services/product.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.css']
})
export class ProductFormComponent implements OnInit {
  private productService = inject(ProductService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  selectedImage: File | null = null;
  imagePreview: string | null = null;
  isEditMode = false;
  productId: number | null = null;
  selectedCsvFile: File | null = null;

  loadingPage = false;
  loadingSubmit = false;
  loadingCsv = false;

  errorMessage = '';
  successMessage = '';

  product: ProductRequest = {
    sku: '',
    name: '',
    category: '',
    description: '',
    sellingPrice: 0,
    cost: 0,
    expirationDate: '',  // ← NOUVEAU
    imageUrl: ''
  };

  // Pour l'affichage de la date dans le formulaire
  expirationDateValue: string = '';

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.isEditMode = true;
      this.productId = Number(id);
      this.loadProduct();
    }
  }

  loadProduct() {
    if (!this.productId || isNaN(this.productId)) {
      this.errorMessage = 'ID invalide';
      return;
    }

    this.loadingPage = true;
    this.errorMessage = '';

    this.productService.getProductById(this.productId)
      .subscribe({
        next: (data) => {
          this.product = {
            ...data,
            cost: data.cost || 0,
            expirationDate: data.expirationDate || ''
          };
          this.expirationDateValue = this.product.expirationDate || '';
          this.loadingPage = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);
          this.errorMessage = 'Erreur chargement produit';
          this.loadingPage = false;
          this.cdr.detectChanges();
        }
      });
  }

  onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedImage = input.files[0];
      this.successMessage = '';
      this.errorMessage = '';
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(this.selectedImage);
    }
  }

  onExpirationDateChange(value: string) {
    this.product.expirationDate = value;
  }

  isExpired(expirationDate: string): boolean {
    if (!expirationDate) return false;
    const today = new Date();
    const expDate = new Date(expirationDate);
    return expDate < today;
  }

  getDaysUntilExpiration(expirationDate: string): number | null {
    if (!expirationDate) return null;
    const today = new Date();
    const expDate = new Date(expirationDate);
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  onCsvSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedCsvFile = input.files[0];
      this.successMessage = '';
      this.errorMessage = '';
      input.value = '';
    }
  }

  importCsv() {
    if (!this.selectedCsvFile) {
      this.errorMessage = 'Veuillez sélectionner un fichier CSV';
      return;
    }

    this.loadingCsv = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.productService.importProductsCsv(this.selectedCsvFile)
      .pipe(finalize(() => {
        this.loadingCsv = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (message) => {
          this.successMessage = message || 'Import CSV réussi !';
          this.selectedCsvFile = null;
          const fileInput = document.getElementById('csvFileInput') as HTMLInputElement;
          if (fileInput) fileInput.value = '';
          setTimeout(() => {
            this.router.navigate(['/products']);
          }, 1500);
        },
        error: (err) => {
          console.error(err);
          this.errorMessage = err.error?.message || 'Erreur lors de l\'import CSV';
        }
      });
  }

  removeSelectedImage() {
    this.imagePreview = null;
    this.selectedImage = null;
    const imageInput = document.getElementById('imageFileInput') as HTMLInputElement;
    if (imageInput) {
      imageInput.value = '';
    }
  }

  onSubmit() {
    this.loadingSubmit = true;
    this.errorMessage = '';
    this.successMessage = '';

    const action$ = this.isEditMode
      ? this.productService.updateProduct(
          this.productId!,
          this.product,
          this.selectedImage || undefined
        )
      : this.productService.createProduct(
          this.product,
          this.selectedImage || undefined
        );

    action$
      .pipe(finalize(() => {
        this.loadingSubmit = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: () => {
          this.successMessage = 'Produit enregistré avec succès';
          this.router.navigate(['/products']);
        },
        error: (err) => {
          console.error(err);
          this.errorMessage = 'Erreur lors de la sauvegarde';
        }
      });
  }
  getMarginPercent(): number {
  if (!this.product.sellingPrice || !this.product.cost) return 0;
  return ((this.product.sellingPrice - this.product.cost) / this.product.sellingPrice) * 100;
}
}