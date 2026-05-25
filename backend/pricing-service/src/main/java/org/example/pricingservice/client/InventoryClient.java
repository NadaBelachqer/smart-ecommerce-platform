package org.example.pricingservice.client;

import org.example.pricingservice.dto.response.InventoryResponseDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
public class InventoryClient {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${inventory.service.url:http://localhost:8083}")
    private String inventoryServiceUrl;

    public Integer getStockLevel(Long productId) {
        if (productId == null) {
            throw new RuntimeException("Product ID cannot be null");
        }

        String url = inventoryServiceUrl + "/inventory/" + productId;
        System.out.println("Calling Inventory Service: " + url);

        try {
            InventoryResponseDTO response = restTemplate.getForObject(url, InventoryResponseDTO.class);
            if (response == null || response.getStockLevel() == null) {
                throw new RuntimeException("Stock level not found for product " + productId);
            }
            System.out.println("Stock level for product " + productId + ": " + response.getStockLevel());
            return response.getStockLevel();
        } catch (Exception e) {
            System.err.println("Error fetching inventory: " + e.getMessage());
            throw new RuntimeException("Failed to fetch stock level for product " + productId + ": " + e.getMessage());
        }
    }
}