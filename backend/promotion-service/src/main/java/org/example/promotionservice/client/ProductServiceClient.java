package org.example.promotionservice.client;

import org.example.promotionservice.dto.ProductDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Component
public class ProductServiceClient {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${services.product.url}")
    private String productServiceUrl;

    @SuppressWarnings("unchecked")
    public List<ProductDTO> getAllProducts() {
        String url = productServiceUrl + "/products?page=0&size=200";
        ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, null, Map.class);
        List<Map<String, Object>> content = (List<Map<String, Object>>) response.getBody().get("content");
        return content.stream().map(p -> ProductDTO.builder()
                .id(((Number) p.get("id")).longValue())
                .name((String) p.get("name"))
                .category((String) p.get("category"))
                .sellingPrice(p.get("sellingPrice") != null ? ((Number) p.get("sellingPrice")).doubleValue() : 0.0)
                .build()
        ).toList();
    }
}
