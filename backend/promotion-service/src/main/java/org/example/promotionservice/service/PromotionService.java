package org.example.promotionservice.service;

import lombok.RequiredArgsConstructor;
import org.example.promotionservice.client.InventoryServiceClient;
import org.example.promotionservice.client.MlPromotionClient;
import org.example.promotionservice.client.ProductServiceClient;
import org.example.promotionservice.dto.*;
import org.example.promotionservice.entity.*;
import org.example.promotionservice.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PromotionService {

    private final PromotionRepository promotionRepository;
    private final PromotionBatchRepository batchRepository;
    private final MlPromotionClient mlPromotionClient;
    private final ProductServiceClient productServiceClient;
    private final InventoryServiceClient inventoryServiceClient;

    private static final int BATCH_SIZE = 5;
    private static final int ROTATION_DAYS = 7;

    @Transactional
    public PromotionBatchResponseDTO suggestPromotions() {
        // 1. Récupérer les vrais produits et leur inventaire en parallèle
        List<ProductDTO> allProducts = productServiceClient.getAllProducts();

        // 2. Exclure les produits promus dans les ROTATION_DAYS derniers jours
        LocalDateTime since = LocalDateTime.now().minusDays(ROTATION_DAYS);
        Set<Long> recentlyPromoted = new HashSet<>(
                promotionRepository.findRecentlyPromotedProductIds(since)
        );

        List<ProductDTO> candidates = allProducts.stream()
                .filter(p -> !recentlyPromoted.contains(p.getId()))
                .collect(Collectors.toList());

        if (candidates.isEmpty()) candidates = allProducts;

        // 3. Mélanger et sélectionner BATCH_SIZE produits
        Collections.shuffle(candidates);
        List<ProductDTO> selected = candidates.stream().limit(BATCH_SIZE).toList();

        // 4. Enrichir chaque produit avec ses données d'inventaire réelles
        List<ProductWithInventoryDTO> enriched = selected.stream().map(p -> {
            InventoryDTO inv = inventoryServiceClient.getInventoryByProductId(p.getId());
            return ProductWithInventoryDTO.builder()
                    .id(p.getId())
                    .name(p.getName())
                    .category(p.getCategory())
                    .sellingPrice(p.getSellingPrice())
                    .stockLevel(inv.getStockLevel())
                    .reorderThreshold(inv.getReorderThreshold())
                    .reservedStock(inv.getReservedStock())
                    .lowStock(inv.getLowStock())
                    .build();
        }).toList();

        // 5. Envoyer au ML et récupérer les suggestions
        List<PromotionSuggestionDTO> suggestions = mlPromotionClient.suggestPromotions(enriched);

        // 6. Sauvegarder batch + promotions
        PromotionBatch batch = batchRepository.save(
                PromotionBatch.builder().totalSuggestions(suggestions.size()).build()
        );

        List<Promotion> promotions = suggestions.stream().map(s -> Promotion.builder()
                .productId(s.getProductId())
                .productName(s.getProductName())
                .category(s.getCategory())
                .currentPrice(s.getCurrentPrice())
                .suggestedDiscount(s.getSuggestedDiscount())
                .promotionalPrice(s.getPromotionalPrice())
                .suggestedDate(s.getSuggestedDate())
                .reason(s.getReason())
                .status(PromotionStatus.PENDING)
                .batchId(batch.getId())
                .build()
        ).toList();

        promotionRepository.saveAll(promotions);
        return toResponse(batch, promotions);
    }

    @Transactional
    public PromotionBatchResponseDTO validateBatch(Long batchId) {
        PromotionBatch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new RuntimeException("Batch not found: " + batchId));
        batch.setBatchStatus(PromotionBatch.BatchStatus.VALIDATED);
        batch.setValidatedAt(LocalDateTime.now());
        batchRepository.save(batch);

        List<Promotion> promotions = promotionRepository.findByBatchId(batchId);
        promotions.forEach(p -> {
            p.setStatus(PromotionStatus.VALIDATED);
            p.setValidatedAt(LocalDateTime.now());
        });
        promotionRepository.saveAll(promotions);
        return toResponse(batch, promotions);
    }

    @Transactional
    public PromotionBatchResponseDTO rejectBatch(Long batchId) {
        PromotionBatch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new RuntimeException("Batch not found: " + batchId));
        batch.setBatchStatus(PromotionBatch.BatchStatus.REJECTED);
        batchRepository.save(batch);

        List<Promotion> promotions = promotionRepository.findByBatchId(batchId);
        promotions.forEach(p -> p.setStatus(PromotionStatus.REJECTED));
        promotionRepository.saveAll(promotions);
        return toResponse(batch, promotions);
    }

    public List<PromotionResponseDTO> getValidatedPromotions() {
        return promotionRepository.findByStatus(PromotionStatus.VALIDATED)
                .stream().map(this::toPromotionResponse).toList();
    }

    public PromotionBatchResponseDTO getBatch(Long batchId) {
        PromotionBatch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new RuntimeException("Batch not found: " + batchId));
        return toResponse(batch, promotionRepository.findByBatchId(batchId));
    }

    public List<PromotionBatchResponseDTO> getAllBatches() {
        return batchRepository.findAll().stream()
                .map(b -> toResponse(b, promotionRepository.findByBatchId(b.getId())))
                .toList();
    }

    private PromotionBatchResponseDTO toResponse(PromotionBatch batch, List<Promotion> promotions) {
        return PromotionBatchResponseDTO.builder()
                .batchId(batch.getId()).batchStatus(batch.getBatchStatus())
                .totalSuggestions(batch.getTotalSuggestions()).createdAt(batch.getCreatedAt())
                .promotions(promotions.stream().map(this::toPromotionResponse).toList())
                .build();
    }

    private PromotionResponseDTO toPromotionResponse(Promotion p) {
        return PromotionResponseDTO.builder()
                .id(p.getId()).productId(p.getProductId()).productName(p.getProductName())
                .category(p.getCategory()).currentPrice(p.getCurrentPrice())
                .suggestedDiscount(p.getSuggestedDiscount()).promotionalPrice(p.getPromotionalPrice())
                .suggestedDate(p.getSuggestedDate()).reason(p.getReason()).status(p.getStatus())
                .batchId(p.getBatchId()).createdAt(p.getCreatedAt()).validatedAt(p.getValidatedAt())
                .build();
    }
}
