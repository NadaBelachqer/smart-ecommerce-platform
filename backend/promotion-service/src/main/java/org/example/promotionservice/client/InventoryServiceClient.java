package org.example.promotionservice.client;

import org.example.promotionservice.dto.InventoryDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Component
public class InventoryServiceClient {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${services.inventory.url}")
    private String inventoryServiceUrl;

    @SuppressWarnings("unchecked")
    public InventoryDTO getInventoryByProductId(Long productId) {
        String url = inventoryServiceUrl + "/inventory/" + productId;

        try {
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                url, HttpMethod.GET, null, new ParameterizedTypeReference<>() {});

            Map<String, Object> body = response.getBody();
            if (body == null) {
                return defaultInventory(productId);
            }

            return InventoryDTO.builder()
                    .productId(body.get("productId") != null ? ((Number) body.get("productId")).longValue() : productId)
                    .stockLevel(body.get("stockLevel") != null ? ((Number) body.get("stockLevel")).intValue() : 0)
                    .reorderThreshold(body.get("reorderThreshold") != null ? ((Number) body.get("reorderThreshold")).intValue() : 0)
                    .reservedStock(body.get("reservedStock") != null ? ((Number) body.get("reservedStock")).intValue() : 0)
                    .lowStock(body.get("lowStock") != null && (Boolean) body.get("lowStock"))
                    .build();
        } catch (HttpClientErrorException.NotFound e) {
            return defaultInventory(productId);
        }
    }

    private InventoryDTO defaultInventory(Long productId) {
        return InventoryDTO.builder()
                .productId(productId)
                .stockLevel(0)
                .reorderThreshold(0)
                .reservedStock(0)
                .lowStock(false)
                .build();
    }
}
