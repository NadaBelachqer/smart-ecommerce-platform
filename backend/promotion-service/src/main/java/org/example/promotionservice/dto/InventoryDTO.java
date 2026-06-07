package org.example.promotionservice.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryDTO {
    private Long productId;
    private Integer stockLevel;
    private Integer reorderThreshold;
    private Integer reservedStock;
    private Boolean lowStock;
}
