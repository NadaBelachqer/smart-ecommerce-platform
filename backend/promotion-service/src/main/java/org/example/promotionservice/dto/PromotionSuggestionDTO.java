package org.example.promotionservice.dto;

import lombok.*;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PromotionSuggestionDTO {
    private Long productId;
    private String productName;
    private String category;
    private Double currentPrice;
    private Double suggestedDiscount;
    private Double promotionalPrice;
    private LocalDate suggestedDate;
    private String reason;
}
