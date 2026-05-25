package org.example.pricingservice.client;

import org.example.pricingservice.dto.request.PricingRequestDTO;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Component
public class MlPricingClient {

    private final RestTemplate restTemplate = new RestTemplate();

    public Map optimizePrice(
            PricingRequestDTO request,
            Double currentPrice,
            Double cost,
            Integer stockLevel,
            Double competitorPrice,  // ✅ AJOUTER CE PARAMÈTRE
            Integer month,
            Integer dayOfWeek
    ) {

        String url = "http://localhost:8001/api/v1/pricing/optimize-price";

        Map<String, Object> body = new HashMap<>();

        body.put("product_id", request.getProductId());
        body.put("current_price", currentPrice);
        body.put("cost", cost);
        body.put("stock_level", stockLevel);
        body.put("competitor_price", competitorPrice);  // ← UTILISER LA VALEUR RÉCUPÉRÉE
        body.put("promo", 0);
        body.put("month", month);
        body.put("day_of_week", dayOfWeek);

        try {
            Map response = restTemplate.postForObject(url, body, Map.class);
            System.out.println("ML RESPONSE = " + response);
            if (response == null) {
                throw new RuntimeException("Invalid ML response");
            }
            return response;
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Error calling ML API: " + e.getMessage());
        }
    }
}