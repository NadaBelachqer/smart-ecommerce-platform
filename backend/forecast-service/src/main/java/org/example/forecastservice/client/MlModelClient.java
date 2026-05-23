package org.example.forecastservice.client;

import org.example.forecastservice.dto.request.ForecastRequestDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@Component
public class MlModelClient {

    private final RestTemplate restTemplate;

    @Value("${ml.api.url:http://ml-api:5000}")
    private String mlApiUrl;

    public MlModelClient(RestTemplateBuilder builder) {
        this.restTemplate = builder
                .connectTimeout(Duration.ofMillis(5000))
                .readTimeout(Duration.ofMillis(30000))
                .build();
    }

    public Double predict(ForecastRequestDTO request) {

        String url = mlApiUrl + "/predict";

        Map<String, Object> body = new HashMap<>();
        body.put("productId", request.getProductId());
        body.put("month", request.getMonth());
        body.put("dayOfWeek", request.getDayOfWeek());
        body.put("promo", request.getPromo());
        body.put("stockLevel", request.getStockLevel());

        try {
            Map response = restTemplate.postForObject(url, body, Map.class);

            System.out.println("ML RESPONSE = " + response);

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
