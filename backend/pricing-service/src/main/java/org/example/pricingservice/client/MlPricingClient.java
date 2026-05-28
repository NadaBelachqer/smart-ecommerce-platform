package org.example.pricingservice.client;

import org.example.pricingservice.dto.request.PricingRequestDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.stereotype.Component;

import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@Component
public class MlPricingClient {

    private final RestTemplate restTemplate;

    @Value("${ml.api.url:http://ml-api:5000}")
    private String mlApiUrl;

    public MlPricingClient(RestTemplateBuilder builder) {
        this.restTemplate = builder
                .setConnectTimeout(Duration.ofMillis(5000))
                .setReadTimeout(Duration.ofMillis(30000))
                .build();
    }

    public Map<String, Object> optimizePrice(
            PricingRequestDTO request,
            Double currentPrice,
            Double cost,
            Integer stockLevel,
            Double competitorPrice,
            Integer month,
            Integer dayOfWeek
    ) {
        String url = mlApiUrl + "/api/v1/pricing/optimize-price";

        Map<String, Object> body = new HashMap<>();
        body.put("product_id", request.getProductId());
        body.put("current_price", currentPrice);
        body.put("cost", cost);
        body.put("stock_level", stockLevel);
        body.put("competitor_price", competitorPrice);
        body.put("promo", 0);
        body.put("month", month);
        body.put("day_of_week", dayOfWeek);

        try {
            System.out.println(" [MlPricingClient] Appel ML API: " + url);
            System.out.println(" Body: " + body);

            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(url, body, Map.class);

            System.out.println(" [MlPricingClient] Réponse ML: " + response);

            if (response == null) {
                throw new RuntimeException("Invalid ML response");
            }
            return response;
        } catch (Exception e) {
            System.err.println(" [MlPricingClient] Erreur: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Error calling ML API: " + e.getMessage());
        }
    }
}