package org.example.promotionservice.client;

import org.example.promotionservice.dto.ProductWithInventoryDTO;
import org.example.promotionservice.dto.PromotionSuggestionDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.List;

@Component
public class MlPromotionClient {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${ml.promotion.url}")
    private String mlBaseUrl;

    public List<PromotionSuggestionDTO> suggestPromotions(List<ProductWithInventoryDTO> products) {
        String url = mlBaseUrl + "/suggest-promotions";
        HttpEntity<List<ProductWithInventoryDTO>> request = new HttpEntity<>(products,
                new HttpHeaders() {{ setContentType(MediaType.APPLICATION_JSON); }});
        ResponseEntity<List<PromotionSuggestionDTO>> response = restTemplate.exchange(
                url, HttpMethod.POST, request, new ParameterizedTypeReference<>() {});
        return response.getBody();
    }
}
