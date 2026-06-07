import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs/operators';
import { PromotionBatchResponseDTO, PromotionService } from '../../../services/promotion.service';

@Component({
  selector: 'app-promotion-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './promotion-list.component.html',
  styleUrls: ['./promotion-list.component.css']
})
export class PromotionListComponent implements OnInit {
  private promotionService = inject(PromotionService);

  batches: PromotionBatchResponseDTO[] = [];
  selectedBatch: PromotionBatchResponseDTO | null = null;
  isLoading = false;
  isSuggesting = false;
  actionLoadingId: number | null = null;
  detailLoadingId: number | null = null;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  ngOnInit(): void {
    this.loadBatches();
  }

  loadBatches(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.promotionService.getBatches().pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (batches) => {
        this.batches = [...batches].sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        if (this.selectedBatch?.batchId) {
          const refreshedBatch = this.batches.find(batch => batch.batchId === this.selectedBatch?.batchId);
          if (refreshedBatch) {
            this.loadBatchDetails(refreshedBatch.batchId);
          } else {
            this.selectedBatch = null;
          }
        }
      },
      error: () => {
        this.errorMessage = 'Impossible de charger les batches. Verifiez que le promotion-service est demarre.';
      }
    });
  }

  suggestPromotions(): void {
    this.isSuggesting = true;
    this.errorMessage = null;

    this.promotionService.suggestPromotions().pipe(
      finalize(() => this.isSuggesting = false)
    ).subscribe({
      next: (batch) => {
        this.showSuccess(`Batch #${batch.batchId} cree avec ${batch.totalSuggestions} suggestions.`);
        this.loadBatches();
        this.loadBatchDetails(batch.batchId);
      },
      error: () => {
        this.errorMessage = 'Erreur lors de la generation des suggestions ML.';
      }
    });
  }

  selectBatch(batch: PromotionBatchResponseDTO): void {
    if (this.selectedBatch?.batchId === batch.batchId) {
      this.selectedBatch = null;
      return;
    }

    this.loadBatchDetails(batch.batchId);
  }

  loadBatchDetails(batchId: number): void {
    this.detailLoadingId = batchId;
    this.errorMessage = null;

    this.promotionService.getBatch(batchId).pipe(
      finalize(() => this.detailLoadingId = null)
    ).subscribe({
      next: (batch) => {
        this.selectedBatch = batch;
        this.batches = this.batches.map(item => item.batchId === batch.batchId ? batch : item);
      },
      error: () => {
        this.errorMessage = `Impossible de charger le detail du batch #${batchId}.`;
      }
    });
  }

  validate(batchId: number): void {
    this.actionLoadingId = batchId;
    this.errorMessage = null;

    this.promotionService.validateBatch(batchId).pipe(
      finalize(() => this.actionLoadingId = null)
    ).subscribe({
      next: (batch) => {
        this.selectedBatch = batch;
        this.showSuccess('Batch valide avec succes.');
        this.loadBatches();
      },
      error: () => {
        this.errorMessage = 'Erreur lors de la validation.';
      }
    });
  }

  cancel(batchId: number): void {
    if (!confirm('Annuler la validation de ce batch ? Les promotions repasSeront au statut REJECTED.')) return;
    this.actionLoadingId = batchId;
    this.errorMessage = null;

    this.promotionService.cancelBatch(batchId).pipe(
      finalize(() => this.actionLoadingId = null)
    ).subscribe({
      next: (batch) => {
        this.selectedBatch = batch;
        this.showSuccess('Validation annulee. Batch repasse en REJECTED.');
        this.loadBatches();
      },
      error: () => {
        this.errorMessage = "Erreur lors de l'annulation.";
      }
    });
  }

  reject(batchId: number): void {
    this.actionLoadingId = batchId;
    this.errorMessage = null;

    this.promotionService.rejectBatch(batchId).pipe(
      finalize(() => this.actionLoadingId = null)
    ).subscribe({
      next: (batch) => {
        this.selectedBatch = batch;
        this.showSuccess('Batch rejete.');
        this.loadBatches();
      },
      error: () => {
        this.errorMessage = 'Erreur lors du rejet.';
      }
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'VALIDATED':
        return 'status-validated';
      case 'REJECTED':
        return 'status-rejected';
      default:
        return 'status-pending';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'VALIDATED':
        return 'Valide';
      case 'REJECTED':
        return 'Rejete';
      default:
        return 'En attente';
    }
  }

  formatDate(date: string): string {
    if (!date) {
      return '-';
    }

    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private showSuccess(message: string): void {
    this.successMessage = message;
    setTimeout(() => this.successMessage = null, 3000);
  }
}
