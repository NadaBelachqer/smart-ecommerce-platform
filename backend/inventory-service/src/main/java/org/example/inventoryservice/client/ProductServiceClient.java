package org.example.inventoryservice.client;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.inventoryservice.dto.response.ProductCheckResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

@Component
@RequiredArgsConstructor
@Slf4j
public class ProductServiceClient {

    private final WebClient.Builder webClientBuilder;

    @Value("${product.service.url:http://product-service:8082}")
    private String productServiceUrl;

    public boolean productExists(Long productId) {
        try {
            String url = productServiceUrl + "/products/" + productId + "/exists";

            ProductCheckResponse response = webClientBuilder.build()
                    .get()
                    .uri(url)
                    .retrieve()
                    .bodyToMono(ProductCheckResponse.class)
                    .block();

            if (response == null) {
                log.warn("Réponse null pour le produit {}", productId);
                return false;
            }

            log.info("Produit {} existe = {}", productId, response.getExists());

            return Boolean.TRUE.equals(response.getExists());

        } catch (Exception e) {
            log.error("Erreur lors de la vérification du produit {}: {}", productId, e.getMessage());
            return false;
        }
    }
}