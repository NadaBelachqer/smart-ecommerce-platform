package org.example.pricingservice.client;

import org.example.pricingservice.dto.response.ProductResponseDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
public class ProductClient {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${product.service.url:http://localhost:8082}")
    private String productServiceUrl;

    public ProductResponseDTO getProduct(Long productId) {
        if (productId == null) {
            throw new RuntimeException("Product ID cannot be null");
        }

        String url = productServiceUrl + "/api/products/" + productId;

        // Essayer avec et sans /api
        try {
            System.out.println("📞 [ProductClient] Appel: " + url);
            ProductResponseDTO response = restTemplate.getForObject(url, ProductResponseDTO.class);

            if (response == null) {
                throw new RuntimeException("Réponse null du product service");
            }

            System.out.println("✅ [ProductClient] Produit récupéré: " + response.getName());
            return response;

        } catch (Exception e) {
            // Fallback: URL sans /api
            String url2 = productServiceUrl + "/products/" + productId;
            System.out.println("📞 [ProductClient] Tentative alternative: " + url2);

            try {
                ProductResponseDTO response = restTemplate.getForObject(url2, ProductResponseDTO.class);
                if (response == null) {
                    throw new RuntimeException("Réponse null du product service");
                }
                return response;
            } catch (Exception e2) {
                System.err.println("❌ [ProductClient] Erreur: " + e2.getMessage());
                throw new RuntimeException("Impossible de récupérer le produit " + productId + ": " + e2.getMessage());
            }
        }
    }
}