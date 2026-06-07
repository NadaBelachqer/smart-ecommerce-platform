package org.example.promotionservice.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductWithInventoryDTO {
    private Long id;
    private String name;
    private String category;
    private Double sellingPrice;
    private Integer stockLevel;
    private Integer reorderThreshold;
    private Integer reservedStock;
    private Boolean lowStock;
}
