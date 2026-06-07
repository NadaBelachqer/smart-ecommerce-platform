package org.example.promotionservice.dto;

import lombok.*;
import org.example.promotionservice.entity.PromotionStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PromotionResponseDTO {
    private Long id;
    private Long productId;
    private String productName;
    private String category;
    private Double currentPrice;
    private Double suggestedDiscount;
    private Double promotionalPrice;
    private LocalDate suggestedDate;
    private String reason;
    private PromotionStatus status;
    private Long batchId;
    private LocalDateTime createdAt;
    private LocalDateTime validatedAt;
}
