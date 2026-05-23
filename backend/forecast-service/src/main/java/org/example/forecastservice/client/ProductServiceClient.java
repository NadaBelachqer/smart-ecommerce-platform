package org.example.forecastservice.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Component
@Slf4j
public class ProductServiceClient {

    private final RestTemplate restTemplate;

    @Value("${product.service.url:http://product-service:8082}")
    private String productServiceUrl;

    public ProductServiceClient() {
        this.restTemplate = new RestTemplate();
    }

    public boolean productExists(Long productId) {
        try {
            String url = productServiceUrl + "/products/" + productId + "/exists";
            Map response = restTemplate.getForObject(url, Map.class);
            if (response == null) {
                log.warn("Réponse null pour le produit {}", productId);
                return false;
            }
            Object exists = response.get("exists");
            log.info("Produit {} existe = {}", productId, exists);
            return Boolean.TRUE.equals(exists);
        } catch (Exception e) {
            log.error("Erreur lors de la vérification du produit {} : {}", productId, e.getMessage());
            return false;
        }
    }
}
