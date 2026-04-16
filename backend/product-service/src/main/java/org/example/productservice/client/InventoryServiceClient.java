package org.example.productservice.client;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.productservice.dto.InventoryRequestDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

@Component
@RequiredArgsConstructor
@Slf4j
public class InventoryServiceClient {

    private final WebClient.Builder webClientBuilder;

    @Value("${inventory.service.url:http://localhost:8083}")
    private String inventoryServiceUrl;

    public void createInventoryForProduct(Long productId) {
        try {
            InventoryRequestDTO request = InventoryRequestDTO.builder()
                    .productId(productId)
                    .stockLevel(0)
                    .reorderThreshold(10)
                    .reservedStock(0)
                    .build();
            webClientBuilder.build()
                    .post()
                    .uri(inventoryServiceUrl + "/inventory")
                    .bodyValue(request)
                    .retrieve()
                    .toBodilessEntity()
                    .block();
            log.info("Inventaire créé avec succès pour le produit {}", productId);
        } catch (Exception e) {
            log.error("Erreur lors de la création de l'inventaire pour le produit {}: {}", productId, e.getMessage());
        }
    }
}