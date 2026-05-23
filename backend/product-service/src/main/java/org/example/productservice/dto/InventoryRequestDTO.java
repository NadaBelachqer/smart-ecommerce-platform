package org.example.productservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryRequestDTO {
    private Long productId;
    private Integer stockLevel;
    private Integer reorderThreshold;
    private Integer reservedStock;
}