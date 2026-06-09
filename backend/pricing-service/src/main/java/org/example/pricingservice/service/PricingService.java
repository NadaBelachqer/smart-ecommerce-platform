package org.example.pricingservice.service;

import lombok.RequiredArgsConstructor;
import org.example.pricingservice.client.MlPricingClient;
import org.example.pricingservice.client.ProductClient;
import org.example.pricingservice.client.InventoryClient;
import org.example.pricingservice.dto.request.PricingRequestDTO;
import org.example.pricingservice.dto.response.PricingResponseDTO;
import org.example.pricingservice.dto.response.ProductResponseDTO;
import org.example.pricingservice.entity.PricingHistory;
import org.example.pricingservice.entity.PricingStatus;
import org.example.pricingservice.repository.PricingRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PricingService {

    private final MlPricingClient mlPricingClient;
    private final PricingRepository pricingRepository;
    private final ProductClient productClient;
    private final InventoryClient inventoryClient;
    private final CompetitorPriceService competitorPriceService;

    public PricingResponseDTO optimize(PricingRequestDTO request) {

        long startTime = System.currentTimeMillis();

        try {
            System.out.println("🚀 [PricingService] Début optimisation pour produit ID: " + request.getProductId());

            // 1. Récupérer les infos produit
            ProductResponseDTO product = productClient.getProduct(request.getProductId());
            if (product == null) {
                throw new RuntimeException("Produit non trouvé avec ID: " + request.getProductId());
            }
            System.out.println("📦 Produit: " + product.getName() + " | Prix: " + product.getSellingPrice() + " DH");

            // 2. Récupérer le stock
            Integer stockLevel = inventoryClient.getStockLevel(request.getProductId());
            System.out.println("📊 Stock niveau: " + stockLevel);

            // 3. Récupérer le prix concurrent (fallback uniquement pour V1)
            Double competitorPrice = competitorPriceService.getLowestCompetitorPrice(
                    product.getSellingPrice(),
                    product.getSku(),
                    product.getName()
            );

            // 4. Calculer les infos temporelles
            LocalDate today = LocalDate.now();
            int month = today.getMonthValue();
            int dayOfWeek = today.getDayOfWeek().getValue();

            // 5. Appeler le ML
            Map result = mlPricingClient.optimizePrice(
                    request,
                    product.getSellingPrice(),
                    product.getCost(),
                    stockLevel,
                    competitorPrice,
                    month,
                    dayOfWeek
            );

            // 6. Extraire les résultats
            Double optimalPrice = Double.valueOf(result.get("optimal_price").toString());
            Double expectedDemand = Double.valueOf(result.get("expected_demand").toString());
            Double expectedRevenue = Double.valueOf(result.get("expected_revenue").toString());
            Double expectedProfit = Double.valueOf(result.get("expected_profit").toString());
            Double score = Double.valueOf(result.get("score").toString());
            String strategy = result.get("strategy") != null ? result.get("strategy").toString() : "UNKNOWN";
            String strategyLabel = result.get("strategy_label") != null ? result.get("strategy_label").toString() : "Stratégie standard";

            // 7. Sauvegarder l'historique
            PricingHistory history = PricingHistory.builder()
                    .productId(request.getProductId())
                    .currentPrice(product.getSellingPrice())
                    .optimalPrice(optimalPrice)
                    .expectedDemand(expectedDemand)
                    .expectedRevenue(expectedRevenue)
                    .expectedProfit(expectedProfit)
                    .competitorPrice(competitorPrice)
                    .pricingDate(LocalDateTime.now())
                    .createdAt(LocalDateTime.now())
                    .strategy(strategy)
                    .strategyLabel(strategyLabel)
                    .build();
            pricingRepository.save(history);

            long executionTime = System.currentTimeMillis() - startTime;
            System.out.println("✅ [PricingService] Optimisation terminée en " + executionTime + "ms");

            // 8. Retourner la réponse
            // 8. Retourner la réponse (avec competitorPrice)
            return PricingResponseDTO.builder()
                    .historyId(history.getId())
                    .productId(request.getProductId())
                    .optimalPrice(optimalPrice)
                    .expectedDemand(expectedDemand)
                    .expectedRevenue(expectedRevenue)
                    .expectedProfit(expectedProfit)
                    .score(score)
                    .competitorPrice(competitorPrice)
                    .strategy(strategy)
                    .strategyLabel(strategyLabel)
                    .message("Prix optimal généré avec succès (Version 1.0 - Fallback)")
                    .build();

        } catch (Exception e) {
            System.err.println("❌ [PricingService] Erreur: " + e.getMessage());
            e.printStackTrace();
            return PricingResponseDTO.builder()
                    .message("ERREUR: " + e.getMessage())
                    .build();
        }
    }

    // HISTORIQUE
    public List<PricingHistory> history(Long productId) {
        return pricingRepository.findByProductId(productId);
    }

    // APPLIQUER LE PRIX OPTIMAL
    public PricingHistory applyPrice(Long historyId) {
        PricingHistory history = pricingRepository.findById(historyId)
                .orElseThrow(() -> new RuntimeException("Historique non trouvé: " + historyId));

        productClient.updateSellingPrice(history.getProductId(), history.getOptimalPrice());

        history.setStatus(PricingStatus.APPLIED);
        history.setAppliedAt(LocalDateTime.now());
        return pricingRepository.save(history);
    }

    // LISTE DES PRODUITS AVEC PRIX IA APPLIQUÉ
    public List<Long> getOptimizedProductIds() {
        return pricingRepository.findByStatus(PricingStatus.APPLIED)
                .stream()
                .map(PricingHistory::getProductId)
                .distinct()
                .toList();
    }
}