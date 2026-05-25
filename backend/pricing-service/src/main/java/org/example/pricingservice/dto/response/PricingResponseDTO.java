package org.example.pricingservice.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PricingResponseDTO {

    private Long productId;
    private Double competitorPrice;
    private Double optimalPrice;
    private Double expectedDemand;
    private Double expectedRevenue;
    private Double expectedProfit;
    private Double score;
    private String message;
    private String strategy;
    private String strategyLabel;
}