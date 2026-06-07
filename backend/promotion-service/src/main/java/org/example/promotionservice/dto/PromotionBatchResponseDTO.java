package org.example.promotionservice.dto;

import lombok.*;
import org.example.promotionservice.entity.PromotionBatch;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PromotionBatchResponseDTO {
    private Long batchId;
    private PromotionBatch.BatchStatus batchStatus;
    private Integer totalSuggestions;
    private LocalDateTime createdAt;
    private List<PromotionResponseDTO> promotions;
}
