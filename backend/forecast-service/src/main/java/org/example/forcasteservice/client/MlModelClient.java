package org.example.forecastservice.client;


import org.example.forecastservice.dto.request.ForecastRequestDTO;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Component
public class MlModelClient {

    private final RestTemplate restTemplate = new RestTemplate();

   public Double predict(ForecastRequestDTO request) {

    String url = "http://ml-api:5000/predict";

    Map<String, Object> body = new HashMap<>();
    body.put("productId", request.getProductId());
    body.put("month", request.getMonth());
    body.put("dayOfWeek", request.getDayOfWeek());
    body.put("promo", request.getPromo());
    body.put("stockLevel", request.getStockLevel());

    try {
        Map response = restTemplate.postForObject(url, body, Map.class);

        System.out.println("🔥 ML RESPONSE = " + response);

        if (response == null || response.get("prediction") == null) {
            throw new RuntimeException("Invalid response from ML API");
        }

        return Double.valueOf(response.get("prediction").toString());

    } catch (Exception e) {
        e.printStackTrace();
        throw new RuntimeException("Error calling ML API: " + e.getMessage());
    }
}
}