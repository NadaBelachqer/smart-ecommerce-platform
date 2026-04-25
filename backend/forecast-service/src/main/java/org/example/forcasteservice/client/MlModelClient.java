package org.example.forecastservice.client;

import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Component
public class MlModelClient {

    private final RestTemplate restTemplate = new RestTemplate();

    public Double predict(Long productId, Integer days) {

        String url = "http://localhost:5000/predict";

        Map<String, Object> request = new HashMap<>();
        request.put("productId", productId);
        request.put("days", days);

        Map response = restTemplate.postForObject(url, request, Map.class);

        return Double.valueOf(response.get("prediction").toString());
    }
}